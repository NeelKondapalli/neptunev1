import { Shield, AlertTriangle, Check } from "lucide-react"

export function Problem() {
  return (
    <section id="learn-more" className="relative w-full py-20 px-4">
      <div className="absolute inset-0 z-0">
        <div
          className="neptune-glow top-0 left-1/4 w-72 h-72"
          style={{ backgroundColor: "var(--neptune-violet-600)" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neptune-gradient">The Problem for Music Creators</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            In today's music industry, unintentional copyright infringement can destroy careers and lead to costly legal
            battles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="neptune-card p-8 rounded-xl">
            <div className="bg-[var(--neptune-violet-700)]/20 p-3 rounded-full w-fit mb-6">
              <AlertTriangle className="h-8 w-8" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Accidental Sampling</h3>
            <p className="text-gray-300">
              Even a few seconds of uncleared samples can lead to copyright claims, lost revenue, and legal issues.
            </p>
          </div>

          <div className="neptune-card p-8 rounded-xl">
            <div className="bg-[var(--neptune-violet-700)]/20 p-3 rounded-full w-fit mb-6">
              <Shield className="h-8 w-8" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Unclear Ownership</h3>
            <p className="text-gray-300">
              The complex web of music rights makes it difficult to know if your creative work is truly original.
            </p>
          </div>

          <div className="neptune-card p-8 rounded-xl">
            <div className="bg-[var(--neptune-violet-700)]/20 p-3 rounded-full w-fit mb-6">
              <Check className="h-8 w-8" style={{ color: "var(--neptune-violet-400)" }} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">Peace of Mind</h3>
            <p className="text-gray-300">
              Create with confidence knowing your work has been verified against a comprehensive database of protected
              music.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
