import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "@/styles/globals.css"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Neptune | AI-Powered Copyright Protection for Music Creators",
  description:
    "Neptune helps music creators avoid unintentional copyright infringement using AI and blockchain technology.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  )
}
