// src/app/api/replicate/route.ts
import { NextResponse } from "next/server"
import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

interface GenerationRequest {
  title: string;
  description: string;
  file: string | null;
  length: number;
}

interface ReplicateError extends Error {
  response?: Response;
  request?: Request;
}

export async function POST(request: Request) {
  try {
    // First check if the request is JSON
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      )
    }

    const { title, description, file, length } = await request.json() as GenerationRequest;
    console.log("Received params:", { title, description, file, length })

    const input = {
      prompt: description ?? title ?? "A short rap beat",
      duration: length,
      model_version: "stereo-melody-large",
    }

    // Create an asynchronous prediction instead of waiting for completion
    const prediction = await replicate.predictions.create({
      version: "b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
      model: "meta/musicgen",
      input: input,
    });

    // Return the prediction ID to the client for status polling
    return NextResponse.json({ 
      success: true, 
      predictionId: prediction.id,
      status: prediction.status 
    });
  } catch (err) {
    console.error("Error in /api/replicate:", err)
    const error = err as Error;
    return NextResponse.json(
      { error: error.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}

interface ReplicateOutput {
  output: string | string[];
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  id: string;
}

// Add a new endpoint to check prediction status
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 });
    }
    
    const prediction = await replicate.predictions.get(id) as ReplicateOutput;
    
    if (prediction.status === "succeeded") {
      const output = prediction.output;
      const url = Array.isArray(output) ? output[0] : output;
      
      if (url) {
        // Fetch the audio file bytes from the URL
        const audioRes = await fetch(url);
        if (!audioRes.ok) {
          throw new Error(`Failed to fetch audio: ${audioRes.status}`);
        }
        const arrayBuffer = await audioRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Stream the raw audio back
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/wav",
          },
        });
      } else {
        return NextResponse.json({ error: "Output URL not found" }, { status: 404 });
      }
    }
    
    // If not succeeded yet, return the current status
    return NextResponse.json({
      success: true,
      predictionId: id,
      status: prediction.status,
      output: prediction.output
    });
  } catch (err) {
    console.error("Error checking prediction status:", err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message ?? "Failed to check prediction status" },
      { status: 500 }
    );
  }
}
