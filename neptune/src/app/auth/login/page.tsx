import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-purple-500">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-400">
            Or{" "}
            <a href="/auth/signup" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
              Sign up
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
