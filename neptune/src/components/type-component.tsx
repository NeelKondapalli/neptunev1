"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const typeFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
})

type TypeFormValues = z.infer<typeof typeFormSchema>

export default function TypeComponent() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TypeFormValues>({
    resolver: zodResolver(typeFormSchema),
  })


  const onSubmit = async (data: TypeFormValues) => {
    setIsSubmitting(true)
    try {
      console.log("Form data:", data)
      router.push(`/create/generate?type=type&title=${data.title}&description=${data.description}`)
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
            Description
          </label>
          <textarea
            {...register("description")}
            id="description"
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-[var(--neptune-violet-700)]/20 border border-[var(--neptune-violet-500)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--neptune-violet-500)]"
            placeholder="Describe your melody"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-8 py-4 rounded-full bg-neptune-button-gradient text-white font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </div>
          ) : (
            "Submit Description"
          )}
        </button>
      </form>
    </div>
  )
} 