'use server'

import { createClient } from '@/lib/supabase/client'

export async function signUpForWaitlist(email: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('signups')
      .insert([
        {email: email.toLowerCase()}
      ])

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, message: 'You have already signed up for the waitlist!' }
      }
      throw error
    }

    return { success: true, message: 'Successfully signed up for the waitlist!' }
  } catch (error) {
    console.error('Error signing up for waitlist:', error)
    return { 
      success: false, 
      message: 'There was an error signing up. Please try again later.' 
    }
  }
} 