"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, Trash2, Pause, Loader2, Cloud, UploadCloud } from "lucide-react"
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
  const [mounted, setMounted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [audioId, setAudioId] = useState<string | null>(initialAudioId || null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setMounted(true)
    if (initialAudioId && !initialAudioUrl) {
      loadLocalAudio(initialAudioId)
    }
  }, [initialAudioId, initialAudioUrl])

  async function loadLocalAudio(id: string) {
    try {
      const blob = await getAudio(id)
      if (blob) {
        setAudioUrl(URL.createObjectURL(blob))
      }
    } catch (e) {
      console.error("Local audio load failed", e)
    }
  }

  const getSupportedMimeType = () => {
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  }

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      alert("Recording not supported on this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType();

      mediaRecorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: mimeType || 'audio/wav' })
        const localId = `audio-${Date.now()}`

        await saveAudio(localId, audioBlob)
        setAudioId(localId)

        setIsUploading(true)
        try {
          const supabase = createClient()
          // Use correct extension based on mimeType
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
          const fileName = `${localId}.${ext}`

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
          console.error("Cloud sync failed", err)
          setAudioUrl(URL.createObjectURL(audioBlob))
          onAudioSaved(localId)
        } finally {
          setIsUploading(false)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      alert("Microphone access denied. Please enable microphone permissions in your settings.")
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
        audioRef.current.play().catch(() => setIsPlaying(false))
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

  if (!mounted) return <div className="h-24 bg-neutral-900 border border-border rounded-lg animate-pulse" />

  return (
    <div className="flex flex-col gap-3 p-4 bg-neutral-900 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          Audio Journal {isUploading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        </label>
        {audioUrl && (
          <button type="button" onClick={handleDelete} className="text-danger hover:text-danger/80 transition-colors p-1">
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
              "flex items-center justify-center w-14 h-14 rounded-full transition-all shadow-xl active:scale-90",
              isRecording ? "bg-danger animate-pulse" : "bg-white text-black hover:bg-neutral-200"
            )}
          >
            {isRecording ? <Square className="w-6 h-6 fill-white" /> : <Mic className="w-6 h-6" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-white text-black hover:bg-neutral-200 transition-all shadow-xl active:scale-90"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
          </button>
        )}

        <div className="flex-1">
          {isRecording ? (
            <div className="text-[11px] font-black uppercase text-danger animate-pulse tracking-widest">Recording...</div>
          ) : isUploading ? (
            <div className="text-[11px] font-black uppercase text-primary animate-pulse tracking-widest">Syncing to Cloud...</div>
          ) : audioUrl ? (
            <div className="text-[11px] font-black uppercase text-success tracking-widest flex items-center gap-2">
              <UploadCloud className="w-4 h-4" /> Memo Secured
            </div>
          ) : (
            <div className="text-[10px] font-black uppercase text-neutral-500 tracking-widest italic leading-tight">Tap icon to record voice analysis</div>
          )}
        </div>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
          playsInline
        />
      )}
    </div>
  )
}
