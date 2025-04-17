import { SignupForm } from "@/components/forms/signup-form"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-purple-500">Create an account</h1>
          <p className="mt-2 text-sm text-gray-400">
            Or{" "}
            <a href="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
              sign in to your account
            </a>
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
