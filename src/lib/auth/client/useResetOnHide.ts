'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'

export const useResetOnHide = (reset: () => void) => {
  const shouldResetRef = useRef(false)
  const resetRef = useRef(reset)

  useLayoutEffect(
    () => () => {
      if (!shouldResetRef.current) return
      shouldResetRef.current = false
      resetRef.current()
    },
    [],
  )

  useLayoutEffect(() => {
    resetRef.current = reset
  })

  return useCallback(() => {
    shouldResetRef.current = true
  }, [])
}
