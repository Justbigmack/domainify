import { Text } from '@/components/brand/Text'

type FormErrorProps = {
  message: string | null
  id?: string
}

export const FormError = ({ message, id }: FormErrorProps) => {
  if (message === null) return null
  return (
    <Text id={id} role="alert" className="text-destructive">
      {message}
    </Text>
  )
}
