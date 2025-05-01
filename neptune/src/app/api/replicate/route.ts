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

interface AutotexAnalysis {
  file_id: string;
  timeline: Array<{
    timestamp: number;
    event: string;
    details?: {
      notes?: string[];
      energy_level?: number;
      additional_info?: Record<string, string | number | boolean>;
    };
  }>;
  raw_analysis: string;
  llm_description: string;
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

    let audioAnalysis: AutotexAnalysis | null = null;
    if (fileUrl) {
      try {
        // Extract IPFS hash from the URL
        const ipfsHash = fileUrl.split('/').pop()?.split('.')[0];
        if (!ipfsHash) {
          throw new Error("Invalid IPFS URL format");
        }

        console.log("Making Autotex API call with IPFS hash:", ipfsHash);
        
        // Call Autotex API for audio analysis
        const autotexResponse = await fetch('https://autotex-957567445807.us-central1.run.app/analyze/ipfs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            ipfs_hash: ipfsHash 
          })
        });

        if (!autotexResponse.ok) {
          const errorText = await autotexResponse.text();
          console.error("Autotex API error details:", {
            status: autotexResponse.status,
            statusText: autotexResponse.statusText,
            errorText,
            url: 'https://autotex-957567445807.us-central1.run.app/analyze/ipfs',
            ipfsHash
          });
          throw new Error(`Autotex API error: ${autotexResponse.status} - ${errorText}`);
        }

        audioAnalysis = await autotexResponse.json() as AutotexAnalysis;
        console.log("Autotex analysis result:", JSON.stringify(audioAnalysis, null, 2));
      } catch (error) {
        console.error("Error getting audio analysis:", error);
        // Continue without analysis if it fails
      }
    }

    console.log("Generating refined prompt with Claude...");
    const refinedPrompt = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      messages: [{ 
        role: "user", 
        content: `${promptTemplate}\n\nHere is the music description: ${description ?? title ?? "A short rap beat"}. The song should be ${length} seconds long.${audioAnalysis ? `\n\nAudio Analysis:\n${JSON.stringify(audioAnalysis, null, 2)}` : ''}` 
      }],
    });
    console.log("Refined prompt generated:", refinedPrompt.content);

    const firstContent = refinedPrompt.content?.[0];
    if (!firstContent || firstContent.type !== 'text') {
      throw new Error("Invalid response format from Claude");
    }

    const input = {
      prompt: firstContent.text,
      duration: length,
      model_version: "stereo-melody-large",
      ...(fileUrl && {
        input_audio: fileUrl,
        continuation: !(firstContent.text.toLowerCase().includes("remix") || firstContent.text.toLowerCase().includes("variation") || firstContent.text.toLowerCase().includes("reinterpret"))
      }),
      ...(audioAnalysis && {
        audio_analysis: audioAnalysis
      })
    }

    console.log("Replicate API input:", { 
      ...input, 
      input_audio: fileUrl ? "File URL present" : undefined,
      audio_analysis: audioAnalysis ? "Analysis present" : undefined 
    });

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
