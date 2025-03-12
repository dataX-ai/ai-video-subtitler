import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { uploadToGCS } from "../../utils/storage"
import { generateAssContent, SubtitleStyle } from "../../utils/subtitle-utils"
import fs from 'fs'
import path from 'path'
import os from 'os'

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
  console.log(outputVideoPath)
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
  console.log("assContent", assContent)
  // Write subtitle file
  await writeFileAsync(subtitlePath, assContent)
  console.log("subtitlePath", subtitlePath)
  console.log("videoPath", tmpDir)
  
  const ffmpeg_command = `ffmpeg -y -i "${videoPath.replace(/\\/g, '/')}" -vf "ass='${subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:')}'" -c:v libx264 -preset fast -crf 18 -threads 0 -c:a copy "${outputVideoPath.replace(/\\/g, '/')}"`
  console.log("ffmpeg_command", ffmpeg_command)
  await execAsync(
    ffmpeg_command
  )
  
  // Upload to GCS
  const buffer = await fs.promises.readFile(outputVideoPath)
  const file = new File([buffer], `${uniqueId}_subtitled.mp4`, { type: 'video/mp4' })
  const outputUrl = await uploadToGCS(
    file,
    "subtitled_video",
    uniqueId
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
  console.log("outputUrl", outputUrl)
  return outputUrl
}

export async function POST(req: NextRequest) {
  console.log("Headers:", Object.fromEntries(req.headers))
  
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
    console.log(video)
    console.log(audioUrl)
    console.log(transcription)
    console.log(segments)
    console.log(subtitleFont)
    console.log(subtitlePosition)
    console.log(subtitleColors)
    console.log(subtitleSize)
    
    if (!video || !transcription) {
      return NextResponse.json({ error: "Video and transcription are required" }, { status: 400 })
    }


    const uploadPromise = uploadToGCS(video, "video", uniqueId)
    uploadPromise.catch(err => console.error("Background upload of original video failed:", err))
    console.log("Original Video - Uploaded Job started: ", uniqueId)
    
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
    
    // Remove the cleanup code from here since it's already done in burnSubtitles
    return NextResponse.json({ subtitledVideoUrl })
  } catch (error) {
    console.error("Error parsing form data:", error)
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }
}


