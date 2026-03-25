import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReportsDashboard } from '@/components/reports/reports-dashboard'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get today's closed orders
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(table_number),
      order_items(
        *,
        product:products(name, category_id)
      )
    `)
    .eq('status', 'closed')
    .gte('closed_at', today.toISOString())
    .lt('closed_at', tomorrow.toISOString())
    .order('closed_at', { ascending: false })

  // Get all closed orders for comparison
  const { data: allOrders } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(table_number),
      order_items(
        *,
        product:products(name, category_id)
      )
    `)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportsDashboard
        todayOrders={orders || []}
        allOrders={allOrders || []}
      />
    </div>
  )
}
