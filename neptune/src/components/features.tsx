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
            How Neptune Protects You
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our AI-powered oracle scans your music against a decentralized database to ensure originality
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="feature-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-4">
              <Database className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              Decentralized Database
            </h3>
            <p className="text-gray-400 mb-4">
              Built on Story Protocol, our platform maintains a comprehensive, decentralized database of registered music and samples.
            </p>
            <p className="text-gray-400">
              This blockchain-based approach ensures transparency and immutability in tracking intellectual property.
            </p>
          </div>

          <div className="feature-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-4">
              <Zap className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              AI-Powered Analysis
            </h3>
            <p className="text-gray-400 mb-4">
              Our advanced AI algorithms scan your music to detect potential copyright conflicts, even in short samples or modified audio.
            </p>
            <p className="text-gray-400">
              Get instant feedback on potential issues before releasing your tracks.
            </p>
          </div>

          <div className="feature-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-4">
              <Shield className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              Verification Certificates
            </h3>
            <p className="text-gray-400 mb-4">
              Receive blockchain-verified certificates for your original works, providing proof of verification.
            </p>
            <p className="text-gray-400">
              Share these certificates with platforms, labels, and collaborators to demonstrate due diligence.
            </p>
          </div>

          <div className="feature-card neptune-card p-8 rounded-xl opacity-0">
            <div className="feature-icon mb-4">
              <Globe className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              Global Protection
            </h3>
            <p className="text-gray-400 mb-4">
              Our system continuously scans the internet for new music, ensuring the most up-to-date protection.
            </p>
            <p className="text-gray-400">
              Stay protected against emerging content and evolving copyright landscapes worldwide.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
