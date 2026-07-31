type FormErrorProps = {
  message: string | null
}

export const FormError = ({ message }: FormErrorProps) => {
  if (message === null) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
