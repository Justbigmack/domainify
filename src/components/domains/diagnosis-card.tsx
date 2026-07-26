import { AlertTriangleIcon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { Diagnosis } from '@/lib/domains/insights'
import type { CheckVerdict } from '@/lib/dns/types'

const TONE_CLASSES: Partial<Record<CheckVerdict, string>> = {
  misplaced_record: 'border-warning/40 bg-warning-soft',
  wrong_value: 'border-warning/40 bg-warning-soft',
}

type DiagnosisCardProps = {
  diagnosis: Diagnosis
}

export const DiagnosisCard = ({ diagnosis }: DiagnosisCardProps) => (
  <div
    className={cn(
      'flex gap-3 rounded-xl border border-border bg-surface-muted/40 px-4 py-3.5',
      TONE_CLASSES[diagnosis.verdict],
    )}
  >
    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-ink-muted" />
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-sm font-medium break-words">{diagnosis.title}</p>
      <p className="text-sm leading-6 text-ink-muted">{diagnosis.body}</p>
      {diagnosis.expectedTail && (
        <dl className="mt-1 flex flex-col gap-1 font-mono text-xs">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-subtle">Expected</dt>
            <dd className="text-success">{diagnosis.expectedTail}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-subtle">Found</dt>
            <dd className="text-danger">{diagnosis.foundTail ?? '—'}</dd>
          </div>
        </dl>
      )}
    </div>
  </div>
)
