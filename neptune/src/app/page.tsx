import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Problem } from "@/components/problem"
import { Waitlist } from "@/components/waitlist"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="geometric-background"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-violet-900/5 to-transparent pointer-events-none"></div>
      <div className="noise-overlay"></div>
      <Hero />
      <Problem />
      <Features />
      <Waitlist />
      <Footer />
    </main>
  )
}
