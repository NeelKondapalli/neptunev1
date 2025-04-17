"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowDown } from 'lucide-react'
import { signUpForWaitlist } from '@/app/actions'

type Particle = {
  x: number
  y: number
  radius: number
  color: string
  velocity: { x: number; y: number }
  alpha: number
  depth: number
  glow: boolean
}

export function Hero() {
  const [heroEmail, setHeroEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string | null
  }>({ type: null, message: null })
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
      "oklch(0.75 0.22 310)",
      "oklch(0.8 0.18 300)",
    ]

    // Create regular particles
    for (let i = 0; i < 60; i++) {
      const radius = Math.random() * 2 + 1
      const color = colors[Math.floor(Math.random() * colors.length)]
      if (!color) continue
      
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
        depth: Math.random() * 0.5 + 0.5,
        glow: false
      })
    }
    
    // Add some larger glowing particles
    for (let i = 0; i < 15; i++) {
      const radius = Math.random() * 4 + 3
      const color = colors[Math.floor(Math.random() * colors.length)]
      if (!color) continue
      
      particles.push({
        x: Math.random() * safeCanvas.width,
        y: Math.random() * safeCanvas.height,
        radius,
        color,
        velocity: {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.2,
        },
        alpha: Math.random() * 0.4 + 0.3,
        depth: Math.random() * 0.3 + 0.7,
        glow: true
      })
    }

    let animationFrameId: number
    let animationTime = 0

    function animate() {
      animationFrameId = requestAnimationFrame(animate)
      safeContext.clearRect(0, 0, safeCanvas.width, safeCanvas.height)
      animationTime += 0.01

      // Sort particles by depth for pseudo-3D effect (deeper particles render first)
      const sortedParticles = [...particles].sort((a, b) => a.depth - b.depth)

      sortedParticles.forEach((particle) => {
        // Slight wiggle based on depth
        if (particle.glow) {
          particle.x += Math.sin(animationTime + particle.x * 0.01) * 0.2 + particle.velocity.x
          particle.y += Math.cos(animationTime + particle.y * 0.01) * 0.2 + particle.velocity.y
          
          // Pulse the glow effect
          const pulseRate = 0.5 + particle.depth * 0.5 // deeper particles pulse faster
          const pulse = 0.2 * Math.sin(animationTime * pulseRate + particle.x * 0.1)
          
          safeContext.shadowBlur = 15 + pulse * 10
          safeContext.shadowColor = particle.color
        } else {
          particle.x += particle.velocity.x
          particle.y += particle.velocity.y
          safeContext.shadowBlur = 0
        }

        if (particle.x < 0 || particle.x > safeCanvas.width) {
          particle.velocity.x = -particle.velocity.x
        }

        if (particle.y < 0 || particle.y > safeCanvas.height) {
          particle.velocity.y = -particle.velocity.y
        }

        safeContext.beginPath()
        safeContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        safeContext.fillStyle = particle.color
        safeContext.globalAlpha = particle.alpha * (particle.depth * 0.5 + 0.5) // deeper particles more transparent
        safeContext.fill()
      })

      // Draw connections between nearby particles, varying by depth
      safeContext.globalAlpha = 0.2
      sortedParticles.forEach((particle1, i) => {
        // Only connect within similar depth ranges and only to a subset of particles
        const depthStart = Math.max(0, i - 10)
        const depthEnd = Math.min(sortedParticles.length, i + 10)
        
        for (let j = depthStart; j < depthEnd; j++) {
          if (i === j) continue
          
          const particle2 = sortedParticles[j]
          // Skip iteration if particle2 is undefined (shouldn't happen, but to satisfy TypeScript)
          if (!particle2) continue
          
          const dx = particle1.x - particle2.x
          const dy = particle1.y - particle2.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Connection distance varies by depth
          const maxDistance = 100 + particle1.depth * 50
          
          if (distance < maxDistance) {
            const depthFactor = (particle1.depth + particle2.depth) / 2
            safeContext.beginPath()
            safeContext.strokeStyle = particle1.color
            safeContext.globalAlpha = 0.1 * (1 - distance / maxDistance) * depthFactor
            safeContext.lineWidth = 0.5 * depthFactor
            safeContext.moveTo(particle1.x, particle1.y)
            safeContext.lineTo(particle2.x, particle2.y)
            safeContext.stroke()
          }
        }
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

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    
    if (!heroEmail || !heroEmail.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter your email'
      })
      return
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(heroEmail)) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid email'
      })
      return
    }
    
    setSubmitting(true)
    setStatus({ type: null, message: null })

    try {
      const result = await signUpForWaitlist(heroEmail)
      setStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      })
      
      if (result.success) {
        setHeroEmail('')
        
        // Navigate to waitlist section with a success parameter
        const waitlistSection = document.getElementById('waitlist')
        if (waitlistSection) {
          // Set a flag in localStorage to indicate the origin was hero section
          localStorage.setItem('waitlist_signup_source', 'hero')
          
          // Navigate to the waitlist section
          window.location.href = '#waitlist'
        }
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'There was an error signing up. Please try again later.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="absolute inset-0 z-0 bg-neptune-gradient">
        <div className="neptune-glow top-1/4 -left-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-violet-600)" }} />
        <div className="neptune-glow bottom-1/4 -right-20 w-60 h-60" style={{ backgroundColor: "var(--neptune-purple-600)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className="mb-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-neptune-gradient">
            Neptune
          </h1>
        </div>

        <div className="mb-8 fade-in-up" style={{ animationDelay: "0.3s" }}>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
          The AI-powered oracle protecting music creators from unintentional copyright infringement
          </p>
        </div>

        <div className="mb-10 fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="sound-wave mx-auto">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div className="max-w-md mx-auto mb-2 fade-in-up" style={{ animationDelay: "0.7s" }}>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full border border-[var(--neptune-violet-600)] p-2 pl-4">
            <input
              type="email"
              placeholder="your@email.com"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              className="flex-1 bg-transparent border-0 focus:outline-none text-white placeholder:text-gray-500"
            />
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 rounded-full bg-neptune-button-gradient text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Signing up...' : 'Join Waitlist'}
            </button>
          </div>
        </div>
        
        {status.message && (
          <div className="mb-4 fade-in-up" style={{ animationDelay: "0.8s" }}>
            <p className={`text-sm ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {status.message}
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4 text-sm text-gray-400 fade-in-up" style={{ animationDelay: "0.9s" }}>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--neptune-violet-400)]"></span>
            AI-Powered
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--neptune-purple-400)]"></span>
            Blockchain Verified
          </span>
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

