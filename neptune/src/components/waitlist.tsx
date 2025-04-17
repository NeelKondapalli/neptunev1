"use client"

import { useState } from 'react'
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
    <section id = "waitlist" className="relative py-7">
      <div className="relative w-full py-20 px-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter text-neptune-gradient sm:text-4xl md:text-5xl">
              Join the Waitlist
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">
              Be the first to know when Neptune launches and protect your music from copyright issues.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
              <Input
                className="bg-black/50 border-[var(--neptune-violet-600)] text-white placeholder:text-gray-400"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                className="bg-neptune-button-gradient text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing up...' : 'Join Waitlist'}
              </Button>
            </form>
            {status.message && (
              <p className={status.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {status.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
