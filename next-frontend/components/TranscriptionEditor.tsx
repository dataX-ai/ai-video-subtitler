import { Textarea } from "@/components/ui/textarea"

interface TranscriptionEditorProps {
  transcription: string
  setTranscription: (transcription: string) => void
}

export default function TranscriptionEditor({ transcription, setTranscription }: TranscriptionEditorProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Edit Transcription</h2>
      <Textarea value={transcription} onChange={(e) => setTranscription(e.target.value)} rows={10} className="w-full" />
    </div>
  )
}

