import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import ffmpeg from 'fluent-ffmpeg'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeFile, readFile, unlink } from 'fs/promises'
import { uploadToGCS } from "../../utils/storage"
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


export async function POST(req: NextRequest) {
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
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "whisper-1",
    })

     // Clean up temporary files
     await Promise.all([
      unlink(inputPath),
      unlink(outputPath)
    ]).catch(console.error)

    return NextResponse.json({ transcription: transcription.text, audioUrl: audioUrl, uniqueId: uniqueId })
  } catch (error) {
    console.error("Error processing video:", error)
    return NextResponse.json({ error: "Error processing video" }, { status: 500 })
  }
}
