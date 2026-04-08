import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OrderForm } from '@/components/orders/order-form'

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const tableId = params.table
  if (!tableId) redirect('/')

  // Session needed for user.id — cookie read only, no API call
  const [{ data: { session } }, { data: table }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('tables').select('*').eq('id', tableId).single(),
  ])

  if (!table) redirect('/')

  const userId = session?.user?.id
  const [{ data: existingOrder }, { data: categories }, profileResult] = await Promise.all([
    supabase.from('orders').select(`*, order_items(*, product:products(*))`).eq('table_id', tableId).eq('status', 'open').limit(1).single(),
    supabase.from('categories').select('*, products(*)').eq('is_active', true).order('display_order'),
    userId ? supabase.from('profiles').select('id').eq('id', userId).single() : Promise.resolve({ data: null }),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="px-3 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold text-sm hover:bg-stone-200 transition-colors">
              ← Masalar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                Masa {table.table_number}
              </h1>
              <p className="text-sm text-stone-500">{table.capacity} kisilik</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4">
        <OrderForm
          table={table}
          categories={categories || []}
          waiterId={profileResult?.data?.id || userId || ''}
          existingOrder={existingOrder || null}
        />
      </main>
    </div>
  )
}
