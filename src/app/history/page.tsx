import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderHistory } from '@/components/orders/order-history'

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(table_number),
      order_items(
        *,
        product:products(name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <OrderHistory orders={orders || []} />
    </div>
  )
}
