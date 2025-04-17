export function Footer() {
    return (
      <footer className="relative w-full py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">
              Neptune
            </p>
          </div>
  
          <div className="mt-4 md:mt-0">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Neptune. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
  }
  