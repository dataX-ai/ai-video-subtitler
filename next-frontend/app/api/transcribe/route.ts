import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { AzureOpenAI } from "openai";
import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeFile, readFile, unlink } from 'fs/promises'
import { uploadToGCS } from "../../utils/storage"
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import withAPIMetrics from "@/hooks/use-metrics";
let transcriptionClient: OpenAI | AzureOpenAI;

class TranscribeRouteHandler {
  static async POST(req: NextRequest) {
    
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "Your endpoint";
    const apiKey = process.env.AZURE_OPENAI_API_KEY || "Your API key";
    const apiVersion = process.env.OPENAI_API_VERSION || "2024-08-01-preview";
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "whisper";
    const transcriptionService = process.env.TRANSCRIPTION_SERVICE || "AZURE";
    const localASRModelURL = process.env.AI_BACKEND_URL;

    try {
      if (transcriptionService === "AZURE") {
        transcriptionClient = new AzureOpenAI({
          endpoint,
          apiKey,
          apiVersion,
          deployment: deploymentName,
        });
      } else {
        transcriptionClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      }
    } catch (error) {
      console.error("ERROR: transcribe :: Error creating transcription client:", error)
      return NextResponse.json({ error: "Error creating transcription client" }, { status: 500 })
    }

    const formData = await req.formData()
    const video = formData.get("video") as File
    
    if (!video) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    try {
      // Generate unique file names
      const uniqueId = uuidv4();
      const inputPath = join(tmpdir(), `${uniqueId}-input.mp4`);
      const outputPath = join(tmpdir(), `${uniqueId}-output.mp3`);

      // Save video to temp file
      const videoBuffer = Buffer.from(await video.arrayBuffer())
      await writeFile(inputPath, videoBuffer)

      // Convert video to audio
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat('mp3')
          .audioFrequency(16000)
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath)
      })

      // Create file for OpenAI API
      const audioArray = await readFile(outputPath)
      const audioBlob = new Blob([audioArray], { type: 'audio/mp3' })


      const audioUrl = await uploadToGCS(audioBlob,"audio",uniqueId)
      
      let transcription;
      try {
        transcription = await transcriptionClient.audio.transcriptions.create({
          file: fs.createReadStream(outputPath),
          model: "whisper-1",
          response_format: "verbose_json"
        });
        console.debug(`Transcription result for ${uniqueId}:`, transcription);
      } catch (transcriptionError) {
        console.error("ERROR: Primary transcription failed:", transcriptionError);
        
        // Fallback to local ASR model if available
        if (localASRModelURL) {
          try {
            console.log(`Attempting fallback to local ASR model at ${localASRModelURL}`);
            
            // Create form data for the local request
            const localFormData = new FormData();
            localFormData.append('audio_file', audioBlob, 'audio.mp3');
            
            // Make request to local model
            const localResponse = await fetch(`${localASRModelURL}/asr?output=json`, {
              method: 'POST',
              body: localFormData,
            });
            
            if (!localResponse.ok) {
              throw new Error(`Local ASR model returned status ${localResponse.status}`);
            }
            
            const localResult = await localResponse.json();
            
            // Ensure the response format matches what we expect
            transcription = {
              text: localResult.text || localResult.transcription,
              segments: localResult.segments || [],
            };
            
            console.log(`Successfully used local ASR model for ${uniqueId}`);
          } catch (localError) {
            console.error("ERROR: Local ASR model also failed:", localError);
            throw transcriptionError; // Throw the original error
          }
        } else {
          // No local fallback available
          throw transcriptionError;
        }

      }
      
      const simplifiedSegments = transcription.segments?.map(({ id, start, end, text }) => ({
        id,
        start,
        end,
        text
      })) || [];

      // Clean up temporary files
      await Promise.all([
        unlink(inputPath),
        unlink(outputPath)
      ]).catch(console.error)

      return NextResponse.json({ transcription: transcription.text, segments: simplifiedSegments, audioUrl: audioUrl, uniqueId: uniqueId })
    } catch (error) {
      console.error("ERROR: transcribe :: Error processing video:", error)
      return NextResponse.json({ error: "Error processing video" }, { status: 500 })
    }
  }
}


export const POST = withAPIMetrics(TranscribeRouteHandler.POST);