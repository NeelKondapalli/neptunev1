"use client"

import { useState, useRef, useEffect } from 'react'
import { signUpForWaitlist } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Waitlist() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string | null
  }>({ type: null, message: null })
  const [isLoading, setIsLoading] = useState(false)
  const [highlightForm, setHighlightForm] = useState(false)
  
  const waitlistRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Animation for section fade-in
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    
    if (waitlistRef.current) {
      observer.observe(waitlistRef.current)
    }
    
    // Check if user was directed from hero section
    const checkRedirectSource = () => {
      // Check for hash in URL
      if (window.location.hash === '#waitlist') {
        // Apply highlight effect to form
        if (formRef.current) {
          setHighlightForm(true)
          formRef.current.classList.add('form-highlight')
          setTimeout(() => {
            setHighlightForm(false)
            if (formRef.current) {
              formRef.current.classList.remove('form-highlight')
            }
          }, 2000)
        }
      }
      
      // Check if the user came from hero section with successful signup
      const signupSource = localStorage.getItem('waitlist_signup_source')
      if (signupSource === 'hero') {
        // Set success message
        setStatus({
          type: 'success',
          message: 'Successfully signed up for the waitlist!'
        })
        
        // Clear the localStorage flag
        localStorage.removeItem('waitlist_signup_source')
        
        // Apply stronger highlight effect to form
        if (formRef.current) {
          setHighlightForm(true)
          formRef.current.classList.add('form-highlight')
          setTimeout(() => {
            setHighlightForm(false)
            if (formRef.current) {
              formRef.current.classList.remove('form-highlight')
            }
          }, 3000)
        }
      }
    }
    
    // Check on load and when hash changes
    window.addEventListener('hashchange', checkRedirectSource)
    checkRedirectSource()
    
    return () => {
      if (waitlistRef.current) {
        observer.unobserve(waitlistRef.current)
      }
      window.removeEventListener('hashchange', checkRedirectSource)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({ type: null, message: null })

    try {
      const result = await signUpForWaitlist(email)
      setStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      })
      if (result.success) {
        setEmail('')
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'There was an error signing up. Please try again later.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="waitlist" className="relative py-20">
      <div className="absolute inset-0 z-0">
        <div className="neptune-glow top-20 left-1/4 w-60 h-60" style={{ backgroundColor: "var(--neptune-violet-600)" }} />
      </div>
      
      <div ref={waitlistRef} className="relative w-full py-10 px-4 opacity-0" style={{ transitionDelay: "0.2s" }}>
        <div className="flex flex-col items-center space-y-6 text-center max-w-lg mx-auto">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter text-neptune-gradient sm:text-4xl">
              Join the Waitlist
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-300 md:text-lg">
              Be the first to know when we launch and protect your music from copyright issues.
            </p>
          </div>
          
          <div 
            ref={formRef}
            className={`w-full max-w-md space-y-4 bg-black/30 backdrop-blur-md rounded-2xl p-6 border ${
              highlightForm ? 'border-[var(--neptune-violet-400)]' : 'border-[var(--neptune-violet-800)]'
            }`}
          >
            {status.type === 'success' && status.message && (
              <div className="bg-green-900/20 text-green-400 p-3 rounded-lg mb-2 text-sm">
                {status.message}
              </div>
            )}
            
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <Input
                className="bg-black/50 border-[var(--neptune-violet-600)] text-white placeholder:text-gray-400 h-12 rounded-xl"
                placeholder="your@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                className="bg-neptune-button-gradient text-white font-semibold h-12 rounded-xl"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'Signing up...' : 'Join Waitlist'}
              </Button>
            </form>
            
            {status.type === 'error' && status.message && (
              <p className="text-sm text-red-400">
                {status.message}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--neptune-violet-600)]"></div>
            <span>AI-Powered</span>
            <span>•</span>
            <span>Blockchain Verified</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--neptune-violet-600)]"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
