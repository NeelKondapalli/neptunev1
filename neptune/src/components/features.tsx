import { Database, Shield, Zap, Globe } from 'lucide-react'

export function Features() {
  return (
    <section className="relative w-full py-20 px-4">
      <div className="absolute inset-0 z-0">
        <div className="neptune-glow bottom-0 right-1/4 w-80 h-80" style={{ backgroundColor: "var(--neptune-purple-600)" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neptune-gradient">
            How Neptune Protects You
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our AI-powered oracle scans your music against a decentralized database to ensure originality
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="neptune-card p-8 rounded-xl">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
              <Database className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
              Decentralized Database
            </h3>
            <p className="text-gray-300 mb-4">
              Built on Story Protocol, our platform maintains a comprehensive, decentralized database of registered
              music and samples.
            </p>
            <p className="text-gray-300">
              This blockchain-based approach ensures transparency and immutability in tracking intellectual property.
            </p>
          </div>

          <div className="neptune-card p-8 rounded-xl">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
              <Zap className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
              AI-Powered Analysis
            </h3>
            <p className="text-gray-300 mb-4">
              Our advanced AI algorithms scan your music to detect potential copyright conflicts, even in short samples
              or modified audio.
            </p>
            <p className="text-gray-300">Get instant feedback on potential issues before releasing your tracks.</p>
          </div>

          <div className="neptune-card p-8 rounded-xl">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
              <Shield className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
              Verification Certificates
            </h3>
            <p className="text-gray-300 mb-4">
              Receive blockchain-verified certificates for your original works, providing proof of verification.
            </p>
            <p className="text-gray-300">
              Share these certificates with platforms, labels, and collaborators to demonstrate due diligence.
            </p>
          </div>

          <div className="neptune-card p-8 rounded-xl">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
              <Globe className="h-6 w-6" style={{ color: "var(--neptune-violet-400)" }} />
              Global Protection
            </h3>
            <p className="text-gray-300 mb-4">
              Our system continuously scans the internet for new music, ensuring the most up-to-date protection.
            </p>
            <p className="text-gray-300">
              Stay protected against emerging content and evolving copyright landscapes worldwide.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
