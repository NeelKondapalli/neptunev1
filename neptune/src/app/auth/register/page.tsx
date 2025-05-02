"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const registerFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
})

type RegisterFormValues = z.infer<typeof registerFormSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    const supabase = createClient()

    try {

      const { data: signup, error: signupError } = await supabase
        .from('signups')
        .select()
        .eq('email', data.email)
        .eq('approved', true)
        .single()
    
      if (!signup) {
        toast.error("You need to join and be approved off the waitlist first!")
        setIsLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: '/create',
        },
      })

      if (error) {
        switch (error.code) {
          case "user_already_exists":
            toast.error("This user already exists. Please login.")
            break
          case "email_not_confirmed":
            toast.error("Please confirm your email before logging in.")
            break
          case "email_exists":
            toast.error("This email is already in use.")
            break
          case "over_request_rate_limit":
            toast.error("Too many login attempts. Please wait and try again.")
            break
          default:
            toast.error(error.message || "Signup failed. Please try again.")
        }
        return
      }

      toast.success("Successfully registered! Please check your email to verify your account.")
      router.push("/auth/login")
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="geometric-background"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-violet-900/5 to-transparent pointer-events-none"></div>
      <div className="noise-overlay"></div>

      <div className="container relative flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-neptune-gradient sm:text-4xl">
              Create Your Account
            </h1>
            <p className="mt-2 text-gray-300">
              Join Neptune to start creating music
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-[var(--neptune-violet-800)]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your@email.com"
                          className="bg-black/50 border-[var(--neptune-violet-600)] text-white placeholder:text-gray-400 h-12 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="bg-black/50 border-[var(--neptune-violet-600)] text-white placeholder:text-gray-400 h-12 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neptune-button-gradient text-white font-semibold h-12 rounded-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Signing up...
                    </div>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-400">Already have an account? </span>
              <Link
                href="/auth/login"
                className="text-[var(--neptune-violet-400)] hover:text-[var(--neptune-violet-300)] font-medium"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-400">Not on the waitlist? </span>
              <Link
                href="/"
                className="text-[var(--neptune-violet-400)] hover:text-[var(--neptune-violet-300)] font-medium"
              >
                Join now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}