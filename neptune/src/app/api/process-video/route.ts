import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence'
import { createClient } from '@supabase/supabase-js'

interface VideoFile {
  url: string;
}

interface ShotAnnotation {
  startTimeOffset?: { seconds?: number };
  endTimeOffset?: { seconds?: number };
}

interface LabelAnnotation {
  entity?: { description?: string };
  frames?: Array<{ confidence?: number }>;
}

interface ObjectAnnotation {
  entity?: { description?: string };
  confidence?: number;
}

interface AnnotationResults {
  shotAnnotations?: ShotAnnotation[];
  segmentLabelAnnotations?: LabelAnnotation[];
  objectAnnotations?: ObjectAnnotation[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const videoIntelligenceClient = new VideoIntelligenceServiceClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}'),
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { videoFile } = await req.json()

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // 1. Extract video data from base64
    const videoData = videoFile.url.split(',')[1]
    const videoBuffer = Buffer.from(videoData, 'base64')

    // 2. Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: videoBuffer,
      model: 'whisper-1',
      response_format: 'verbose_json',
    })

    // 3. Analyze video content using Google Cloud Video Intelligence
    const [operation] = await videoIntelligenceClient.annotateVideo({
      inputContent: videoBuffer,
      features: ['SHOT_CHANGE_DETECTION', 'LABEL_DETECTION', 'OBJECT_TRACKING'],
    })

    const [result] = await operation.promise()
    const annotations = result.annotationResults?.[0]

    // 4. Prepare data for LLM summarization
    const visualMetadata = {
      shotChanges: annotations?.shotAnnotations?.map((shot: ShotAnnotation) => ({
        startTime: shot.startTimeOffset?.seconds,
        endTime: shot.endTimeOffset?.seconds,
      })),
      labels: annotations?.segmentLabelAnnotations?.map((label: LabelAnnotation) => ({
        description: label.entity?.description,
        confidence: label.frames?.[0]?.confidence,
      })),
      objects: annotations?.objectAnnotations?.map((obj: ObjectAnnotation) => ({
        name: obj.entity?.description,
        confidence: obj.confidence,
      })),
    }

    // 5. Generate structured summary using GPT-4
    const summaryPrompt = `
      Create a structured summary of the following video content:
      
      Transcript:
      ${transcription.text}
      
      Visual Metadata:
      ${JSON.stringify(visualMetadata, null, 2)}
      
      Please provide a structured summary with:
      1. Title
      2. Short Abstract (2-3 sentences)
      3. Key Topics Discussed
      4. Timestamped Highlights
      5. Named Entities (People, Orgs, Places)
      6. Action Items or Insights
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates structured summaries of video content.',
        },
        {
          role: 'user',
          content: summaryPrompt,
        },
      ],
    })

    const structuredSummary = completion.choices[0].message.content

    // 6. Store in Supabase
    const { data, error } = await supabase
      .from('video_summaries')
      .insert([
        {
          video_url: videoFile.url,
          transcript: transcription.text,
          visual_metadata: visualMetadata,
          structured_summary: structuredSummary,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      summary: structuredSummary,
      videoId: data[0].id,
    })
  } catch (error) {
    console.error('Error processing video:', error)
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    )
  }
} 