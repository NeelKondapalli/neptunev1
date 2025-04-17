"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowDown } from 'lucide-react'

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      radius: number
      color: string
      velocity: { x: number; y: number }
      alpha: number
    }[] = []

    const colors = [
      "oklch(0.75 0.2 295)",
      "oklch(0.7 0.22 295)",
      "oklch(0.65 0.24 295)",
      "oklch(0.7 0.2 305)",
    ]

    for (let i = 0; i < 50; i++) {
      const radius = Math.random() * 2 + 1
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
        },
        alpha: Math.random() * 0.5 + 0.1,
      })
    }

    function animate() {
      requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.x += particle.velocity.x
        particle.y += particle.velocity.y

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.velocity.x = -particle.velocity.x
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.velocity.y = -particle.velocity.y
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.alpha
        ctx.fill()
      })

      // Draw connections
      ctx.globalAlpha = 0.2
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.strokeStyle = "oklch(0.7 0.2 295)"
            ctx.globalAlpha = 0.1 * (1 - distance / 150)
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
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
