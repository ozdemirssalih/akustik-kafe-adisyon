'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, RotateCcw, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react'

interface OrderHistoryProps {
  orders: any[]
}

export function OrderHistory({ orders: initOrders }: OrderHistoryProps) {
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState(initOrders)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'cancelled'>('all')
  const [search, setSearch] = useState('')

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter
    const matchesSearch = search === '' ||
      o.table?.table_number?.includes(search) ||
      o.order_items?.some((item: any) => item.product?.name?.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const reopenOrder = async (order: any) => {
    if (!confirm(`Masa ${order.table?.table_number} siparisini tekrar acmak istiyor musunuz?`)) return

    const { error } = await supabase
      .from('orders')
      .update({ status: 'open', closed_at: null, payment_method: null })
      .eq('id', order.id)

    if (error) { alert('Hata: ' + error.message); return }

    // Set table as occupied
    await supabase.from('tables').update({ status: 'occupied' }).eq('id', order.table_id)

    // Delete payment record
    await supabase.from('payments').delete().eq('order_id', order.id)

    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'open', closed_at: null, payment_method: null } : o))
    router.push(`/orders/${order.id}`)
  }

  const deleteOrder = async (order: any) => {
    if (!confirm(`Bu siparisi kalici olarak silmek istiyor musunuz?`)) return

    // Delete order items first
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('payments').delete().eq('order_id', order.id)
    const { error } = await supabase.from('orders').delete().eq('id', order.id)

    if (error) { alert('Hata: ' + error.message); return }
    setOrders(orders.filter(o => o.id !== order.id))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="warning">Acik</Badge>
      case 'closed': return <Badge variant="success">Kapali</Badge>
      case 'cancelled': return <Badge variant="danger">Iptal</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getPaymentLabel = (method: string | null) => {
    switch (method) {
      case 'cash': return 'Nakit'
      case 'card': return 'Kart'
      case 'split': return 'Bolumlu'
      default: return '-'
    }
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Logo height={168} />
          </div>
          <div className="flex gap-2">
            {(['all', 'open', 'closed', 'cancelled'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  filter === f ? 'bg-amber-700 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f === 'all' ? 'Tumu' : f === 'open' ? 'Acik' : f === 'closed' ? 'Kapali' : 'Iptal'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Masa no veya urun adi ile ara..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <p className="text-sm text-stone-500">{filteredOrders.length} siparis</p>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrder === order.id
            return (
              <Card key={order.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-black text-stone-800">{order.table?.table_number || '?'}</p>
                      <p className="text-xs text-stone-500">Masa</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        {order.payment_method && (
                          <span className="text-xs text-stone-500">{getPaymentLabel(order.payment_method)}</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {formatDateTime(order.closed_at || order.opened_at)}
                      </p>
                      <p className="text-xs text-stone-400">
                        {order.order_items?.length || 0} kalem
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-amber-700">{formatCurrency(order.total_amount)}</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t">
                    {/* Order items */}
                    <div className="p-4 space-y-1">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span className="text-stone-600">{item.quantity}x {item.product?.name}</span>
                          <span className="font-medium text-stone-800">{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t bg-stone-50 flex gap-2">
                      {order.status === 'open' && (
                        <Link href={`/orders/${order.id}`} className="flex-1">
                          <Button size="sm" className="w-full">Siparise Git</Button>
                        </Link>
                      )}
                      {order.status === 'closed' && (
                        <Button size="sm" variant="secondary" onClick={() => reopenOrder(order)} className="flex-1">
                          <RotateCcw className="w-4 h-4 mr-1" /> Tekrar Ac
                        </Button>
                      )}
                      {order.status === 'cancelled' && (
                        <Button size="sm" variant="secondary" onClick={() => reopenOrder(order)} className="flex-1">
                          <RotateCcw className="w-4 h-4 mr-1" /> Tekrar Ac
                        </Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => deleteOrder(order)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          {filteredOrders.length === 0 && (
            <p className="text-center text-stone-400 py-12">Siparis bulunamadi</p>
          )}
        </div>
      </main>
    </>
  )
}
