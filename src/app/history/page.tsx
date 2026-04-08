import { createClient } from '@/lib/supabase/server'
import { OrderHistory } from '@/components/orders/order-history'

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, payment_method, opened_at, closed_at, table_id,
      table:tables(table_number),
      order_items(
        id, quantity, unit_price, total_price, product_id,
        product:products(name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <OrderHistory orders={orders || []} />
    </div>
  )
}
