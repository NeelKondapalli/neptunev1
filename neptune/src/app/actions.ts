'use server'

import { supabase } from '@/lib/supabase'

export async function signUpForWaitlist(email: string) {
  try {
    const { error } = await supabase
      .from('signups')
      .insert([
        {email: email.toLowerCase()}
      ])

    if (error) {
      if (error.code === '23505') {
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