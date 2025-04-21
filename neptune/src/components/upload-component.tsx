"use client"

import { useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"

const uploadFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  audioFile: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => ["audio/wav"].includes(file.type),
      "Only .wav files are allowed"
    ),
})

type UploadFormValues = z.infer<typeof uploadFormSchema>

export default function UploadComponent() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
  })

  const audioFile = watch("audioFile")

  const onSubmit = async (data: UploadFormValues) => {
    setIsSubmitting(true)
    try {
      console.log("Form data:", data)
      // TODO: Implement API call
      const fileParam = encodeURIComponent(JSON.stringify({
        name: audioFile.name,
        type: audioFile.type,
      }))
      
      router.push(`/create/generate?type=upload&title=${data.title}&file=${fileParam}`)
        
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
          <label
            htmlFor="audioFile"
            className="flex items-center justify-center w-full h-32 px-4 transition bg-[var(--neptune-violet-700)]/20 border-2 border-[var(--neptune-violet-500)] border-dashed rounded-lg cursor-pointer hover:bg-[var(--neptune-violet-700)]/30"
          >
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-300">Upload .wav file</p>
            </div>
            <input
              type="file"
              id="audioFile"
              accept=".wav"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setValue("audioFile", file)
                }
              }}
            />
          </label>
          {audioFile && (
            <p className="mt-2 text-sm text-gray-300">
              Selected file: {audioFile.name}
            </p>
          )}
          {errors.audioFile && (
            <p className="mt-1 text-sm text-red-400">{errors.audioFile.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !audioFile}
          className="w-full px-8 py-4 rounded-full bg-neptune-button-gradient text-white font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </div>
          ) : (
            "Upload Track"
          )}
        </button>
      </form>
    </div>
  )
} 