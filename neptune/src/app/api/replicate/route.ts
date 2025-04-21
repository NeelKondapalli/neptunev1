// src/app/api/replicate/route.ts
import { NextResponse } from "next/server"
import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const {title, description, file, length } = await request.json()
    console.log("Received params:", { title, description, file, length })

    const input = {
      prompt: description || title || "A short rap beat",
      duration: length,
      model_version: "stereo-melody-large",
    }

    // Run MusicGen on Replicate → returns a URL string (or array of URLs)
    const output = await replicate.run(
      "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
      { input }
    )
    const url = Array.isArray(output) ? output[0] : output

    // Fetch the audio file bytes from the URL
    const audioRes = await fetch(url)
    if (!audioRes.ok) {
      throw new Error(`Failed to fetch audio: ${audioRes.status}`)
    }
    const arrayBuffer = await audioRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Stream the raw audio back
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        // Optionally:
        // "Content-Length": buffer.length.toString(),
      },
    })
  } catch (err: any) {
    console.error("Error in /api/replicate:", err)
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "POST method required" }, { status: 405 })
}
