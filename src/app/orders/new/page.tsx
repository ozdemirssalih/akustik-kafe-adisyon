import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderForm } from '@/components/orders/order-form'

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tableId = params.table
  if (!tableId) redirect('/')

  // Get table info
  const { data: table } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single()

  if (!table) redirect('/')

  // Check if table already has an open order - redirect to it
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .limit(1)
    .single()

  if (existingOrder) {
    redirect(`/orders/${existingOrder.id}`)
  }

  // Get products with categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*, products(*)')
    .eq('is_active', true)
    .order('display_order')

  // Get user profile for waiter_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Masa {table.table_number}
            </h1>
            <p className="text-sm text-stone-500">{table.capacity} kisilik</p>
          </div>
        </div>
      </header>

      <main className="p-4">
        <OrderForm
          table={table}
          categories={categories || []}
          waiterId={profile?.id || user.id}
        />
      </main>
    </div>
  )
}
