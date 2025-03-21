import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { uploadToGCS } from "../../utils/storage"
import { generateAssContent, SubtitleStyle } from "../../utils/subtitle-utils"
import fs from 'fs'
import path from 'path'
import os from 'os'
import withAPIMetrics from "@/hooks/use-metrics";
const execAsync = promisify(exec)
const writeFileAsync = promisify(fs.writeFile)

async function burnSubtitles(
  videoPath: string, 
  segments: any[], 
  uniqueId: string,
  subtitleFont: string,
  subtitlePosition: { y: number },
  subtitleColors: { 
    line1: { text: string, background: string }
  },
  subtitleSize: number
): Promise<string> {
  // Create temp directory for working files
  const tmpDir = path.join(os.tmpdir(), uniqueId)
  fs.mkdirSync(tmpDir, { recursive: true })
  
  // Path for subtitle file and output video
  const subtitlePath = path.join(tmpDir, `${uniqueId}.ass`)
  const outputVideoPath = path.join(tmpDir, `${uniqueId}_subtitled.mp4`)
  // Get video dimensions using ffprobe first
  const { stdout: probeOutput } = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath.replace(/\\/g, '/')}"`
  );
  const [width, height] = probeOutput.trim().split('x').map(Number);

  // Generate ASS subtitle content with video dimensions
  const subtitleStyle: SubtitleStyle = {
    font: subtitleFont,
    position: subtitlePosition,
    colors: subtitleColors,
    fontSize: subtitleSize
  }
  const assContent = await generateAssContent(
    segments,
    subtitleStyle,
    width,
    height
  )
  // Write subtitle file
  await writeFileAsync(subtitlePath, assContent)
  
  const ffmpeg_command = `ffmpeg -y -i "${videoPath.replace(/\\/g, '/')}" -vf "ass='${subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:')}'" -c:v libx264 -preset fast -crf 18 -threads 0 -c:a copy "${outputVideoPath.replace(/\\/g, '/')}"`
  await execAsync(
    ffmpeg_command
  )
  
  // Upload to GCS
  const buffer = await fs.promises.readFile(outputVideoPath)
  const file = new File([buffer], `${uniqueId}_subtitled.mp4`, { type: 'video/mp4' })
  const outputUrl = await uploadToGCS(
    file,
    "video",
    uniqueId,
    `subtitled_video_${uniqueId}_file.mp4`
  )
  
  // Clean up temporary files
  try {
    // Read directory contents
    const files = fs.readdirSync(tmpDir)
    
    // Remove all files in directory
    for (const file of files) {
      fs.unlinkSync(path.join(tmpDir, file))
    }
    
    // Then remove the directory
    fs.rmdirSync(tmpDir)
  } catch (e) {
    console.error("Error cleaning up temp files:", e)
  }
  console.debug(`Subtitle added to video ${uniqueId} : ${outputUrl}`)
  return outputUrl
}

class SubtitleRouteHandler {

  static async POST(req: NextRequest) {
    
    try {
  
      const formData = await req.formData()
      const video = formData.get("video") as File
      const audioUrl = formData.get("audioUrl") as string
      const transcription = formData.get("transcription") as string
      const segments = JSON.parse(formData.get("segments") as string)
      const uniqueId = formData.get("uniqueId") as string
      const subtitleFont = formData.get("subtitleFont") as string
      const subtitlePosition = JSON.parse(formData.get("subtitlePosition") as string)
      const subtitleColors = JSON.parse(formData.get("subtitleColors") as string)
      const subtitleSize = parseInt(formData.get("subtitleSize") as string)

      if (!video || !transcription) {
        return NextResponse.json({ error: "Video and transcription are required" }, { status: 400 })
      }

      const uploadPromise = uploadToGCS(video, "video", uniqueId)
      uploadPromise.catch(err => console.error("Background upload of original video failed:", err))
      
      // Save the video to a temporary file
      const tmpDir = path.join(os.tmpdir(), uniqueId)
      fs.mkdirSync(tmpDir, { recursive: true })
      const videoPath = path.join(tmpDir, `${uniqueId}_original.mp4`)
      
      // Convert File object to buffer and write to disk
      const arrayBuffer = await video.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await fs.promises.writeFile(videoPath, buffer)
      
      // Burn subtitles into the video
      const subtitledVideoUrl = await burnSubtitles(
        videoPath,
        segments,
        uniqueId,
        subtitleFont,
        subtitlePosition,
        subtitleColors,
        subtitleSize
      )
      
      return NextResponse.json({ subtitledVideoUrl })
    } catch (error) {
      console.error("ERROR: add-subtitles :: Error parsing form data:", error)
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
  }
}

export const POST = withAPIMetrics(SubtitleRouteHandler.POST);


