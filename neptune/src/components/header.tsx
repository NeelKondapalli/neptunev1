"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      toast.error("Error signing out. Please try again.")
      return
    }

    toast.success("Successfully signed out!")
    router.replace("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-[var(--neptune-violet-800)]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-2xl font-bold text-neptune-gradient"
        >
          Neptune
        </Link>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="text-gray-300 hover:text-white hover:bg-[var(--neptune-violet-700)]/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  )
} 