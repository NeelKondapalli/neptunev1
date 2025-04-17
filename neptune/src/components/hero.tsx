"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowDown } from 'lucide-react'

type Particle = {
  x: number
  y: number
  radius: number
  color: string
  velocity: { x: number; y: number }
  alpha: number
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    // After null checks, we can safely assert these won't be null
    const safeCanvas = canvas as HTMLCanvasElement
    const safeContext = context as CanvasRenderingContext2D

    safeCanvas.width = window.innerWidth
    safeCanvas.height = window.innerHeight

    const particles: Particle[] = []

    const colors = [
      "oklch(0.75 0.2 295)",
      "oklch(0.7 0.22 295)",
      "oklch(0.65 0.24 295)",
      "oklch(0.7 0.2 305)",
    ]

    for (let i = 0; i < 50; i++) {
      const radius = Math.random() * 2 + 1
      const color = colors[Math.floor(Math.random() * colors.length)]
      if (!color) continue // Skip if color is undefined (shouldn't happen)
      
      particles.push({
        x: Math.random() * safeCanvas.width,
        y: Math.random() * safeCanvas.height,
        radius,
        color,
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
        },
        alpha: Math.random() * 0.5 + 0.1,
      })
    }

    let animationFrameId: number

    function animate() {
      animationFrameId = requestAnimationFrame(animate)
      safeContext.clearRect(0, 0, safeCanvas.width, safeCanvas.height)

      particles.forEach((particle) => {
        particle.x += particle.velocity.x
        particle.y += particle.velocity.y

        if (particle.x < 0 || particle.x > safeCanvas.width) {
          particle.velocity.x = -particle.velocity.x
        }

        if (particle.y < 0 || particle.y > safeCanvas.height) {
          particle.velocity.y = -particle.velocity.y
        }

        safeContext.beginPath()
        safeContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        safeContext.fillStyle = particle.color
        safeContext.globalAlpha = particle.alpha
        safeContext.fill()
      })

      // Draw connections
      safeContext.globalAlpha = 0.2
      particles.forEach((particle1, i) => {
        // Only check particles after this one to avoid duplicate connections
        particles.slice(i + 1).forEach((particle2) => {
          const dx = particle1.x - particle2.x
          const dy = particle1.y - particle2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            safeContext.beginPath()
            safeContext.strokeStyle = "oklch(0.7 0.2 295)"
            safeContext.globalAlpha = 0.1 * (1 - distance / 150)
            safeContext.lineWidth = 0.5
            safeContext.moveTo(particle1.x, particle1.y)
            safeContext.lineTo(particle2.x, particle2.y)
            safeContext.stroke()
          }
        })
      })
    }

    animate()

    const handleResize = () => {
      safeCanvas.width = window.innerWidth
      safeCanvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="absolute inset-0 z-0 bg-neptune-gradient">
        <div className="neptune-glow top-1/4 -left-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-violet-600)" }} />
        <div className="neptune-glow bottom-1/4 -right-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-purple-600)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className="mb-6">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-neptune-gradient">
            Neptune
          </h1>
        </div>

        <div className="mb-8">
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            The AI-powered oracle protecting music creators from unintentional copyright infringement
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="#waitlist">
            <button className="px-8 py-4 rounded-full bg-neptune-button-gradient text-white font-medium text-lg hover:opacity-90 transition-opacity">
              Join Waitlist
            </button>
          </Link>

          <Link href="#learn-more">
            <button className="px-8 py-4 rounded-full bg-transparent border border-[var(--neptune-violet-500)] text-white font-medium text-lg hover:bg-[var(--neptune-violet-700)]/20 transition-colors">
              Learn More
            </button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-10 z-10 animate-bounce">
        <Link href="#learn-more">
          <ArrowDown className="h-10 w-10" style={{ color: "var(--neptune-violet-400)" }} />
        </Link>
      </div>
    </section>
  )
}
