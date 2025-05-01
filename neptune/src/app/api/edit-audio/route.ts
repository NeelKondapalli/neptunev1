import { NextResponse } from "next/server"
import Replicate from "replicate"
import Anthropic from '@anthropic-ai/sdk';
import { prompts } from "../replicate/prompts";
import { create } from "@web3-storage/w3up-client";
import * as Client from '@web3-storage/w3up-client'
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory'
import * as Proof from '@web3-storage/w3up-client/proof'
import { Signer } from '@web3-storage/w3up-client/principal/ed25519'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface EditRequest {
  prompt: string;
  audioData: string; // Base64 encoded audio segment
  regionId: string;
  start: number;
  end: number;
  originalAudioUrl: string; // URL of the original audio file
}

interface ReplicateError extends Error {
  response?: Response;
  request?: Request;
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

interface Web3StorageResponse {
  cid: string;
  name: string;
  size: number;
}

async function uploadToIPFS(audioData: string): Promise<string> {
  try {
    // Handle both raw base64 and data URI formats
    const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;
    if (!base64Data) {
      throw new Error("Invalid base64 data format");
    }
    
    const binaryData = Buffer.from(base64Data, 'base64');
    const blob = new Blob([binaryData], { type: 'audio/wav' });
    const file = new File([blob], 'reference.wav', { type: 'audio/wav' });

    // Initialize web3.storage client
    if (!process.env.KEY) {
      throw new Error("KEY is not set");
    }
    if (!process.env.PROOF) {
      throw new Error("PROOF is not set");
    }

    const principal = Signer.parse(process.env.KEY);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });

    const proof = await Proof.parse(process.env.PROOF);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    // Upload to IPFS
    const cid = await client.uploadFile(file);
    if (!cid) {
      throw new Error("Failed to get CID after upload");
    }

    // Return just the CID without the URL
    return cid.toString();
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

async function getAutotexAnalysis(ipfsHash: string): Promise<AutotexAnalysis> {
  try {
    if (!ipfsHash) {
      throw new Error("Invalid IPFS hash");
    }

    const response = await fetch('https://autotex-957567445807.us-central1.run.app/analyze/ipfs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ipfs_hash: ipfsHash 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Autotex API error: ${response.status} - ${errorText}`);
    }

    return await response.json() as AutotexAnalysis;
  } catch (error) {
    console.error('Error getting Autotex analysis:', error);
    throw error;
  }
}

async function generateRefinedPrompt(
  userPrompt: string, 
  audioAnalysis: AutotexAnalysis | null,
  originalAudioUrl: string
): Promise<string> {
  try {
    if (!prompts?.[1]?.starter) {
      throw new Error("Reference prompt template not found");
    }
    const referencePrompt = prompts[1].starter;
    
    const refinedPrompt = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      messages: [{ 
        role: "user", 
        content: `${referencePrompt}\n\nUser's edit request: ${userPrompt}\n\nAudio Analysis:\n${JSON.stringify(audioAnalysis, null, 2)}\n\nOriginal audio URL: ${originalAudioUrl}\n\nIMPORTANT: The edited section must blend smoothly with the surrounding audio. Add a gradual fade in/out at the start/end of the section to ensure seamless transitions.` 
      }],
    });

    if (!refinedPrompt.content?.[0] || refinedPrompt.content[0].type !== 'text') {
      throw new Error("Invalid response format from Claude");
    }

    return refinedPrompt.content[0].text;
  } catch (error) {
    console.error('Error generating refined prompt:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, audioData, regionId, start, end, originalAudioUrl } = await request.json() as EditRequest;
    console.log("Edit request received for region:", regionId, "start:", start, "end:", end);
    console.log("Prompt:", prompt);
    
    // 1. Upload the audio segment to IPFS
    console.log("Uploading audio segment to IPFS...");
    let ipfsHash: string;
    try {
      ipfsHash = await uploadToIPFS(audioData);
      console.log("IPFS hash:", ipfsHash);
      
      // Verify the IPFS URL is accessible
      const ipfsUrl = `https://${ipfsHash}.ipfs.w3s.link`;
      const ipfsResponse = await fetch(ipfsUrl, { method: 'HEAD' });
      if (!ipfsResponse.ok) {
        throw new Error(`IPFS URL not accessible: ${ipfsResponse.status} ${ipfsResponse.statusText}`);
      }
      console.log("IPFS URL verified:", ipfsUrl);
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      return NextResponse.json(
        { error: `Failed to upload audio to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    // 2. Get Autotex analysis
    let audioAnalysis: AutotexAnalysis | null = null;
    try {
      console.log("Getting Autotex analysis...");
      audioAnalysis = await getAutotexAnalysis(ipfsHash);
      console.log("Autotex analysis:", JSON.stringify(audioAnalysis, null, 2));
    } catch (error) {
      console.error("Error getting audio analysis:", error);
      // Continue without analysis if it fails
    }
    
    // 3. Generate refined prompt using Claude
    console.log("Generating refined prompt...");
    const refinedPrompt = await generateRefinedPrompt(prompt, audioAnalysis, originalAudioUrl);
    console.log("Refined prompt:", refinedPrompt);
    
    // 4. Create Replicate prediction
    console.log("Creating Replicate prediction...");
    console.log("Replicate API token present:", !!process.env.REPLICATE_API_TOKEN);
    console.log("Replicate API token length:", process.env.REPLICATE_API_TOKEN?.length);
    
    const input = {
      prompt: refinedPrompt,
      input_audio: `https://${ipfsHash}.ipfs.w3s.link`,
      continuation: false, // Always treat as a remix/variation
      ...(audioAnalysis && { audio_analysis: audioAnalysis })
    };
    
    console.log("Replicate API input:", {
      ...input,
      input_audio: `https://${ipfsHash}.ipfs.w3s.link`,
      audio_analysis: audioAnalysis ? "Analysis present" : undefined
    });

    try {
      const prediction = await replicate.predictions.create({
        version: "b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
        model: "meta/musicgen",
        input: input,
      });
      
      console.log("Replicate prediction created:", prediction);
      
      if (!prediction.id) {
        throw new Error("No prediction ID returned from Replicate");
      }
      
      return NextResponse.json({
        success: true,
        predictionId: prediction.id,
        status: prediction.status,
        metadata: {
          regionId,
          start,
          end,
          prompt,
          refinedPrompt,
          ipfsHash,
          editTimestamp: new Date().toISOString()
        }
      });
      
    } catch (err) {
      console.error("Error creating Replicate prediction:", err);
      const error = err as Error;
      const errorMessage = error.message ?? "Failed to create Replicate prediction";
      console.error("Detailed error:", {
        message: errorMessage,
        input: {
          ...input,
          input_audio: `https://${ipfsHash}.ipfs.w3s.link`,
          audio_analysis: audioAnalysis ? "Analysis present" : undefined
        }
      });
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error editing audio:", err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message ?? "Failed to edit audio" },
      { status: 500 }
    );
  }
} 