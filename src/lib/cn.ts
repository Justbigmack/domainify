type ClassDictionary = Record<string, boolean | null | undefined>
type ClassValue = string | ClassDictionary | null | undefined | false

export const cn = (...inputs: ClassValue[]): string => {
  const classes: string[] = []
  for (const input of inputs) {
    if (!input) continue
    if (typeof input === 'string') {
      classes.push(input)
      continue
    }
    for (const [className, isEnabled] of Object.entries(input)) {
      if (isEnabled) classes.push(className)
    }
  }
  return classes.join(' ')
}
