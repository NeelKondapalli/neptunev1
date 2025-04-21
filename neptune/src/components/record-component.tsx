"use client"

import { useState, useRef } from "react"
import { Mic, StopCircle, Loader2 } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const recordFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  audioFile: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => ["audio/wav"].includes(file.type),
      "Only .wav files are allowed"
    ),
})

type RecordFormValues = z.infer<typeof recordFormSchema>

export default function RecordComponent() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" })
        setRecordedBlob(blob)
        const file = new File([blob], "recorded-melody.wav", { type: "audio/wav" })
        setValue("audioFile", file)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const onSubmit = async (data: RecordFormValues) => {
    setIsSubmitting(true)
    try {
      console.log("Form data:", data)
      // TODO: Implement API call
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-2">
            Title
          </label>
          <input
            {...register("title")}
            type="text"
            id="title"
            className="w-full px-4 py-2 rounded-lg bg-[var(--neptune-violet-700)]/20 border border-[var(--neptune-violet-500)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--neptune-violet-500)]"
            placeholder="Enter melody title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className="flex items-center justify-center w-full h-32 px-4 transition bg-[var(--neptune-violet-700)]/20 border-2 border-[var(--neptune-violet-500)] rounded-lg hover:bg-[var(--neptune-violet-700)]/30"
          >
            <div className="flex flex-col items-center">
              {isRecording ? (
                <>
                  <StopCircle className="w-8 h-8 text-red-400 animate-pulse" />
                  <p className="mt-2 text-sm text-red-400">Stop Recording</p>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-300">Record Melody</p>
                </>
              )}
            </div>
          </button>
        </div>

        {recordedBlob && (
          <div className="mt-4">
            <p className="text-sm text-gray-300">Recording complete!</p>
            <audio controls className="mt-2 w-full">
              <source src={URL.createObjectURL(recordedBlob)} type="audio/wav" />
            </audio>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !recordedBlob}
          className="w-full px-8 py-4 rounded-full bg-neptune-button-gradient text-white font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </div>
          ) : (
            "Submit Recording"
          )}
        </button>
      </form>
    </div>
  )
} 