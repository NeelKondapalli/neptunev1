export function Footer() {
    return (
      <footer className="relative w-full py-10 px-4 border-t border-[var(--neptune-violet-800)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-2xl font-bold text-neptune-gradient">
              Neptune
            </p>
          </div>
  
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
  
          <div className="mt-4 md:mt-0">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Neptune</p>
          </div>
        </div>
      </footer>
    )
  }
  