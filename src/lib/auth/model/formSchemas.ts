import { z } from 'zod'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/model/policy'

const NAME_MAX_LENGTH = 64

export const emailFieldSchema = z
  .string()
  .trim()
  .min(1, { error: 'Enter your email address.' })
  .pipe(z.email({ error: 'Enter a valid email address, e.g. you@company.com.' }))

export const passwordFieldSchema = z.string().min(1, { error: 'Enter your password.' })

export const newPasswordFieldSchema = z.string().min(PASSWORD_MIN_LENGTH, {
  error: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
})

export const nameFieldSchema = z
  .string()
  .trim()
  .min(1, { error: 'Enter your name.' })
  .max(NAME_MAX_LENGTH, { error: `Keep your name to ${NAME_MAX_LENGTH} characters or fewer.` })

export const loginFormSchema = z.object({
  email: emailFieldSchema,
  password: passwordFieldSchema,
})

export const magicLinkFormSchema = z.object({
  email: emailFieldSchema,
})

export const forgotPasswordFormSchema = z.object({
  email: emailFieldSchema,
})

export const resetPasswordFormSchema = z.object({
  newPassword: newPasswordFieldSchema,
})

export const signUpFormSchema = z.object({
  name: nameFieldSchema,
  email: emailFieldSchema,
  password: newPasswordFieldSchema,
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type MagicLinkFormValues = z.infer<typeof magicLinkFormSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>
export type SignUpFormValues = z.infer<typeof signUpFormSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>
