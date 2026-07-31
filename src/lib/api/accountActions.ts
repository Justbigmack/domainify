'use server'

import type { AccountSession } from '@/lib/api/session'
import { listAccountSessions } from '@/lib/api/session'

export const loadAccountSessions = async (): Promise<AccountSession[]> => listAccountSessions()
