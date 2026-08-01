'use server'

import type { AccountSession } from '@/lib/auth/session'
import { listAccountSessions } from '@/lib/auth/session'

export const loadAccountSessions = async (): Promise<AccountSession[]> => listAccountSessions()
