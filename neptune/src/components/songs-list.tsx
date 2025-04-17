"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Shield, ExternalLink } from "lucide-react"

// Mock data for song IPs
const mockSongs = [
  {
    id: "1",
    title: "Cosmic Waves",
    artist: "You",
    dateRegistered: "2023-04-15",
    status: "Protected",
    ipfsHash: "Qm123456789abcdef",
  },
  {
    id: "2",
    title: "Digital Dreams",
    artist: "You",
    dateRegistered: "2023-05-22",
    status: "Protected",
    ipfsHash: "Qm987654321fedcba",
  },
  {
    id: "3",
    title: "Neptune's Melody",
    artist: "You",
    dateRegistered: "2023-06-10",
    status: "Protected",
    ipfsHash: "Qm456789abcdef123",
  },
]

export function SongsList() {
  const [songs, setSongs] = useState(mockSongs)

  return (
    <Card className="bg-gray-900 border-purple-800 text-white">
      <CardHeader>
        <CardTitle className="text-purple-400">Your Protected Songs</CardTitle>
        <CardDescription className="text-gray-400">View and manage your registered music IP assets</CardDescription>
      </CardHeader>
      <CardContent>
        {songs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>You don't have any protected songs yet.</p>
            <p className="mt-2">Upload a .wav file to mint your first song IP.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-purple-400">Title</TableHead>
                  <TableHead className="text-purple-400">Date Registered</TableHead>
                  <TableHead className="text-purple-400">Status</TableHead>
                  <TableHead className="text-purple-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {songs.map((song) => (
                  <TableRow key={song.id} className="border-gray-800">
                    <TableCell className="font-medium">{song.title}</TableCell>
                    <TableCell>{song.dateRegistered}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                        <Shield className="mr-1 h-3 w-3" />
                        {song.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-purple-400">
                          <Play className="h-4 w-4" />
                          <span className="sr-only">Play</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-purple-400"
                          title={`View on IPFS: ${song.ipfsHash}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View on IPFS</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
