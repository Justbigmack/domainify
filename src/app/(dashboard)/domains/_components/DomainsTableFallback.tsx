import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  SECTION_TABLE_CELL_CLASS as TABLE_CELL_CLASS,
  SECTION_TABLE_HEAD_CLASS as TABLE_HEAD_CLASS,
} from '@/components/brand/Section'
import { cn } from '@/lib/utils'

const SKELETON_ROW_COUNT = 5
const CARD_CLASS = 'overflow-hidden rounded-xl border border-border/50 bg-card'

const COLUMN_LABELS = [
  { label: 'Domain', className: '' },
  { label: 'Status', className: 'w-44' },
  { label: 'Created', className: 'w-36' },
  { label: 'Last checked', className: 'w-36' },
  { label: 'Actions', className: 'w-24 text-right' },
] as const

const skeletonRowKeys = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => index)

export const DomainsTableFallback = () => (
  <div aria-busy className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-9 flex-1 rounded-lg" />
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
    <div className={cn(CARD_CLASS, 'md:hidden')}>
      {skeletonRowKeys.map((rowKey) => (
        <div
          key={rowKey}
          className="flex items-center gap-3 border-t border-border/40 px-5 py-4 first:border-t-0"
        >
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="size-4 shrink-0" />
        </div>
      ))}
    </div>
    <div className={cn(CARD_CLASS, 'hidden md:block')}>
      <Table>
        <TableHeader>
          <TableRow className="border-border/40 hover:bg-transparent">
            {COLUMN_LABELS.map((column) => (
              <TableHead key={column.label} className={cn(TABLE_HEAD_CLASS, column.className)}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {skeletonRowKeys.map((rowKey) => (
            <TableRow key={rowKey} className="border-border/40 hover:bg-transparent">
              <TableCell className={TABLE_CELL_CLASS}>
                <Skeleton className="h-5 w-52" />
              </TableCell>
              <TableCell className={TABLE_CELL_CLASS}>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell className={TABLE_CELL_CLASS}>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className={TABLE_CELL_CLASS}>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className={cn(TABLE_CELL_CLASS, 'text-right')}>
                <div className="-mr-2.5 flex justify-end">
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
)
