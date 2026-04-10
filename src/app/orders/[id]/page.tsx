import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedActiveCategories } from '@/lib/supabase/cached'
import { OrderDetails } from '@/components/orders/order-details'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const [{ data: order }, categories] = await Promise.all([
    supabase.from('orders').select(`*, table:tables(*), order_items(*, product:products(*))`).eq('id', id).single(),
    getCachedActiveCategories(),
  ])

  if (!order) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50">
      <OrderDetails
        order={order}
        categories={categories}
      />
    </div>
  )
}
