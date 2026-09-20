"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, Trash2, Pause, Loader2, CloudUpload } from "lucide-react"
import { saveAudio, getAudio, deleteAudio } from "@/lib/audio-storage"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
  onAudioSaved: (audioId: string, audioUrl?: string) => void
  initialAudioId?: string
  initialAudioUrl?: string
  onDelete?: () => void
}

export default function AudioRecorder({ onAudioSaved, initialAudioId, initialAudioUrl, onDelete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [audioId, setAudioId] = useState<string | null>(initialAudioId || null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (initialAudioId && !initialAudioUrl) {
      loadLocalAudio(initialAudioId)
    }
  }, [initialAudioId, initialAudioUrl])

  async function loadLocalAudio(id: string) {
    const blob = await getAudio(id)
    if (blob) {
      setAudioUrl(URL.createObjectURL(blob))
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        const localId = `audio-${Date.now()}`

        // 1. Save locally for offline use
        await saveAudio(localId, audioBlob)
        setAudioId(localId)

        // 2. Upload to Supabase for Cloud Sync
        setIsUploading(true)
        try {
          const fileName = `${localId}.webm`
          const { data, error } = await supabase.storage
            .from('trade-audios')
            .upload(fileName, audioBlob)

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('trade-audios')
            .getPublicUrl(fileName)

          setAudioUrl(publicUrl)
          onAudioSaved(localId, publicUrl)
        } catch (err) {
          console.error("Cloud upload failed:", err)
          setAudioUrl(URL.createObjectURL(audioBlob))
          onAudioSaved(localId) // Still works locally
        } finally {
          setIsUploading(false)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Error accessing microphone:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleDelete = async () => {
    if (audioId) await deleteAudio(audioId)
    setAudioId(null)
    setAudioUrl(null)
    if (onDelete) onDelete()
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-neutral-900 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          Audio Journal {isUploading && <Loader2 className="w-3 h-3 animate-spin" />}
        </label>
        {audioUrl && (
          <button onClick={handleDelete} className="text-danger hover:text-danger/80 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!audioUrl ? (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full transition-all",
              isRecording ? "bg-danger animate-pulse" : "bg-white text-black hover:bg-neutral-200"
            )}
          >
            {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-5 h-5" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:bg-neutral-200 transition-all"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
          </button>
        )}

        <div className="flex-1">
          {isRecording ? (
            <div className="text-[10px] font-black uppercase text-danger animate-pulse tracking-widest">Recording...</div>
          ) : isUploading ? (
            <div className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Syncing to Cloud...</div>
          ) : audioUrl ? (
            <div className="text-[10px] font-black uppercase text-success tracking-widest flex items-center gap-2">
              <CloudUpload className="w-3 h-3" /> Memo Secured Online
            </div>
          ) : (
            <div className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">No audio recorded</div>
          )}
        </div>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  )
}
