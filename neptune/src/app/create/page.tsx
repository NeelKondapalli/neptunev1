"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Mic, MicOff, Upload, X, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { create } from "@web3-storage/w3up-client";

import * as Client from '@web3-storage/w3up-client'
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory'
import * as Proof from '@web3-storage/w3up-client/proof'
import { Signer } from '@web3-storage/w3up-client/principal/ed25519'
import { set } from "node_modules/@web3-storage/w3up-client/dist/src/capability/plan"

interface PredictionResponse {
  success: boolean;
  predictionId: string;
  status: string;
  error?: string;
}

export default function GeneratePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [length, setLength] = useState(15)
  const [client, setClient] = useState<any>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const initClient = async () => {
      try {
        // Check if we're in a test environment
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === "test") {
          console.log("Running in test environment, skipping Web3.Storage initialization");
          return;
        }

        // Only initialize Web3.Storage if we have the required environment variables
        if (!process.env.KEY || !process.env.PROOF) {
          console.warn("Web3.Storage environment variables not set. File uploads will be disabled.");
          return;
        }

        const principal = Signer.parse(process.env.KEY)
        const store = new StoreMemory()
        const client = await Client.create({ principal, store })

        const proof = await Proof.parse(process.env.PROOF)
        const space = await client.addSpace(proof)
        await client.setCurrentSpace(space.did())
        setClient(client)
      } catch (err) {
        console.error('Failed to initialize Web3.Storage client:', err);
        // Don't set error state, just log it
      }
    };
    initClient();
  }, []);

  // Handle video duration
  useEffect(() => {
    if (videoPreviewRef.current) {
      const handleLoadedMetadata = () => {
        setVideoDuration(videoPreviewRef.current?.duration ?? null)
      }
      videoPreviewRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
      return () => {
        videoPreviewRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [videoUrl])

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("File selected:", { name: file.name, type: file.type, size: file.size })

    if (!file.type.includes('audio/')) {
      setError("Please upload an audio file")
      return
    }
    setFile(file)
    console.log("Starting file upload processing...")
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        console.log("File processed successfully, setting audio URL")
        setAudioUrl(result)
      }
    }
    reader.onerror = (error) => {
      console.error("Error reading file:", error)
      setError("Failed to process audio file")
    }
    reader.readAsDataURL(file)
  }

  // Handle video upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("Video file selected:", { name: file.name, type: file.type, size: file.size })

    if (!file.type.includes('video/')) {
      setError("Please upload a video file")
      return
    }
    setVideoFile(file)
    console.log("Starting video upload processing...")
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        console.log("Video processed successfully, setting video URL")
        setVideoUrl(result)
      }
    }
    reader.onerror = (error) => {
      console.error("Error reading video file:", error)
      setError("Failed to process video file")
    }
    reader.readAsDataURL(file)
  }

  const startRecording = async () => {
    try {
      console.log("Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("Microphone access granted, initializing recorder")
      mediaRecorder.current = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.current.ondataavailable = (e) => {
        console.log("Recording data available:", e.data.size, "bytes")
        chunks.push(e.data)
      }
      mediaRecorder.current.onstop = () => {
        const mime = mediaRecorder.current?.mimeType || 'audio/webm' // fallback
        const blob = new Blob(chunks, { type: mime })

        // 2️⃣ Create a File from that Blob
        const recordedFile = new File([blob], `reference.${mime.split('/')[1]}`, { type: mime })
        setFile(recordedFile)                      // <- use this in your upload flow

        // 3️⃣ Preview: create an object-URL
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        console.log('Recorder mime:', mime)
        console.log('File ready:', recordedFile.name, recordedFile.size, 'bytes')
        
        // Convert blob to base64
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          if (typeof result === 'string') {
            console.log("Audio converted to base64")
          }
        }
        reader.onerror = (error) => {
          console.error("Error converting audio to base64:", error)
          setError("Failed to process recorded audio")
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.current.start()
      console.log("Recording started")
      setIsRecording(true)
    } catch (err) {
      console.error("Failed to access microphone:", err)
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError("Microphone access was denied. Please allow microphone access in your browser settings and try again.")
        const retry = window.confirm("Microphone access was denied. Would you like to try again?")
        if (retry) {
          startRecording()
        }
      } else {
        setError("Failed to access microphone")
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      console.log("Stopping recording...")
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      console.log("Recording stopped and tracks released")
    }
  }

  const clearAudio = () => {
    if (audioUrl) {
      console.log("Clearing audio URL")
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    console.log("Audio cleared")
  }

  const clearVideo = () => {
    if (videoUrl) {
      console.log("Clearing video URL")
      URL.revokeObjectURL(videoUrl)
    }
    setVideoUrl(null)
    setVideoFile(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
    console.log("Video cleared")
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

    let fileURL = null
    let videoFileURL = null

    try {
      // Only try to upload files if we have a client
      if (file && client) {
        console.log("Uploading reference audio to Web3.Storage...")
        try {
          const cid = await client.uploadFile(file);
          if (!cid) {
            throw new Error("Failed to get CID after audio upload")
          }
          fileURL = `https://${cid}.ipfs.w3s.link`;
          console.log("Reference audio uploaded successfully:", fileURL);
        } catch (error) {
          console.error("Failed to upload reference audio:", error);
          // Decide if you want to block generation or proceed without reference
          // setError("Failed to upload reference audio");
          // setIsGenerating(false);
          // return;
          console.warn("Proceeding without uploaded reference audio.")
        }
      } else if (file) {
        console.warn("Web3.Storage client not initialized or no file, skipping reference audio upload");
      }

      // Upload video to Web3.Storage if present
      let persistentVideoUrl: string | null = null; // Use a separate variable for the URL to pass
      if (videoFile && client) {
        console.log("Uploading video to Web3.Storage...");
        try {
          const videoCid = await client.uploadFile(videoFile);
          if (!videoCid) {
            throw new Error("Failed to get CID for video upload")
          }
          persistentVideoUrl = `https://${videoCid}.ipfs.w3s.link`; // Store the persistent URL
          console.log("Video uploaded successfully:", persistentVideoUrl);
        } catch (error) {
          console.error("Failed to upload video:", error);
          setError("Failed to upload video");
          setIsGenerating(false);
          return;
        }
      } else if (videoFile) {
        // If we have a video but no client or upload failed, DO NOT set persistentVideoUrl
        console.warn("Web3.Storage client not initialized or upload failed, skipping video upload.");
        // persistentVideoUrl remains null
      }

      // This check might be redundant now based on error handling above, but kept for safety
      if (file && !fileURL) {
        console.warn("Reference audio was provided but failed to upload. Proceeding without it.")
        // setError("Failed to upload reference audio")
        // setIsGenerating(false)
        // return
      }

      // Calculate duration - ensure it's an integer
      const duration = videoFile && videoDuration ? Math.ceil(videoDuration) : Math.ceil(length)

      // Generate audio
      console.log("Sending request to /api/replicate...")
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          fileUrl: fileURL, // Pass the potentially null audio URL
          length: duration,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) // Attempt to get error details
        throw new Error(errorData.error || 'Failed to generate audio')
      }

      const data = await response.json()
      console.log('Generation response:', data)

      // Create a safe URL for redirection
      const searchParams = new URLSearchParams()
      searchParams.set('predictionId', data.predictionId)
      
      // ONLY add the video parameter if we have a persistent URL
      if (persistentVideoUrl) {
        const encodedVideoUrl = encodeURIComponent(persistentVideoUrl)
        searchParams.set('video', encodedVideoUrl)
      }

      // Use a proper URL object to construct the path
      const workspaceUrl = `/workspace?${searchParams.toString()}`
      console.log("Redirecting to:", workspaceUrl)
      
      // Use replace instead of push to prevent back button issues
      router.replace(workspaceUrl)
    } catch (error) {
      console.error('Error during generation:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate audio')
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
              <p className="text-sm text-gray-400 mb-2">Upload a sample OR record your own</p>
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

            {/* Video Upload Section */}
            <div>
              <label className="block mb-2 text-gray-300">Reference Video (Optional)</label>
              <p className="text-sm text-gray-400 mb-2">Upload a video to generate synchronized music</p>
              <div className="space-y-4">
                {!videoUrl && (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => videoInputRef.current?.click()}
                      className="flex-1 bg-[var(--neptune-violet-600)] hover:bg-[var(--neptune-violet-500)] border-[var(--neptune-violet-400)]"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {videoUrl && (
                  <div className="bg-[var(--neptune-violet-700)]/30 border border-[var(--neptune-violet-500)] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Reference Video</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearVideo}
                        className="hover:bg-[var(--neptune-violet-600)]/50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <video 
                      ref={videoPreviewRef}
                      controls 
                      src={videoUrl} 
                      className="w-full"
                    />
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
                      value={length === 0 ? '' : length}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val)) setLength(val);
                      }}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
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


