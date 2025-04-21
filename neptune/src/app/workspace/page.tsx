"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import WaveSurfer from "wavesurfer.js"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react"

export default function WorkspacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const audioUrl = searchParams.get("audio")
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#9b8cff',
      progressColor: '#6f4ef2',
      cursorColor: '#6f4ef2',
      cursorWidth: 2,
      height: 128,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      autoScroll: true,
      fillParent: true,
      mediaControls: false,
      minPxPerSec: 50,
    })

    wavesurferRef.current = wavesurfer

    // Load audio file
    wavesurfer.load(decodeURIComponent(audioUrl))
    .catch(err => {
        if (err.name !== "AbortError") {
        console.error("Audio load failed:", err)
        }
    })

    // Event handlers
    wavesurfer.on('ready', () => {
      setIsLoaded(true)
      wavesurferRef.current = wavesurfer
    })

    wavesurfer.on('play', () => setIsPlaying(true))
    wavesurfer.on('pause', () => setIsPlaying(false))
    wavesurfer.on('finish', () => setIsPlaying(false))

    // Cleanup function
    return () => {
      wavesurfer.destroy()
      wavesurferRef.current = null
        
      }
  }, [audioUrl])

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.playPause()
  }

  const handleRestart = () => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.stop()
    wavesurferRef.current.play()
  }

  const handleBack = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }
    router.push('/create')
  }

  if (!audioUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
        No audio URL provided
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 z-0 bg-neptune-gradient">
        <div className="neptune-glow top-1/4 -left-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-violet-600)" }} />
        <div className="neptune-glow bottom-1/4 -right-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-purple-600)" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <Button 
          variant="outline" 
          className="mb-8 bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Create
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-neptune-gradient">Your Generated Track</h1>
            <p className="text-gray-300 text-lg">Listen and preview your melody below</p>
          </div>

          <div className="bg-[var(--neptune-violet-700)]/20 border border-[var(--neptune-violet-500)] rounded-xl p-8 space-y-8">
            {/* Waveform container */}
            <div 
              ref={waveformRef} 
              className="w-full rounded-lg overflow-hidden bg-[var(--neptune-violet-700)]/30 p-4"
            />

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={handlePlayPause}
                disabled={!isLoaded}
                className="bg-gradient-to-r from-[var(--neptune-violet-500)] to-[var(--neptune-purple-500)] hover:from-[var(--neptune-violet-400)] hover:to-[var(--neptune-purple-400)] disabled:opacity-50"
                size="lg"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>

              <Button
                onClick={handleRestart}
                disabled={!isLoaded}
                variant="outline"
                className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
                size="lg"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>

            {/* Download button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = decodeURIComponent(audioUrl)
                  a.download = 'generated-melody.wav'
                  a.click()
                }}
              >
                Download Audio
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 