"use client"

import { useEffect, useRef, useState } from "react"
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
  MessageSquarePlus
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
  message: string;
  success: boolean;
}

export default function EditorPage() {
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
  const [editHistory, setEditHistory] = useState<{ prompt: string; timestamp: string }[]>([])
  
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

  const handleAIEdit = async () => {
    if (!selectedRegion || !editPrompt.trim() || !wavesurferRef.current) return
    
    setIsProcessing(true)
    
    try {
      // Add to history
      setEditHistory(prev => [
        { 
          prompt: editPrompt, 
          timestamp: new Date().toLocaleTimeString() 
        }, 
        ...prev
      ])
      
      // Get audio data for the selected region
      // In a real implementation, you'd extract just the audio from the selected region
      // For now, we'll just use the entire audio as a demo
      
      const audioUrl = decodeURIComponent(searchParams.get("audio") ?? "");
      
      // Send to our API
      const response = await fetch("/api/edit-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: editPrompt,
          audioData: audioUrl, // Ideally this would be just the selected segment
          regionId: selectedRegion.id,
          start: selectedRegion.start,
          end: selectedRegion.end,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "Failed to edit audio");
      }
      
      const data = await response.json() as EditResponse;
      
      // In a real implementation, you would:
      // 1. Replace just the edited segment in the waveform
      // 2. Update the audio visualization
      
      // For now, just show a success message
      console.log("Edit successful:", data.message);
      alert(data.message);
      
      setEditPrompt("");
    } catch (error) {
      console.error("AI Edit failed:", error);
      alert("Failed to edit audio: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  }

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
                        <li key={index} className="text-xs text-gray-300 border-l-2 border-[var(--neptune-violet-500)] pl-2">
                          <span className="text-[var(--neptune-purple-400)]">{item.timestamp}</span>: {item.prompt}
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