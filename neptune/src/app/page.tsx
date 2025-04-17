import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Problem } from "@/components/problem"
import { Waitlist } from "@/components/waitlist"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/10 via-black to-black pointer-events-none"></div>
      <Hero />
      <Problem />
      <Features />
      <Waitlist />
      <Footer />
    </main>
  )
}
