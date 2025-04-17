"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Music, Upload } from "lucide-react"

export function UploadSongForm() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      // Check if file is a .wav file
      if (selectedFile.type === "audio/wav") {
        setFile(selectedFile)
      } else {
        alert("Please upload a .wav file")
        e.target.value = ""
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return

    try {
      setIsUploading(true)

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, you would upload the file and mint the NFT here
      console.log("Uploading file:", file)
      console.log("Song title:", title)
      
      // Reset form
      setFile(null)
      setTitle("")
      setIsUploading(false)

      // Refresh the page to show the new song in the list
      // In a real app, you would update the state instead
      router.refresh()
    } catch (error) {
      console.error("Error uploading song:", error)
      setIsUploading(false)
    }
  }

  return (
    <Card className="bg-gray-900 border-purple-800 text-white">
      <CardHeader>
        <CardTitle className="text-purple-400">Mint New Song IP</CardTitle>
        <CardDescription className="text-gray-400">
          Upload a .wav file to register and protect your music
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">
              Song Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              required
              className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="text-gray-300">
              Audio File (.wav)
            </Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer 
                  ${file ? "border-purple-500 bg-purple-900/20" : "border-gray-700 hover:border-purple-500 hover:bg-gray-800"}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <Music className="w-8 h-8 mb-3 text-purple-400" />
                      <p className="text-sm text-purple-300">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">.WAV files only</p>
                    </>
                  )}
                </div>
                <Input
                  id="file"
                  type="file"
                  accept=".wav,audio/wav"
                  className="hidden"
                  onChange={handleFileChange}
                  required
                />
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!file || !title || isUploading}
          >
            {isUploading ? "Processing..." : "Mint Song IP"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
