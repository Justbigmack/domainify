'use server'

import type { AccountSession } from '@/lib/auth/server/session'
import { listAccountSessions } from '@/lib/auth/server/session'

export const loadAccountSessions = async (): Promise<AccountSession[]> => listAccountSessions()
