import type { PropsWithChildren } from 'react'
import { AuthPanel } from '@/app/(auth)/_components/AuthPanel'

const AuthLayout = ({ children }: PropsWithChildren) => <AuthPanel>{children}</AuthPanel>

export default AuthLayout
