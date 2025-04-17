"use client"

import { LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function DashboardHeader() {
  const router = useRouter()
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      toast.error('Error signing out')
    } else {
      router.push("/auth/login")
    }
  }
  
  return (
    <header className="w-full bg-gray-900 border-b border-purple-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-purple-400">Neptune</h2>
          <span className="ml-2 text-xs bg-purple-800 text-white px-2 py-0.5 rounded-full">
            Music IP Protection
          </span>
        </div>
        
        <Button 
          variant="ghost" 
          className="text-gray-300 hover:text-white hover:bg-purple-900"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
