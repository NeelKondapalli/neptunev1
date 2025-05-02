"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import WaveSurfer from "wavesurfer.js"
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions"
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Scissors, 
  Wand2, 
  Save, 
  Trash,
  Plus,
  Volume2,
  VolumeX,
  Layers,
  MessageSquarePlus,
  Loader2
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface WaveSurferError {
  name: string;
  [key: string]: unknown;
}

interface Region {
  id: string;
  start: number;
  end: number;
  color: string;
  resize: boolean;
  drag: boolean;
  remove: () => void;
}

interface EditRequest {
  prompt: string;
  regionId: string;
  start: number;
  end: number;
}

interface EditResponse {
  success: boolean;
  predictionId: string;
  status: string;
  metadata: {
    regionId: string;
    start: number;
    end: number;
    prompt: string;
    refinedPrompt: string;
    ipfsHash: string;
    editTimestamp: string;
  };
}

interface ReplicateResponse {
  status: string;
  output?: string;
  error?: string;
  logs?: string[];
}

interface EditHistoryItem {
  prompt: string;
  timestamp: string;
  predictionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalAudioUrl: string;
  newAudioUrl?: string;
  error?: string;
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const buffer2 = new ArrayBuffer(44 + length);
  const view = new DataView(buffer2);
  const channels = [];
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(36 + length);                        // file length - 8
  setUint32(0x45564157);                         // "WAVE"
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit
  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length);                             // chunk length

  // write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i]?.[pos] ?? 0));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  return buffer2;
}

function EditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const audioUrl = searchParams.get("audio")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [volume, setVolume] = useState(75)
  const [muted, setMuted] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [editPrompt, setEditPrompt] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [editHistory, setEditHistory] = useState<EditHistoryItem[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null)
  
  const waveformRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const regionsRef = useRef<RegionsPlugin | null>(null)

  // Colors for regions
  const regionColors = [
    "rgba(111, 78, 242, 0.3)", // Purple
    "rgba(86, 182, 255, 0.3)",  // Blue
    "rgba(255, 183, 77, 0.3)",  // Orange
    "rgba(252, 117, 161, 0.3)", // Pink
    "rgba(0, 208, 132, 0.3)",   // Green
  ]

  useEffect(() => {
    if (!audioUrl || !waveformRef.current || !timelineRef.current) return

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#9b8cff',
      progressColor: '#6f4ef2',
      cursorColor: '#ffffff',
      cursorWidth: 2,
      height: 128,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      autoScroll: true,
      fillParent: true,
      minPxPerSec: 100, // More detailed visualization
    })

    // Add Timeline plugin
    const timeline = wavesurfer.registerPlugin(TimelinePlugin.create({
      container: timelineRef.current,
      timeInterval: 5,
      primaryLabelInterval: 5,
      secondaryLabelInterval: 1,
      style: {
        color: 'rgb(255, 255, 255, 0.8)',
        fontSize: '12px',
        fontFamily: 'Arial',
      },
      secondaryLabelOpacity: 0.4,
    }))

    // Add Regions plugin
    const regions = wavesurfer.registerPlugin(RegionsPlugin.create())
    regionsRef.current = regions

    // Set volume
    wavesurfer.setVolume(volume / 100)
    
    // Load audio file
    wavesurfer.load(decodeURIComponent(audioUrl))
    .catch((err: WaveSurferError) => {
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

    // Region events
    regions.on('region-created', (region: Region) => {
      // Automatically select newly created regions
      setSelectedRegion(region)
    })

    regions.on('region-clicked', (region: Region) => {
      setSelectedRegion(region)
    })

    regions.on('region-updated', (region: Region) => {
      if (region.id === selectedRegion?.id) {
        setSelectedRegion(region)
      }
    })

    // Cleanup function
    return () => {
      wavesurfer.destroy()
      wavesurferRef.current = null
    }
  }, [audioUrl])

  // Handle volume change
  useEffect(() => {
    if (!wavesurferRef.current) return
    
    wavesurferRef.current.setVolume(muted ? 0 : volume / 100)
  }, [volume, muted])

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return
    void wavesurferRef.current.playPause()
  }

  const handleRestart = () => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.stop()
    void wavesurferRef.current.play()
  }

  const handleBack = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }
    router.push(`/workspace?audio=${audioUrl}`)
  }

  const createRegion = () => {
    if (!wavesurferRef.current || !regionsRef.current) return
    
    const duration = wavesurferRef.current.getDuration()
    const currentTime = wavesurferRef.current.getCurrentTime()
    
    // Create a region of 2 seconds or until the end
    const start = currentTime
    const end = Math.min(currentTime + 2, duration)
    
    // Select a random color
    const colorIndex = Math.floor(Math.random() * regionColors.length)
    
    regionsRef.current.addRegion({
      start,
      end,
      color: regionColors[colorIndex],
      resize: true,
      drag: true,
    })
  }

  const deleteSelectedRegion = () => {
    if (!selectedRegion || !regionsRef.current) return
    
    // Call remove method on the region
    selectedRegion.remove()
    setSelectedRegion(null)
  }

  const playSelectedRegion = () => {
    if (!selectedRegion || !wavesurferRef.current) return
    
    wavesurferRef.current.setTime(selectedRegion.start)
    void wavesurferRef.current.play()
    
    // Stop when region ends
    const checkTime = setInterval(() => {
      if (!wavesurferRef.current) {
        clearInterval(checkTime)
        return
      }
      
      const currentTime = wavesurferRef.current.getCurrentTime()
      if (currentTime >= selectedRegion.end) {
        wavesurferRef.current.pause()
        clearInterval(checkTime)
      }
    }, 10)
  }

  // Add function to revert to a previous version
  const handleRevert = async (edit: EditHistoryItem) => {
    if (!wavesurferRef.current) return;
    
    try {
      // Load the original audio URL
      await wavesurferRef.current.load(edit.originalAudioUrl);
      
      // Remove all edits after this one
      setEditHistory(prev => prev.filter(item => 
        new Date(item.timestamp) <= new Date(edit.timestamp)
      ));
    } catch (error) {
      console.error("Error reverting audio:", error);
      alert("Failed to revert audio: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Update handleAIEdit to include more metadata
  const handleAIEdit = async () => {
    if (!selectedRegion || !editPrompt.trim() || !wavesurferRef.current) return;
    
    setIsProcessing(true);
    
    // Create new edit item outside try block
    const newEdit: EditHistoryItem = {
      prompt: editPrompt,
      timestamp: new Date().toLocaleTimeString(),
      predictionId: '',
      status: 'pending',
      originalAudioUrl: decodeURIComponent(searchParams.get("audio") ?? "")
    };
    
    try {
      // Add to history with pending status
      setEditHistory(prev => [newEdit, ...prev]);
      
      // Get audio data for the selected region from current audio
      const audioContext = new AudioContext();
      const originalAudio = wavesurferRef.current.getMediaElement();
      if (!originalAudio) throw new Error("No audio element found");
      
      // Load the original audio
      const originalBuffer = await fetch(decodeURIComponent(searchParams.get("audio") ?? ""))
        .then(r => r.arrayBuffer())
        .then(buffer => audioContext.decodeAudioData(buffer));
      
      // Create a new buffer for the selected region
      const startSample = Math.floor(selectedRegion.start * originalBuffer.sampleRate);
      const endSample = Math.floor(selectedRegion.end * originalBuffer.sampleRate);
      const segmentLength = endSample - startSample;
      
      const segmentBuffer = audioContext.createBuffer(
        originalBuffer.numberOfChannels,
        segmentLength,
        originalBuffer.sampleRate
      );
      
      // Copy the selected region to the new buffer
      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const originalData = originalBuffer.getChannelData(channel);
        const segmentData = segmentBuffer.getChannelData(channel);
        for (let i = 0; i < segmentLength; i++) {
          segmentData[i] = originalData[startSample + i] ?? 0;
        }
      }
      
      // Convert the segment buffer to a WAV blob
      const wavBlob = await new Promise<Blob>((resolve, reject) => {
        const offlineContext = new OfflineAudioContext(
          segmentBuffer.numberOfChannels,
          segmentBuffer.length,
          segmentBuffer.sampleRate
        );
        const source = offlineContext.createBufferSource();
        source.buffer = segmentBuffer;
        source.connect(offlineContext.destination);
        source.start();
        offlineContext.startRendering()
          .then((renderedBuffer) => {
            const wav = audioBufferToWav(renderedBuffer);
            resolve(new Blob([wav], { type: 'audio/wav' }));
          })
          .catch(error => {
            console.error("Error rendering audio:", error);
            reject(error instanceof Error ? error : new Error(String(error)));
          });
      });
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error("Failed to convert audio to base64"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read audio data"));
        reader.readAsDataURL(wavBlob);
      });
      
      // Clean up
      void audioContext.close();
      
      // Send to our API
      const response = await fetch("/api/edit-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: editPrompt,
          audioData: base64Data,
          regionId: selectedRegion.id,
          start: selectedRegion.start,
          end: selectedRegion.end,
          originalAudioUrl: decodeURIComponent(searchParams.get("audio") ?? ""),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "Failed to edit audio");
      }
      
      const data = await response.json() as EditResponse;
      
      // Update the edit history with the prediction ID
      setEditHistory(prev => prev.map(item => 
        item.timestamp === newEdit.timestamp 
          ? { ...item, predictionId: data.predictionId, status: 'processing' }
          : item
      ));
      
      // Start polling for the prediction
      setCurrentPredictionId(data.predictionId);
      setIsPolling(true);
      
      setEditPrompt("");
    } catch (error) {
      console.error("AI Edit failed:", error);
      // Update the edit history to show failure
      setEditHistory(prev => prev.map(item => 
        item.timestamp === newEdit.timestamp 
          ? { ...item, status: 'failed' }
          : item
      ));
      alert("Failed to edit audio: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Update the polling effect to handle edit history
  useEffect(() => {
    if (!currentPredictionId || !isPolling) return;

    const pollInterval = setInterval(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/replicate?id=${currentPredictionId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch prediction status");
          }

          // Check content type to determine if it's JSON status or audio data
          const contentType = response.headers.get("Content-Type") ?? "";
          
          if (contentType.includes("audio")) {
            // If content is audio, create URL for it
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Replace the audio segment in the waveform
            if (wavesurferRef.current && selectedRegion) {
              const audioContext = new AudioContext();
              try {
                // Load both the original audio and the new snippet
                const [originalBuffer, newBuffer] = await Promise.all([
                  fetch(decodeURIComponent(searchParams.get("audio") ?? ""))
                    .then(r => r.arrayBuffer())
                    .then(buffer => audioContext.decodeAudioData(buffer)),
                  fetch(audioUrl)
                    .then(r => r.arrayBuffer())
                    .then(buffer => audioContext.decodeAudioData(buffer))
                ]);

                // Create a new buffer with the same length as the original
                const outputBuffer = audioContext.createBuffer(
                  originalBuffer.numberOfChannels,
                  originalBuffer.length,
                  originalBuffer.sampleRate
                );

                // Copy the original audio
                for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
                  const originalData = originalBuffer.getChannelData(channel);
                  const outputData = outputBuffer.getChannelData(channel);
                  originalData.forEach((sample, i) => {
                    outputData[i] = sample;
                  });
                }

                // Replace just the selected region with the new audio
                const startSample = Math.floor(selectedRegion.start * originalBuffer.sampleRate);
                const endSample = Math.floor(selectedRegion.end * originalBuffer.sampleRate);
                const segmentLength = endSample - startSample;
                
                // Crossfade duration in samples (50ms)
                const crossfadeSamples = Math.floor(0.05 * originalBuffer.sampleRate);

                // Copy the new audio into the selected region with crossfading
                for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                  const outputData = outputBuffer.getChannelData(channel);
                  const newData = newBuffer.getChannelData(channel);
                  const originalData = originalBuffer.getChannelData(channel);

                  // Apply crossfade at the start
                  for (let i = 0; i < crossfadeSamples; i++) {
                    const fadeIn = i / crossfadeSamples;
                    const fadeOut = 1 - fadeIn;
                    const newSample = newData[i] ?? 0;
                    const originalSample = originalData[startSample + i] ?? 0;
                    outputData[startSample + i] = newSample * fadeIn + originalSample * fadeOut;
                  }

                  // Copy the middle section
                  for (let i = crossfadeSamples; i < segmentLength - crossfadeSamples; i++) {
                    outputData[startSample + i] = newData[i] ?? 0;
                  }

                  // Apply crossfade at the end
                  for (let i = 0; i < crossfadeSamples; i++) {
                    const fadeIn = i / crossfadeSamples;
                    const fadeOut = 1 - fadeIn;
                    const endIndex = startSample + segmentLength - crossfadeSamples + i;
                    const newIndex = segmentLength - crossfadeSamples + i;
                    const newSample = newData[newIndex] ?? 0;
                    const originalSample = originalData[endIndex] ?? 0;
                    outputData[endIndex] = newSample * fadeOut + originalSample * fadeIn;
                  }
                }

                // Convert the buffer to a blob and create a new URL
                const wavBlob = await new Promise<Blob>((resolve, reject) => {
                  const offlineContext = new OfflineAudioContext(
                    outputBuffer.numberOfChannels,
                    outputBuffer.length,
                    outputBuffer.sampleRate
                  );
                  const source = offlineContext.createBufferSource();
                  source.buffer = outputBuffer;
                  source.connect(offlineContext.destination);
                  source.start();
                  offlineContext.startRendering()
                    .then((renderedBuffer) => {
                      const wav = audioBufferToWav(renderedBuffer);
                      resolve(new Blob([wav], { type: 'audio/wav' }));
                    })
                    .catch(error => {
                      console.error("Error rendering audio:", error);
                      reject(error instanceof Error ? error : new Error(String(error)));
                    });
                });

                const newAudioUrl = URL.createObjectURL(wavBlob);

                // Update the waveform with the new audio
                await wavesurferRef.current.load(newAudioUrl);
                
                // Clean up
                void audioContext.close();
                URL.revokeObjectURL(audioUrl);
                setIsPolling(false);
                setCurrentPredictionId(null);

                // Update edit history with new audio URL
                setEditHistory(prev => prev.map(item => 
                  item.predictionId === currentPredictionId
                    ? { ...item, newAudioUrl: newAudioUrl, status: 'completed' }
                    : item
                ));
              } catch (error) {
                console.error("Error processing audio:", error);
                void audioContext.close();
                throw error instanceof Error ? error : new Error(String(error));
              }
            }
          } else {
            // Otherwise it's a JSON status update
            const data = await response.json() as ReplicateResponse;
            console.log("Replicate API response:", data);
            
            // Update edit history status
            setEditHistory(prev => prev.map(item => 
              item.predictionId === currentPredictionId
                ? { 
                    ...item, 
                    status: data.status === "succeeded" ? "completed" : 
                           data.status === "failed" ? "failed" : "processing"
                  }
                : item
            ));
            
            if (data.status === "failed") {
              // Log detailed error information
              console.error("Prediction failed with details:", {
                status: data.status,
                error: data.error,
                logs: data.logs,
                output: data.output
              });
              
              // Update edit history to show failure with error message
              setEditHistory(prev => prev.map(item => 
                item.predictionId === currentPredictionId
                  ? { 
                      ...item, 
                      status: "failed",
                      error: data.error ?? "Unknown error"
                    }
                  : item
              ));
              
              setIsPolling(false);
              setCurrentPredictionId(null);
            }
          }
        } catch (error) {
          console.error("Error polling prediction:", error);
          // Update edit history to show failure
          setEditHistory(prev => prev.map(item => 
            item.predictionId === currentPredictionId
              ? { 
                  ...item, 
                  status: "failed",
                  error: error instanceof Error ? error.message : "Unknown error"
                }
              : item
          ));
          setIsPolling(false);
          setCurrentPredictionId(null);
        }
      })();
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [currentPredictionId, isPolling, selectedRegion, searchParams]);

  if (!audioUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
        No audio URL provided
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 z-0 bg-neptune-gradient">
        <div className="neptune-glow top-1/4 -left-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-violet-600)" }} />
        <div className="neptune-glow bottom-1/4 -right-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-purple-600)" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workspace
          </Button>
          
          <h1 className="text-2xl font-bold text-neptune-gradient">Neptune Studio</h1>
          
          <Button
            variant="outline"
            className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
            onClick={() => {
              const currentAudio = wavesurferRef.current?.getMediaElement();
              if (!currentAudio?.src) return;
              
              const a = document.createElement('a');
              a.href = currentAudio.src;
              a.download = 'edited-melody.wav';
              a.click();
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
        </div>
        
        {/* Main Editor Area */}
        <div className="bg-[var(--neptune-violet-900)]/40 border border-[var(--neptune-violet-700)] rounded-xl p-6 mb-6">
          {/* Transport Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePlayPause}
                disabled={!isLoaded}
                className="bg-gradient-to-r from-[var(--neptune-violet-500)] to-[var(--neptune-purple-500)] hover:from-[var(--neptune-violet-400)] hover:to-[var(--neptune-purple-400)] disabled:opacity-50"
                size="sm"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                onClick={handleRestart}
                disabled={!isLoaded}
                variant="outline"
                className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMuted(!muted)}
                  className="text-gray-300 hover:text-white"
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  className="w-28 h-3"
                  onValueChange={(values) => setVolume(values[0] ?? 100)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
                onClick={createRegion}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Region
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
                disabled={!selectedRegion}
                onClick={deleteSelectedRegion}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Region
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="bg-[var(--neptune-violet-700)]/20 border-[var(--neptune-violet-500)] hover:bg-[var(--neptune-violet-700)]/30"
                disabled={!selectedRegion}
                onClick={playSelectedRegion}
              >
                <Play className="h-4 w-4 mr-2" />
                Play Region
              </Button>
            </div>
          </div>
          
          {/* Waveform with timeline */}
          <div className="rounded-lg overflow-hidden bg-[var(--neptune-violet-800)]/60 p-4 mb-4">
            <div ref={timelineRef} className="mb-2"></div>
            <div ref={waveformRef}></div>
          </div>
          
          {/* Instructions */}
          <p className="text-gray-400 text-sm mb-2">
            Click and drag on the waveform to create regions. Select a region and use the AI edit panel to modify it.
          </p>
        </div>
        
        {/* Editing Panels */}
        <div className="grid grid-cols-3 gap-6">
          {/* Region Info */}
          <Card className="bg-[var(--neptune-violet-900)]/40 border-[var(--neptune-violet-700)] text-white">
            <CardHeader>
              <CardTitle className="text-neptune-gradient flex items-center">
                <Scissors className="h-4 w-4 mr-2" />
                Region Info
              </CardTitle>
              <CardDescription className="text-gray-400">
                Selected region details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRegion ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="region-id">Region ID</Label>
                    <Input 
                      id="region-id" 
                      value={selectedRegion.id} 
                      readOnly
                      className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time">Start Time (s)</Label>
                      <Input 
                        id="start-time" 
                        value={selectedRegion.start.toFixed(2)} 
                        readOnly
                        className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time">End Time (s)</Label>
                      <Input 
                        id="end-time" 
                        value={selectedRegion.end.toFixed(2)} 
                        readOnly
                        className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (s)</Label>
                    <Input 
                      id="duration" 
                      value={(selectedRegion.end - selectedRegion.start).toFixed(2)} 
                      readOnly
                      className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No region selected. Create or select a region to edit.
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* AI Edit Panel */}
          <Card className="bg-[var(--neptune-violet-900)]/40 border-[var(--neptune-violet-700)] text-white col-span-2">
            <CardHeader>
              <CardTitle className="text-neptune-gradient flex items-center">
                <Wand2 className="h-4 w-4 mr-2" />
                AI Edit Studio
              </CardTitle>
              <CardDescription className="text-gray-400">
                Use AI to modify the selected region
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRegion ? (
                <div className="space-y-4">
                  <Tabs defaultValue="edit">
                    <TabsList className="bg-[var(--neptune-violet-800)]">
                      <TabsTrigger value="edit">Text Prompt</TabsTrigger>
                      <TabsTrigger value="presets">Presets</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit" className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-prompt">
                            Describe how to edit this section
                          </Label>
                          <Textarea 
                            id="edit-prompt"
                            placeholder="e.g., Add more bass, Make this section more energetic, Change to a minor key..."
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)] min-h-[100px]"
                          />
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge className="bg-[var(--neptune-violet-600)]">Add bass</Badge>
                          <Badge className="bg-[var(--neptune-violet-600)]">More drums</Badge>
                          <Badge className="bg-[var(--neptune-violet-600)]">Melodic</Badge>
                          <Badge className="bg-[var(--neptune-violet-600)]">Jazz style</Badge>
                          <Badge className="bg-[var(--neptune-violet-600)]">Hip hop beat</Badge>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="presets" className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          variant="outline"
                          className="justify-start text-left bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                          onClick={() => setEditPrompt("Add powerful drums and percussion to this section")}
                        >
                          Add Drums
                        </Button>
                        <Button 
                          variant="outline"
                          className="justify-start text-left bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                          onClick={() => setEditPrompt("Enhance the bass line to be more prominent")}
                        >
                          Enhance Bass
                        </Button>
                        <Button 
                          variant="outline"
                          className="justify-start text-left bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                          onClick={() => setEditPrompt("Add melodic synthesizer lead on top")}
                        >
                          Add Synth Lead
                        </Button>
                        <Button 
                          variant="outline"
                          className="justify-start text-left bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                          onClick={() => setEditPrompt("Make this section more ambient and atmospheric")}
                        >
                          Ambient Transition
                        </Button>
                        <Button 
                          variant="outline"
                          className="justify-start text-left bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                          onClick={() => setEditPrompt("Transform to a hip hop style beat")}
                        >
                          Hip Hop Style
                        </Button>
                        <Button 
                          variant="outline"
                          className="justify-start text-left bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                          onClick={() => setEditPrompt("Create a dramatic build-up section")}
                        >
                          Build Up
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="advanced" className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Instrument Focus</Label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                              onClick={() => setEditPrompt(prev => `${prev} Focus on drums.`.trim())}
                            >
                              Drums
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                              onClick={() => setEditPrompt(prev => `${prev} Focus on bass.`.trim())}
                            >
                              Bass
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                              onClick={() => setEditPrompt(prev => `${prev} Focus on melody.`.trim())}
                            >
                              Melody
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Genre Direction</Label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                              onClick={() => setEditPrompt(prev => `${prev} Make it more EDM style.`.trim())}
                            >
                              EDM
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                              onClick={() => setEditPrompt(prev => `${prev} Make it more Hip Hop style.`.trim())}
                            >
                              Hip Hop
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-[var(--neptune-violet-700)]/30 border-[var(--neptune-violet-600)]"
                              onClick={() => setEditPrompt(prev => `${prev} Make it more Rock style.`.trim())}
                            >
                              Rock
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-[var(--neptune-violet-500)] to-[var(--neptune-purple-500)] hover:from-[var(--neptune-violet-400)] hover:to-[var(--neptune-purple-400)]"
                    disabled={!editPrompt.trim() || isProcessing}
                    onClick={handleAIEdit}
                  >
                    {isProcessing ? "Processing..." : "Apply AI Edit to Region"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  Select a region to edit with AI.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <h4 className="text-sm text-gray-400 mb-2 flex items-center">
                  <MessageSquarePlus className="h-3 w-3 mr-1" />
                  Edit History
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  {editHistory.length > 0 ? (
                    <ul className="space-y-1">
                      {editHistory.map((item, index) => (
                        <li key={index} className="text-xs text-gray-300 border-l-2 border-[var(--neptune-violet-500)] pl-2 flex items-center justify-between">
                          <div>
                            <span className="text-[var(--neptune-purple-400)]">{item.timestamp}</span>: {item.prompt}
                            {item.status === 'processing' && (
                              <span className="ml-2 text-[var(--neptune-purple-400)]">
                                <Loader2 className="h-3 w-3 animate-spin inline" /> Processing...
                              </span>
                            )}
                            {item.status === 'failed' && (
                              <span className="ml-2 text-red-400">Failed</span>
                            )}
                          </div>
                          {item.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[var(--neptune-purple-400)] hover:text-[var(--neptune-purple-300)]"
                              onClick={() => handleRevert(item)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Revert
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">No edits yet</p>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--neptune-purple-400)] animate-spin" />
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
} 