import type { ReactNode } from 'react'
import {
  SETTINGS_TABLE_CELL_CLASS,
  SETTINGS_TABLE_HEAD_CLASS,
  settingsTableRowClass,
} from '@/components/brand/Settings'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type DocsTableProps = {
  columns: string[]
  rows: ReactNode[][]
}

export const DocsTable = ({ columns, rows }: DocsTableProps) => (
  <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead key={column} className={SETTINGS_TABLE_HEAD_CLASS}>
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex} className={settingsTableRowClass(rowIndex === rows.length - 1)}>
            {row.map((cell, cellIndex) => (
              <TableCell
                key={cellIndex}
                className={cn(
                  SETTINGS_TABLE_CELL_CLASS,
                  'align-top leading-6 whitespace-normal text-muted-foreground',
                )}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
