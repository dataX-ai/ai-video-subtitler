"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import VideoPlayer from "./VideoPlayer"
import TranscriptionEditor from "./TranscriptionEditor"
import ProgressBar from "./ProgressBar"

export default function VideoUploader() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string>("")
  const [audioUrl,setAudioUrl] = useState<string>("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [uniqueId, setUniqueId] = useState("");
  const [isAddingSubtitles, setIsAddingSubtitles] = useState(false)
  const [subtitledVideoUrl, setSubtitledVideoUrl] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setVideoFile(file)
      setVideoUrl(URL.createObjectURL(file))
    }
  }

  const handleTranscribe = async () => {
    if (!videoFile) return

    setIsTranscribing(true)
    const formData = new FormData()
    formData.append("video", videoFile)

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      setTranscription(data.transcription)
      setAudioUrl(data.audioUrl)
      setUniqueId(data.uniqueId)
    } catch (error) {
      console.error("Error transcribing video:", error)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleAddSubtitles = async () => {
    if (!videoFile || !transcription) return

    setIsAddingSubtitles(true)
    const formData = new FormData()
    formData.append("video", videoFile)
    formData.append("transcription", transcription)
    formData.append("audioUrl",audioUrl)
    formData.append("uniqueId",uniqueId)

    try {
      const response = await fetch("/api/add-subtitles", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      setSubtitledVideoUrl(data.subtitledVideoUrl)
    } catch (error) {
      console.error("Error adding subtitles:", error)
    } finally {
      setIsAddingSubtitles(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input type="file" accept="video/*" onChange={handleFileChange} />
      {videoUrl && <VideoPlayer src={videoUrl} />}
      {videoUrl && !isTranscribing && !transcription && <Button onClick={handleTranscribe}>Transcribe Video</Button>}
      {isTranscribing && <ProgressBar progress={50} />}
      {transcription && <TranscriptionEditor transcription={transcription} setTranscription={setTranscription} />}
      {transcription && !isAddingSubtitles && <Button onClick={handleAddSubtitles}>Add Subtitles</Button>}
      {isAddingSubtitles && <ProgressBar progress={75} />}
      {subtitledVideoUrl && <VideoPlayer src={subtitledVideoUrl} />}
    </div>
  )
}

