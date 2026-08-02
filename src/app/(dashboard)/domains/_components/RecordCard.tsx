import type { PropsWithChildren } from 'react'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import {
  SECTION_TABLE_CELL_CLASS,
  SECTION_TABLE_HEAD_CLASS,
  SECTION_TABLE_HEAD_DIVIDER_CLASS,
  SectionDivider,
  sectionTableRowClass,
} from '@/components/brand/Section'
import { CopyButton } from '@/components/brand/CopyButton'
import { StatusTag } from '@/components/brand/StatusTag'
import { Text } from '@/components/brand/Text'
import { MiddleTruncate } from '@/app/(dashboard)/domains/_components/MiddleTruncate'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { RecordStatus } from '@/lib/domains/model/status'

const FieldLabel = ({ children }: PropsWithChildren) => (
  <Text as="span" variant="caption" className="font-medium text-muted-foreground/80">
    {children}
  </Text>
)

type RecordFieldProps = {
  label: string
  value: string
  copyLabel: string
}

const RecordField = ({ label, value, copyLabel }: RecordFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <FieldLabel>{label}</FieldLabel>
    <div className="flex h-9 items-center gap-1 rounded-lg border border-input pr-1 pl-2.5 shadow-xs dark:bg-input/30">
      <Text as="span" className="flex min-w-0 flex-1 font-medium">
        <MiddleTruncate value={value} />
      </Text>
      <CopyButton value={value} label={copyLabel} className="text-muted-foreground" />
    </div>
  </div>
)

type RecordCardProps = {
  recordValue: string
  recordName: string
  recordStatus?: RecordStatus | null
}

export const RecordCard = ({ recordValue, recordName, recordStatus = null }: RecordCardProps) => {
  const isVerified = recordStatus === 'verified'

  return (
    <Collapsible defaultOpen={!isVerified} className="flex flex-col">
      {isVerified && (
        <CollapsibleTrigger className="group flex cursor-pointer items-center justify-between gap-2 rounded-t-xl px-5 py-3.5 text-sm text-muted-foreground transition-colors outline-none not-data-panel-open:rounded-b-xl hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset">
          <Text as="span" className="flex items-center gap-2 text-inherit">
            <CheckIcon className="size-4 shrink-0 text-success" />
            DNS records are verified. Expand to view them.
          </Text>
          <ChevronDownIcon className="size-4 shrink-0 transition-transform duration-200 ease-out group-data-panel-open:rotate-180 motion-reduce:transition-none" />
        </CollapsibleTrigger>
      )}
      <CollapsibleContent>
        {isVerified && <SectionDivider />}
        <div className="flex flex-col gap-4 px-5 py-4 sm:hidden">
          <RecordField label="Host" value={recordName} copyLabel="Copy record host" />
          <RecordField label="Value" value={recordValue} copyLabel="Copy record value" />
          {recordStatus !== null && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Status</FieldLabel>
              <StatusTag status={recordStatus} className="ml-0 self-start" />
            </div>
          )}
        </div>
        <div className="py-1 max-sm:hidden">
          <Table className="table-fixed">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className={sectionTableRowClass(false)}>
                <TableHead
                  className={cn(SECTION_TABLE_HEAD_CLASS, SECTION_TABLE_HEAD_DIVIDER_CLASS, 'w-20')}
                >
                  Type
                </TableHead>
                <TableHead className={cn(SECTION_TABLE_HEAD_CLASS, SECTION_TABLE_HEAD_DIVIDER_CLASS)}>
                  Host
                </TableHead>
                <TableHead className={cn(SECTION_TABLE_HEAD_CLASS, SECTION_TABLE_HEAD_DIVIDER_CLASS)}>
                  Value
                </TableHead>
                <TableHead
                  className={cn(SECTION_TABLE_HEAD_CLASS, SECTION_TABLE_HEAD_DIVIDER_CLASS, 'w-16')}
                >
                  TTL
                </TableHead>
                {recordStatus !== null && (
                  <TableHead
                    className={cn(SECTION_TABLE_HEAD_CLASS, SECTION_TABLE_HEAD_DIVIDER_CLASS, 'w-28')}
                  >
                    Status
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className={sectionTableRowClass(true)}>
                <TableCell className={SECTION_TABLE_CELL_CLASS}>
                  <Text as="span" className="text-muted-foreground/80">
                    TXT
                  </Text>
                </TableCell>
                <TableCell className={SECTION_TABLE_CELL_CLASS}>
                  <span className="flex items-center gap-1.5">
                    <Text as="span" className="min-w-0 truncate font-medium" title={recordName}>
                      {recordName}
                    </Text>
                    <CopyButton
                      value={recordName}
                      label="Copy record host"
                      className="text-muted-foreground"
                    />
                  </span>
                </TableCell>
                <TableCell className={SECTION_TABLE_CELL_CLASS}>
                  <span className="flex items-center gap-1.5">
                    <Text as="span" className="flex min-w-0 font-medium">
                      <MiddleTruncate value={recordValue} />
                    </Text>
                    <CopyButton
                      value={recordValue}
                      label="Copy record value"
                      className="text-muted-foreground"
                    />
                  </span>
                </TableCell>
                <TableCell className={SECTION_TABLE_CELL_CLASS}>
                  <Text as="span" className="text-muted-foreground">
                    Auto
                  </Text>
                </TableCell>
                {recordStatus !== null && (
                  <TableCell className={SECTION_TABLE_CELL_CLASS}>
                    <StatusTag status={recordStatus} />
                  </TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
