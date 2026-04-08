import { createClient } from '@/lib/supabase/server'
import { ReportsDashboard } from '@/components/reports/reports-dashboard'

export default async function ReportsPage() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const orderSelect = `id, status, total_amount, payment_method, closed_at, table:tables(table_number), order_items(id, quantity, total_price, product_id, product:products(name, category_id)), payments(cash_amount, card_amount, payment_method)`

  const [{ data: orders }, { data: allOrders }] = await Promise.all([
    supabase.from('orders').select(orderSelect).eq('status', 'closed').gte('closed_at', today.toISOString()).lt('closed_at', tomorrow.toISOString()).order('closed_at', { ascending: false }),
    supabase.from('orders').select(orderSelect).eq('status', 'closed').order('closed_at', { ascending: false }).limit(500),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportsDashboard
        todayOrders={orders || []}
        allOrders={allOrders || []}
      />
    </div>
  )
}
