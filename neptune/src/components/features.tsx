"use client"

import { useEffect, useRef } from 'react'
import { Database, Shield, Zap, Globe } from 'lucide-react'

export function Features() {
  const featuresRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const elements = entry.target.querySelectorAll('.feature-card')
          elements.forEach((el, index) => {
            setTimeout(() => {
              el.classList.add('fade-in-up')
            }, index * 100)
          })
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    
    if (featuresRef.current) {
      observer.observe(featuresRef.current)
    }
    
    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current)
      }
    }
  }, [])
  
  return (
    <section id="learn-more" className="relative w-full py-20 px-4">
      <div className="absolute inset-0 z-0">
        <div className="neptune-glow bottom-0 right-1/4 w-80 h-80" style={{ backgroundColor: "var(--neptune-purple-600)" }} />
      </div>

      <div ref={featuresRef} className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neptune-gradient">
            How Neptune Empowers You
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our AI-powered platform transforms your musical ideas into professional tracks while securing your ownership
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="feature-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-4">
              <Database className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              Intuitive Creation
            </h3>
            <p className="text-gray-400 mb-4">
              Express your musical ideas through humming, tapping rhythms, or simply typing descriptive text.
            </p>
            <p className="text-gray-400">
              Our AI translates your input into structured musical compositions that capture your creative intent.
            </p>
          </div>

          <div className="feature-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-4">
              <Zap className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              Real-time Editing
            </h3>
            <p className="text-gray-400 mb-4">
              Edit and arrange your music in real-time with simple controls, without needing complex software or technical skills.
            </p>
            <p className="text-gray-400">
              Instantly hear how your changes affect the composition and refine until it sounds perfect.
            </p>
          </div>

          <div className="feature-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-4">
              <Shield className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              Instant Ownership
            </h3>
            <p className="text-gray-400 mb-4">
              Your creations are automatically registered on the blockchain, establishing clear intellectual property rights.
            </p>
            <p className="text-gray-400">
              Secure ownership of your tracks from the moment they're created, with immutable proof of authorship.
            </p>
          </div>

          <div className="feature-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-4">
              <Globe className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              Accessible to Everyone
            </h3>
            <p className="text-gray-400 mb-4">
              Create professional-quality music regardless of your musical background or technical expertise.
            </p>
            <p className="text-gray-400">
              Our platform democratizes music production, making it accessible to creators of all skill levels.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
