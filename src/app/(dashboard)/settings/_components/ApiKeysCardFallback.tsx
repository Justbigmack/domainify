import { Skeleton } from '@/components/ui/skeleton'
import {
  SECTION_TABLE_CELL_CLASS,
  SECTION_TABLE_HEAD_CLASS,
  Section,
  SectionContent,
  SectionToolbar,
} from '@/components/brand/Section'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const SKELETON_ROW_COUNT = 2

const COLUMNS = [
  { label: 'Name', className: '' },
  { label: 'Key', className: 'w-48' },
  { label: 'Created', className: 'w-32' },
  { label: 'Last used', className: 'w-32' },
  { label: 'Actions', className: 'w-24 text-right' },
] as const

const skeletonRowKeys = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => index)

export const ApiKeysCardFallback = () => (
  <Section aria-busy>
    <SectionContent>
      <SectionToolbar>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="-mr-2.5 h-8 w-28 rounded-md" />
      </SectionToolbar>
      <div className="md:hidden">
        {skeletonRowKeys.map((rowKey) => (
          <div
            key={rowKey}
            className="flex items-center gap-3 border-t border-border/40 px-5 py-4 first:border-t-0"
          >
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="size-4 shrink-0" />
          </div>
        ))}
      </div>
      <div className="max-md:hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              {COLUMNS.map((column) => (
                <TableHead
                  key={column.label}
                  className={cn(SECTION_TABLE_HEAD_CLASS, column.className)}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRowKeys.map((rowKey) => (
              <TableRow key={rowKey} className="border-border/40 hover:bg-transparent">
                <TableCell className={SECTION_TABLE_CELL_CLASS}>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell className={SECTION_TABLE_CELL_CLASS}>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell className={SECTION_TABLE_CELL_CLASS}>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className={SECTION_TABLE_CELL_CLASS}>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className={cn(SECTION_TABLE_CELL_CLASS, 'text-right')}>
                  <div className="-mr-2.5 flex justify-end">
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionContent>
  </Section>
)
