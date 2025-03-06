import { Storage } from '@google-cloud/storage'
import fs from "fs"
import path from "path"
import { tmpdir } from 'os'

export async function uploadToGCS(file: Blob, type: String,uniqueId:string): Promise<string> {
  // Initialize Google Cloud Storage

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_BUCKET_NAME) {
    throw new Error('Google Credentials are not set')
  }

  const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
  })


  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || ''
  const bucket = storage.bucket(bucketName)
  
  // Save file to temporary location
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  // Generate a unique filename since Blobs don't have names
  const extension = type === 'video' ? '.mp4' : '.mp3'
  const filename = `${type}-${uniqueId}${extension}`
  const tempFilePath = path.join(tmpdir(), filename)
  fs.writeFileSync(tempFilePath, buffer)

  try {
    // Generate unique filename
    let fileName: string;
    if (type === 'video') {
      fileName = `videos-${uniqueId}.mp4`;
    } else {
      fileName = `audios-${uniqueId}.mp3`;
    }
    
    // Upload file to Google Cloud Storage
    await bucket.upload(tempFilePath, {
      destination: fileName,
      metadata: {
        contentType: 'audio/mp3',
      },
    })

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`
    return publicUrl
  } finally {
    // Clean up temporary file
    fs.unlinkSync(tempFilePath)
  }
}
