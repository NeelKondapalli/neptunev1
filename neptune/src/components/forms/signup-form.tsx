"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { createClient } from '@supabase/supabase-js'
import { toast } from "sonner"
import { useState } from "react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const formSchema = z.object({
    email: z.string().email({
        message: "Invalid email address",
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters long",
    }),
  })

  
  export function SignupForm() {
    const router = useRouter()
    const [showEmailAlert, setShowEmailAlert] = useState(false)
    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    })
   
    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        })
        
        if (error) {
          console.error(error)
          toast.error(error.message || "An error occurred during signup")
        } else {
          console.log(data)
          router.push("/dashboard")
        }
      } catch (err) {
        console.error(err)
        toast.error("An unexpected error occurred during signup")
      }
    }

    // Handle email validation
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (e.target.value && !emailRegex.test(e.target.value)) {
        setShowEmailAlert(true);
      } else {
        setShowEmailAlert(false);
      }
    };

    return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="johndoe@example.com" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleEmailChange(e);
                      }}
                    />
                  </FormControl>
                  {showEmailAlert && (
                    <Alert 
                      variant="destructive" 
                      className="mt-2 p-2 border-red-500/50 text-red-600"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>
                        Please enter a valid email address (e.g., name@example.com)
                      </AlertDescription>
                    </Alert>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      )
  }