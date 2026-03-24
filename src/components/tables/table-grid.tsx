'use client'

import Link from 'next/link'
import { Table } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'

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
          className="block"
        >
          <div
            className={`
              relative p-6 rounded-lg border-2 transition-all hover:shadow-lg
              ${
                table.status === 'available'
                  ? 'bg-white border-green-200 hover:border-green-400'
                  : table.status === 'occupied'
                  ? 'bg-red-50 border-red-300 hover:border-red-400'
                  : 'bg-yellow-50 border-yellow-300 hover:border-yellow-400'
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
              className="absolute top-2 right-2"
            >
              {table.status === 'available'
                ? 'Boş'
                : table.status === 'occupied'
                ? 'Dolu'
                : 'Rezerve'}
            </Badge>

            <div className="text-center mt-4">
              <p className="text-3xl font-bold text-gray-900">
                {table.table_number}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {table.capacity} kişilik
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
