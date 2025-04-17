"use server"

import { z } from "zod"

// Define the login schema using Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
})

// Define the form state type
export type LoginFormState = {
  errors?: {
    email?: string
    password?: string
  }
  error?: string
  success?: boolean
}

export async function loginAction(prevState: LoginFormState | undefined, formData: FormData): Promise<LoginFormState> {
  // Validate form fields
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  // If form validation fails, return errors
  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      errors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    }
  }

  // Get validated data
  const { email, password } = validatedFields.data

  try {
    // Here you would typically authenticate the user with your auth provider
    // This is a placeholder for demonstration purposes
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate a successful login
    // In a real application, you would check credentials against your database
    // and create a session or token

    // For demo purposes, let's simulate a failed login for a specific email
    if (email === "test@example.com" && password !== "password123") {
      return {
        error: "Invalid credentials. Please try again.",
      }
    }

    // Return success state
    return {
      success: true,
    }
  } catch (error) {
    // Handle any errors that occur during authentication
    return {
      error: "An error occurred during sign in. Please try again.",
    }
  }
}
