"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, Trash2, Pause, Loader2, Cloud, UploadCloud, Timer } from "lucide-react"
import { saveAudio, getAudio, deleteAudio } from "@/lib/audio-storage"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
  onAudioSaved: (audioId: string, audioUrl?: string) => void
  onUploadingStateChange?: (uploading: boolean) => void
  initialAudioId?: string
  initialAudioUrl?: string
  onDelete?: () => void
}

export default function AudioRecorder({ onAudioSaved, onUploadingStateChange, initialAudioId, initialAudioUrl, onDelete }: AudioRecorderProps) {
  const [mounted, setMounted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20) // Reduced to 20s
  const [audioId, setAudioId] = useState<string | null>(initialAudioId || null)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    if (initialAudioId && !initialAudioUrl) {
      loadLocalAudio(initialAudioId)
    }
  }, [initialAudioId, initialAudioUrl])

  useEffect(() => {
    if (onUploadingStateChange) {
      onUploadingStateChange(isUploading)
    }
  }, [isUploading, onUploadingStateChange])

  // Stop recording automatically at 20 seconds
  useEffect(() => {
    if (isRecording && timeLeft <= 0) {
      stopRecording()
    }
  }, [timeLeft, isRecording])

  async function loadLocalAudio(id: string) {
    try {
      const blob = await getAudio(id)
      if (blob) setAudioUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error("Local audio load failed", e)
    }
  }

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const types = ['audio/webm', 'audio/mp4', 'audio/wav']
      const mimeType = types.find(t => MediaRecorder.isTypeSupported(t))

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 32000
      })

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
          const ext = mimeType?.includes('mp4') ? 'mp4' : 'webm'
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
          console.error("Sync failed", err)
          setAudioUrl(URL.createObjectURL(audioBlob))
          onAudioSaved(localId)
        } finally {
          setIsUploading(false)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setTimeLeft(20)

      timerInterval.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)

    } catch (err) {
      alert("Microphone Access Denied! Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      if (timerInterval.current) clearInterval(timerInterval.current)
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause()
      else audioRef.current.play().catch(() => setIsPlaying(false))
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
    <div className="flex flex-col gap-3 p-4 bg-neutral-900/50 border border-border rounded-lg shadow-inner">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          Voice Analysis {isUploading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        </label>
        {audioUrl && !isRecording && (
          <button type="button" onClick={handleDelete} className="text-danger hover:text-danger/80 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!audioUrl || isRecording ? (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full transition-all shadow-lg active:scale-90",
              isRecording ? "bg-danger animate-pulse ring-4 ring-danger/10" : "bg-white text-black hover:bg-neutral-200"
            )}
          >
            {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-5 h-5" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:bg-neutral-200 transition-all shadow-lg active:scale-90"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
          </button>
        )}

        <div className="flex-1">
          {isRecording ? (
            <div className="flex flex-col">
              <div className="text-[11px] font-black uppercase text-danger animate-pulse tracking-widest">Recording...</div>
              <div className="flex items-center gap-1.5 text-white font-mono text-xs">
                <Timer className="w-3 h-3 text-danger" /> 00:{timeLeft.toString().padStart(2, '0')}
              </div>
            </div>
          ) : isUploading ? (
            <div className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Securing Cloud...</div>
          ) : audioUrl ? (
            <div className="text-[10px] font-black uppercase text-success tracking-widest flex items-center gap-2 bg-success/5 border border-success/10 px-2 py-1 rounded w-fit">
              <UploadCloud className="w-4 h-4" /> Sync Secured
            </div>
          ) : (
            <div className="text-[10px] font-black uppercase text-neutral-500 tracking-widest leading-tight italic">
              20s Max <br/>
              <span className="text-[8px] opacity-40 uppercase">Tap mic to start</span>
            </div>
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
