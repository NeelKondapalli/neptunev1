"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import WaveSurfer from "wavesurfer.js"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Pause, RotateCcw, Loader2 } from "lucide-react"
import { usePredictionStatus } from "./usePredictionStatus"
import { WaveSurferError } from "wavesurfer.js"

export default function WorkspacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const audioParam = searchParams.get("audio")
  const videoParam = searchParams.get("video")
  const predictionId = searchParams.get("predictionId")
  const [audioUrl, setAudioUrl] = useState<string | null>(audioParam)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  // Use our polling hook if we have a prediction ID
  const predictionState = usePredictionStatus(predictionId)
  
  // Set audio URL from the prediction when it completes
  useEffect(() => {
    if (predictionState.audioUrl) {
      setAudioUrl(predictionState.audioUrl)
    }
  }, [predictionState.audioUrl])

  // Set video URL if provided
  useEffect(() => {
    if (videoParam) {
      try {
        const decodedUrl = decodeURIComponent(videoParam)
        console.log("Setting video URL:", decodedUrl)
        setVideoUrl(decodedUrl)
      } catch (error) {
        console.error("Failed to decode video URL:", error)
        setVideoError("Failed to load video")
      }
    }
  }, [videoParam])

  // Handle video loading
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      console.log("Setting up video element...")
      
      const handleLoadedMetadata = () => {
        console.log("Video metadata loaded")
        setVideoDuration(videoRef.current?.duration ?? null)
        setIsVideoLoaded(true)
        setVideoError(null)
      }

      const handleError = (e: Event) => {
        console.error("Video loading error:", e)
        setVideoError("Failed to load video")
        setIsVideoLoaded(false)
      }

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
      videoRef.current.addEventListener('error', handleError)

      // Try loading the video
      videoRef.current.src = videoUrl
      videoRef.current.load()

      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata)
        videoRef.current?.removeEventListener('error', handleError)
      }
    }
  }, [videoUrl])

  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return

    console.log("Initializing WaveSurfer...")
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
    console.log("Loading audio:", audioUrl)
    wavesurfer.load(decodeURIComponent(audioUrl))
    .catch((err: WaveSurferError) => {
        if (err.name !== "AbortError") {
        console.error("Audio load failed:", err)
        }
    })

    // Event handlers
    wavesurfer.on('ready', () => {
      console.log("WaveSurfer ready")
      setIsLoaded(true)
      wavesurferRef.current = wavesurfer
      
      // If video is present, sync its duration with audio
      if (videoRef.current && isVideoLoaded) {
        videoRef.current.currentTime = 0
      }
    })

    wavesurfer.on('play', () => {
      console.log("WaveSurfer playing")
      setIsPlaying(true)
      if (videoRef.current) {
        videoRef.current.play()
      }
    })

    wavesurfer.on('pause', () => {
      console.log("WaveSurfer paused")
      setIsPlaying(false)
      if (videoRef.current) {
        videoRef.current.pause()
      }
    })

    wavesurfer.on('finish', () => {
      console.log("WaveSurfer finished")
      setIsPlaying(false)
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    })

    // Sync video with audio
    if (videoRef.current) {
      videoRef.current.addEventListener('play', () => {
        console.log("Video playing")
        if (wavesurferRef.current && !wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.play()
        }
      })
      videoRef.current.addEventListener('pause', () => {
        console.log("Video paused")
        if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.pause()
        }
      })
      videoRef.current.addEventListener('seeked', () => {
        console.log("Video seeked")
        if (wavesurferRef.current) {
          wavesurferRef.current.setTime(videoRef.current?.currentTime ?? 0)
        }
      })
    }

    // Cleanup function
    return () => {
      console.log("Cleaning up WaveSurfer")
      wavesurfer.destroy()
      wavesurferRef.current = null
    }
  }, [audioUrl, videoUrl, isVideoLoaded])

  const handlePlayPause = () => {
    console.log("Play/Pause clicked")
    if (!wavesurferRef.current) return
    void wavesurferRef.current.playPause()
  }

  const handleRestart = () => {
    console.log("Restart clicked")
    if (!wavesurferRef.current) return
    wavesurferRef.current.stop()
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
    void wavesurferRef.current.play()
  }

  const handleBack = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }
    router.push('/create')
  }

  if (!audioUrl && !predictionId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
        No audio URL or prediction ID provided
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

          {/* Prediction status and loading indicator */}
          {predictionId && !audioUrl && (
            <div className="mb-8">
              <div className="flex items-center gap-4 p-4 bg-[var(--neptune-violet-700)]/30 border border-[var(--neptune-violet-500)] rounded-lg">
                <Loader2 className="w-8 h-8 text-[var(--neptune-purple-400)] animate-spin" />
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {predictionState.status === "starting" && "Starting up..."}
                    {predictionState.status === "processing" && "Creating your music..."}
                    {predictionState.status === "failed" && "Generation failed"}
                    {!predictionState.status && "Preparing..."}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {predictionState.status === "processing" && "This may take a minute or two. The AI is composing your track."}
                    {predictionState.status === "failed" && predictionState.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {audioUrl && (
            <div className="bg-[var(--neptune-violet-700)]/20 border border-[var(--neptune-violet-500)] rounded-xl p-8 space-y-8">
              {/* Video container */}
              {videoUrl && (
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-[var(--neptune-violet-700)]/30">
                  {videoError ? (
                    <div className="flex items-center justify-center h-full text-red-400">
                      {videoError}
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      playsInline
                      muted
                    />
                  )}
                </div>
              )}

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

              {/* Download and Edit buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
                  disabled={!isLoaded}
                  onClick={() => {
                    if (!audioUrl) return;
                    const a = document.createElement('a')
                    a.href = decodeURIComponent(audioUrl)
                    a.download = 'generated-melody.wav'
                    a.click()
                  }}
                >
                  Download Audio
                </Button>
                
                <Button
                  className="bg-gradient-to-r from-[var(--neptune-violet-500)] to-[var(--neptune-purple-500)] hover:from-[var(--neptune-violet-400)] hover:to-[var(--neptune-purple-400)]"
                  onClick={() => {
                    if (audioUrl) {
                      router.push(`/workspace/editor?audio=${encodeURIComponent(audioUrl)}${videoUrl ? `&video=${encodeURIComponent(videoUrl)}` : ''}`)
                    }
                  }}
                  disabled={!isLoaded}
                >
                  Edit in Studio
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 