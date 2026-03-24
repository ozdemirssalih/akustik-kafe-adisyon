import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderDetails } from '@/components/orders/order-details'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get order with related data
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(*),
      order_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', id)
    .single()

  if (!order) redirect('/')

  // Get categories and products for adding items
  const { data: categories } = await supabase
    .from('categories')
    .select('*, products(*)')
    .eq('is_active', true)
    .order('display_order')

  return (
    <div className="min-h-screen bg-gray-50">
      <OrderDetails
        order={order}
        categories={categories || []}
      />
    </div>
  )
}
