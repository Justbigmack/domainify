import { Text } from '@/components/brand/Text'

type FormErrorProps = {
  message: string | null
}

export const FormError = ({ message }: FormErrorProps) => {
  if (message === null) return null
  return (
    <Text role="alert" className="text-destructive">
      {message}
    </Text>
  )
}
