"use client"

import { useState, useEffect } from "react"

export type PredictionStatus = 
  | "starting" 
  | "processing" 
  | "succeeded" 
  | "failed" 
  | "canceled"

interface PredictionState {
  status: PredictionStatus | null
  audioUrl: string | null
  error: string | null
  isLoading: boolean
}

interface PredictionResponse {
  status: PredictionStatus
  predictionId: string
  success: boolean
  output?: string | string[]
  error?: string
}

export function usePredictionStatus(predictionId: string | null) {
  const [state, setState] = useState<PredictionState>({
    status: null,
    audioUrl: null,
    error: null,
    isLoading: false
  })

  useEffect(() => {
    if (!predictionId) return

    let isMounted = true
    const controller = new AbortController()
    let timeoutId: NodeJS.Timeout | null = null
    
    async function pollPrediction() {
      if (!isMounted || !predictionId) return
      
      setState(prev => ({ ...prev, isLoading: true }))
      
      try {
        const response = await fetch(`/api/replicate?id=${predictionId}`, {
          signal: controller.signal
        })
        
        if (!response.ok) {
          const errorData = await response.json() as { error?: string }
          throw new Error(errorData.error ?? "Failed to fetch prediction status")
        }
        
        // Check content type to determine if it's JSON status or audio data
        const contentType = response.headers.get("Content-Type") ?? ""
        
        if (contentType.includes("audio")) {
          // If content is audio, create URL for it
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          
          setState({
            status: "succeeded",
            audioUrl: url,
            error: null,
            isLoading: false
          })
          
          // Stop polling since we have the final result
          return
        }
        
        // Otherwise it's a JSON status update
        const data = await response.json() as PredictionResponse
        
        setState({
          status: data.status,
          audioUrl: null,
          error: null,
          isLoading: false
        })
        
        // If not completed, continue polling
        if (data.status !== "succeeded" && data.status !== "failed" && data.status !== "canceled") {
          // Clear any existing timeout
          if (timeoutId) clearTimeout(timeoutId)
          // Set a new timeout
          timeoutId = setTimeout(() => {
            void pollPrediction()
          }, 2000) // Poll every 2 seconds
        }
      } catch (err) {
        if (isMounted) {
          setState({
            status: "failed",
            audioUrl: null,
            error: err instanceof Error ? err.message : "Unknown error occurred",
            isLoading: false
          })
        }
      }
    }
    
    // Start polling
    void pollPrediction()
    
    // Cleanup function
    return () => {
      isMounted = false
      controller.abort()
      
      // Clear any pending timeout
      if (timeoutId) clearTimeout(timeoutId)
      
      // Revoke any object URLs to prevent memory leaks
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl)
      }
    }
  }, [predictionId])
  
  return state
} 