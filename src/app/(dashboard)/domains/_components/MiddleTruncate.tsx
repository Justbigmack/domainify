const TAIL_KEEP_LENGTH = 8

type MiddleTruncateProps = {
  value: string
}

export const MiddleTruncate = ({ value }: MiddleTruncateProps) => {
  if (value.length <= TAIL_KEEP_LENGTH) {
    return <span title={value}>{value}</span>
  }
  return (
    <span className="flex min-w-0" title={value}>
      <span className="truncate">{value.slice(0, -TAIL_KEEP_LENGTH)}</span>
      <span className="shrink-0">{value.slice(-TAIL_KEEP_LENGTH)}</span>
    </span>
  )
}
