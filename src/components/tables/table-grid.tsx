'use client'

import Link from 'next/link'
import { Table } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface TableGridProps {
  tables: Table[]
}

export function TableGrid({ tables }: TableGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {tables.map((table) => (
        <Link
          key={table.id}
          href={`/orders/new?table=${table.id}`}
          className="block group"
        >
          <div
            className={`
              relative p-6 rounded-2xl border-2 transition-all duration-200
              hover:shadow-xl hover:-translate-y-1
              ${
                table.status === 'available'
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-400'
                  : table.status === 'occupied'
                  ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:border-red-400'
                  : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-400'
              }
            `}
          >
            <Badge
              variant={
                table.status === 'available'
                  ? 'success'
                  : table.status === 'occupied'
                  ? 'danger'
                  : 'warning'
              }
              className="absolute top-3 right-3"
            >
              {table.status === 'available'
                ? 'Bos'
                : table.status === 'occupied'
                ? 'Dolu'
                : 'Rezerve'}
            </Badge>

            <div className="text-center mt-4">
              <p className="text-4xl font-black text-stone-800 group-hover:text-amber-800 transition-colors">
                {table.table_number}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2 text-stone-500">
                <Users className="w-3.5 h-3.5" />
                <p className="text-sm font-medium">
                  {table.capacity} kisilik
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
