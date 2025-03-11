import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { uploadToGCS } from "../../utils/storage"
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
  subtitlePosition: { x: number, y: number },
  subtitleColors: { 
    line1: { text: string, background: string },
    line2: { text: string, background: string }
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
  const assContent = generateAssSubtitles(
    segments,
    subtitleFont,
    subtitlePosition,
    subtitleColors,
    subtitleSize,
    width,
    height
  )
  
  // Write subtitle file
  await writeFileAsync(subtitlePath, assContent)
  console.log("subtitlePath", subtitlePath)
  console.log("videoPath", tmpDir)
  
  // Update the ffmpeg command to use ass filter instead of subtitles filter
  await execAsync(
    `ffmpeg -y -i "${videoPath.replace(/\\/g, '/')}" -vf "ass='${subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:')}'" -c:v libx264 -preset slow -crf 18 -c:a copy "${outputVideoPath.replace(/\\/g, '/')}"`
  )
  
  // Upload to GCS
  // const buffer = await fs.promises.readFile(outputVideoPath)
  // const file = new File([buffer], `${uniqueId}_subtitled.mp4`, { type: 'video/mp4' })
  // const outputUrl = await uploadToGCS(
  //   file,
  //   "subtitled_video",
  //   uniqueId
  // )
  
  // Clean up temporary files
  // try {
  //   // Read directory contents
  //   const files = fs.readdirSync(tmpDir)
    
  //   // Remove all files in directory
  //   for (const file of files) {
  //     fs.unlinkSync(path.join(tmpDir, file))
  //   }
    
  //   // Then remove the directory
  //   fs.rmdirSync(tmpDir)
  // } catch (e) {
  //   console.error("Error cleaning up temp files:", e)
  // }
  
  return outputVideoPath
}

function splitIntoLines(text: string, maxCharsPerLine: number = 50): string {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine = currentLine ? `${currentLine} ${word}` : word
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  })
  
  if (currentLine) lines.push(currentLine)
  
  return lines.join('\\N')
}

function generateAssSubtitles(
  segments: any[],
  font: string,
  position: { x: number, y: number },
  colors: { 
    line1: { text: string, background: string },
    line2: { text: string, background: string }
  },
  fontSize: number,
  videoWidth: number,
  videoHeight: number
): string {
  // Convert colors from hex to ASS format (AABBGGRR)
  const primaryColor = hexToAssColor(colors.line1.text)
  const outlineColor = hexToAssColor(colors.line1.background)
  
  let assContent = `[Script Info]
Title: Auto-generated subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${fontSize},&H${primaryColor},&H${outlineColor},&H${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,2,0,2,0,${position.y},10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  // Add each segment as a dialogue line with modified text
  segments.forEach(segment => {
    const startTime = formatAssTime(segment.start)
    const endTime = formatAssTime(segment.end)
    
    // Split text into multiple lines without blur effect
    const formattedText = splitIntoLines(segment.text)
    
    assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${formattedText}\n`
  })
  
  return assContent
}

// Helper function to convert hex color to ASS format
function hexToAssColor(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Parse the hex color
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Convert to ASS format: AABBGGRR (alpha, blue, green, red)
  return `00${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`
}

// Helper function to format time into ASS format (h:mm:ss.cc)
function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const cs = Math.floor((seconds % 1) * 100)
  
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
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

    if (!video || !transcription) {
      return NextResponse.json({ error: "Video and transcription are required" }, { status: 400 })
    }

    // Upload the original video to GCS
    // const videoUrl = await uploadToGCS(video, "video", uniqueId)
    
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


