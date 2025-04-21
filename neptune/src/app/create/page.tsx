"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Mic, MicOff, Upload, X, ChevronDown, ChevronUp } from "lucide-react"

export default function GeneratePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [length, setLength] = useState(15)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.includes('audio/')) {
      setError("Please upload an audio file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setAudioUrl(result)
        setFile(JSON.stringify({ 
          name: file.name,
          type: file.type,
          url: result
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Convert blob to base64
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === 'string') {
            setFile(JSON.stringify({
              name: 'recording.wav',
              type: 'audio/wav',
              url: result
            }))
          }
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      setError("Failed to access microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (!description.trim()) {
      setError("Description is required")
      return
    }

    if (isNaN(length) || length < 1 || length > 120) {
      setError("Length must be between 1 and 120 seconds")
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      let res
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === "test") {
          res = await fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
          title, 
          description, 
          file,
          length: length  
        }),
      })
      } else {
          res = await fetch("/api/replicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title, 
            description, 
            file,
            length: length  
          }),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Generation failed")
      }

      const audioBlob = await res.blob()
      const url = URL.createObjectURL(audioBlob)
      
      router.push(`/workspace?audio=${encodeURIComponent(url)}`)
    } catch (err: any) {
      setError(err.message || "Generation failed")
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 z-0 bg-neptune-gradient">
        <div className="neptune-glow top-1/4 -left-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-violet-600)" }} />
        <div className="neptune-glow bottom-1/4 -right-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-purple-600)" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-neptune-gradient">Create New Melody</h1>
            <p className="text-gray-300 text-lg">Fill in the details to generate your music</p>
          </div>
          
          <div className="bg-[var(--neptune-violet-700)]/20 border border-[var(--neptune-violet-500)] rounded-xl p-8 space-y-6">
            <div>
              <label className="block mb-2 text-gray-300">Title</label>
              <Input
                placeholder="Enter a title for your track"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-500)] focus:border-[var(--neptune-violet-400)] focus:ring-[var(--neptune-violet-400)]"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-300">Description</label>
              <Textarea
                placeholder="Describe the music you want to create..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-500)] focus:border-[var(--neptune-violet-400)] focus:ring-[var(--neptune-violet-400)] min-h-[100px]"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-300">Reference Audio (Optional)</label>
              <div className="space-y-4">
                {!audioUrl && (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-[var(--neptune-violet-600)] hover:bg-[var(--neptune-violet-500)] border-[var(--neptune-violet-400)]"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Audio
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      className="flex-1"
                      variant={isRecording ? "destructive" : "outline"}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Record Audio
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {audioUrl && (
                  <div className="bg-[var(--neptune-violet-700)]/30 border border-[var(--neptune-violet-500)] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Reference Audio</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearAudio}
                        className="hover:bg-[var(--neptune-violet-600)]/50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <audio controls src={audioUrl} className="w-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Parameters Section */}
            <div>
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center text-gray-300 hover:text-white hover:bg-[var(--neptune-violet-700)]/30"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>Advanced Parameters</span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-[var(--neptune-violet-700)]/30 border border-[var(--neptune-violet-500)] rounded-lg">
                  <div>
                    <label className="block mb-2 text-gray-300 text-sm">
                      Length (seconds)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-500)] focus:border-[var(--neptune-violet-400)] focus:ring-[var(--neptune-violet-400)]"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Enter a value between 1 and 120 seconds (default: 15)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-950/50 border border-red-900/50 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !title || !description}
              className="w-full bg-gradient-to-r from-[var(--neptune-violet-500)] to-[var(--neptune-purple-500)] hover:from-[var(--neptune-violet-400)] hover:to-[var(--neptune-purple-400)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}