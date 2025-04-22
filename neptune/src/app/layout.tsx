import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "@/styles/globals.css"
import { Toaster } from "sonner"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Neptune | AI-Powered Music Creation",
  description:
    "Neptune is an AI-powered music creation platform that allows you to generate music using natural language.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={spaceGrotesk.className}>
        
        <div className="geometric-background"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-violet-900/5 to-transparent pointer-events-none"></div>
        <div className="noise-overlay"></div>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
  
    </html>
  )
}
