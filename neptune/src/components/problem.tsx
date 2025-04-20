"use client"

import { useRef, useEffect } from "react"
import { Shield, AlertTriangle, Check } from "lucide-react"

export function Problem() {
  const problemRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const elements = entry.target.querySelectorAll('.problem-card')
          elements.forEach((el, index) => {
            setTimeout(() => {
              el.classList.add('fade-in-up')
            }, index * 150)
          })
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    
    if (problemRef.current) {
      observer.observe(problemRef.current)
    }
    
    return () => {
      if (problemRef.current) {
        observer.unobserve(problemRef.current)
      }
    }
  }, [])
  
  return (
    <section className="relative w-full py-20 px-4">
      <div className="absolute inset-0 z-0">
        <div
          className="neptune-glow top-0 left-1/4 w-72 h-72"
          style={{ backgroundColor: "var(--neptune-violet-600)" }}
        />
      </div>

      <div ref={problemRef} className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neptune-gradient">Barriers to Music Creation</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Traditional music production is complex, expensive, and requires specialized skills—we're changing that.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="problem-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-6">
              <AlertTriangle className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Technical Barriers</h3>
            <p className="text-gray-400">
              Complex music software and equipment create a steep learning curve for beginners wanting to express themselves musically.
            </p>
          </div>

          <div className="problem-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-6">
              <Shield className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Ownership Concerns</h3>
            <p className="text-gray-400">
              Musicians struggle to establish and protect ownership of their original creations in the digital age.
            </p>
          </div>

          <div className="problem-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-6">
              <Check className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Creative Liberation</h3>
            <p className="text-gray-400">
              Create with confidence using intuitive tools that translate your ideas into professional-quality music while securing your rights.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
