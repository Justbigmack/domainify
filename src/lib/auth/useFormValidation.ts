'use client'

import { useState } from 'react'
import { z } from 'zod'

type FieldName<Schema extends z.ZodObject> = keyof z.output<Schema> & string

export const useFormValidation = <Schema extends z.ZodObject>(
  schema: Schema,
  values: z.input<Schema>,
) => {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const parsed = schema.safeParse(values)
  const fieldErrors = parsed.success ? null : z.flattenError(parsed.error).fieldErrors

  const errorFor = (fieldName: FieldName<Schema>) => {
    if (!hasAttemptedSubmit) return null
    return fieldErrors?.[fieldName]?.[0] ?? null
  }

  const revealErrors = () => {
    setHasAttemptedSubmit(true)
  }

  const resetErrors = () => {
    setHasAttemptedSubmit(false)
  }

  return { parsed, errorFor, revealErrors, resetErrors }
}
