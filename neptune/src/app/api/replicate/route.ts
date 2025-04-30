// src/app/api/replicate/route.ts
import { NextResponse } from "next/server"
import Replicate from "replicate"
import Anthropic from '@anthropic-ai/sdk';
import { prompts } from "./prompts";
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';


const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface GenerationRequest {
  title: string;
  description: string;
  fileUrl: string | null;
  length: number;
}

interface ReplicateError extends Error {
  response?: Response;
  request?: Request;
}

interface AudioFile {
  name: string;
  type: string;
  url: string;
}

interface TmpFilesResponse {
  data: {
    id: string;
    url: string;
  };
}

export async function POST(request: Request) {
  try {
    const { title, description, fileUrl, length } = await request.json() as GenerationRequest;
    console.log("Received params:", { title, description, fileUrl, length })

    if (!prompts?.[0]?.starter || !prompts?.[1]?.starter) {
      throw new Error("Prompt templates not found");
    }

    // Select the appropriate prompt based on whether there's a reference audio file
    const promptTemplate = fileUrl ? prompts[1].starter : prompts[0].starter;
    console.log("Using prompt template type:", fileUrl ? "reference" : "oneshot");

    console.log("Generating refined prompt with Claude...");
    const refinedPrompt = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      messages: [{ 
        role: "user", 
        content: `${promptTemplate}\n\nHere is the music description: ${description ?? title ?? "A short rap beat"}. The song should be ${length} seconds long.` 
      }],
    });
    console.log("Refined prompt generated:", refinedPrompt.content);

    const firstContent = refinedPrompt.content?.[0];
    if (!firstContent || firstContent.type !== 'text') {
      throw new Error("Invalid response format from Claude");
    }

    let inputAudioBuffer: Buffer | undefined;
    // if (fileUrl) {
    //   try {
    //     const audioFile = JSON.parse(file) as AudioFile;
    //     console.log("Parsed audio file:", { name: audioFile.name, type: audioFile.type });
        
    //     const base64Data = audioFile.url.split(',')[1];
    //     if (!base64Data) {
    //       throw new Error("Invalid audio data format - no base64 data found");
    //     }
    //     console.log("Base64 data length:", base64Data.length);
        
    //     inputAudioBuffer = Buffer.from(base64Data, 'base64');
    //     console.log("Buffer size:", inputAudioBuffer.length);
    //   } catch (error) {
    //     console.error("Error processing audio file:", error);
    //     const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    //     throw new Error(`Failed to process audio file: ${errorMessage}`);
    //   }
    // }

    const input = {
      prompt: firstContent.text,
      duration: length,
      model_version: "stereo-melody-large",
      ...(fileUrl && {
        input_audio: fileUrl,
        continuation: false
      })
    }

    console.log("Replicate API input:", { ...input, input_audio: fileUrl ? "File URL present" : undefined });

    try {
      const prediction = await replicate.predictions.create({
        version: "b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
        model: "meta/musicgen",
        input: input,
      });


      console.log("Replicate prediction response:", prediction);

      return NextResponse.json({ 
        success: true, 
        predictionId: prediction.id,
        status: prediction.status 
      });
    } catch (error) {
      console.error("Error creating Replicate prediction:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json(
        { error: `Failed to create prediction: ${errorMessage}` },
        { status: 500 }
      );
    }
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

        const audioRes = await fetch(url);
        if (!audioRes.ok) {
          throw new Error(`Failed to fetch audio: ${audioRes.status}`);
        }
        const arrayBuffer = await audioRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);


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
