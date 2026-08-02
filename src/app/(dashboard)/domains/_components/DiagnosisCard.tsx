import { TriangleAlertIcon } from 'lucide-react'
import { Text } from '@/components/brand/Text'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { Diagnosis } from '@/lib/domains/model/insights'
import type { CheckVerdict } from '@/lib/dns/types'

const TONE_CLASSES: Partial<Record<CheckVerdict, string>> = {
  misplaced_record: 'border-warning/40 bg-warning/10',
  wrong_value: 'border-warning/40 bg-warning/10',
}

type DiagnosisCardProps = {
  diagnosis: Diagnosis
}

export const DiagnosisCard = ({ diagnosis }: DiagnosisCardProps) => (
  <Alert className={cn('rounded-xl px-5', TONE_CLASSES[diagnosis.verdict])}>
    <TriangleAlertIcon className="text-muted-foreground" />
    <AlertTitle className="break-words">{diagnosis.title}</AlertTitle>
    <AlertDescription>
      <Text className="text-inherit">{diagnosis.body}</Text>
      {diagnosis.expectedTail && (
        <dl className="mt-1 flex flex-col gap-1 text-xs tabular-nums">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted-foreground">Expected</dt>
            <dd className="text-success">{diagnosis.expectedTail}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted-foreground">Found</dt>
            <dd className="text-destructive">{diagnosis.foundTail ?? '—'}</dd>
          </div>
        </dl>
      )}
    </AlertDescription>
  </Alert>
)
