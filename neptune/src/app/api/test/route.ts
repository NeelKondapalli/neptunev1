import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    // Get parameters from request body
    const { title, description, file, length } = await request.json()

    // Log the received parameters
    console.log("Received params:", { title, description, file, length })

    // Read the local WAV file
    const filePath = join(process.cwd(), "src/app/api/test/file_example_WAV_2MG.wav")
    const data = await readFile(filePath)
    
    // Create response with the audio data
    const response = new NextResponse(data)
    response.headers.set('content-type', 'audio/wav')
    return response

  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return NextResponse.json(
    { error: "POST method required" },
    { status: 405 }
  )
}


