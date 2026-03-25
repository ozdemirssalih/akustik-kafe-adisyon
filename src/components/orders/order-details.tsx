'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentModal } from './payment-modal'
import { Minus, Plus, X } from 'lucide-react'

export function OrderDetails({ order, categories }: any) {
  const router = useRouter()
  const [items, setItems] = useState(order.order_items || [])
  const [showPayment, setShowPayment] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const total = items.reduce(
    (sum: number, item: any) => sum + parseFloat(item.total_price),
    0
  )

  const addProduct = async (product: any) => {
    const existing = items.find((item: any) => item.product_id === product.id)

    if (existing) {
      const newQuantity = existing.quantity + 1
      const newTotal = product.price * newQuantity

      const { error } = await supabase
        .from('order_items')
        .update({
          quantity: newQuantity,
          total_price: newTotal,
        })
        .eq('id', existing.id)

      if (!error) {
        setItems(
          items.map((item: any) =>
            item.id === existing.id
              ? { ...item, quantity: newQuantity, total_price: newTotal }
              : item
          )
        )
      }
    } else {
      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: 1,
          unit_price: product.price,
          total_price: product.price,
        })
        .select('*, product:products(*)')
        .single()

      if (!error && data) {
        setItems([...items, data])
      }
    }

    // Update order total
    await updateOrderTotal()
  }

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = items.find((i: any) => i.id === itemId)
    if (!item) return

    const newQuantity = item.quantity + delta
    if (newQuantity <= 0) {
      await deleteItem(itemId)
      return
    }

    const newTotal = item.unit_price * newQuantity

    const { error } = await supabase
      .from('order_items')
      .update({
        quantity: newQuantity,
        total_price: newTotal,
      })
      .eq('id', itemId)

    if (!error) {
      setItems(
        items.map((i: any) =>
          i.id === itemId
            ? { ...i, quantity: newQuantity, total_price: newTotal }
            : i
        )
      )
      await updateOrderTotal()
    }
  }

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      setItems(items.filter((i: any) => i.id !== itemId))
      await updateOrderTotal()
    }
  }

  const updateOrderTotal = async () => {
    const newTotal = items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.total_price),
      0
    )

    await supabase
      .from('orders')
      .update({
        subtotal: newTotal,
        total_amount: newTotal,
      })
      .eq('id', order.id)
  }

  const handleCancelOrder = async () => {
    if (!confirm('Siparişi iptal etmek istediğinizden emin misiniz?')) return

    setLoading(true)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)

    if (!error) {
      await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', order.table_id)

      router.push('/')
    } else {
      alert('İptal işlemi başarısız')
    }
    setLoading(false)
  }

  const currentCategory = categories.find((c: any) => c.id === selectedCategory)
  const availableProducts = currentCategory?.products.filter((p: any) => p.is_available) || []

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Masa {order.table.table_number}
            </h1>
            <p className="text-sm text-gray-600">
              {formatDateTime(order.opened_at)}
            </p>
          </div>
          <Badge variant={order.status === 'open' ? 'warning' : 'default'}>
            {order.status === 'open' ? 'Açık' : order.status === 'closed' ? 'Kapalı' : 'İptal'}
          </Badge>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="space-y-4">
          {/* Order Items */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Sipariş Kalemleri</h2>
              <Button
                size="sm"
                onClick={() => setShowProducts(!showProducts)}
              >
                {showProducts ? 'Gizle' : 'Ürün Ekle'}
              </Button>
            </div>

            {showProducts && order.status === 'open' && (
              <div className="p-4 border-b space-y-3 bg-gray-50">
                <div className="flex gap-2 overflow-x-auto">
                  {categories.map((category: any) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                        selectedCategory === category.id
                          ? 'bg-amber-700 text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableProducts.map((product: any) => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="bg-white p-3 rounded border hover:border-amber-400 text-left"
                    >
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-amber-700">
                        {formatCurrency(product.price)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 space-y-2">
              {items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Henüz ürün eklenmemiş
                </p>
              ) : (
                items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded"
                  >
                    {order.status === 'open' && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.unit_price)}
                      </p>
                    </div>

                    {order.status === 'open' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium">x{item.quantity}</span>
                    )}

                    <p className="font-semibold w-24 text-right">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between text-xl font-bold">
                <span>Toplam</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {order.status === 'open' && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => router.push('/')}
              >
                Masalara Dön
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelOrder}
                disabled={loading}
              >
                İptal Et
              </Button>
              <Button
                className="flex-1"
                onClick={() => setShowPayment(true)}
                disabled={items.length === 0}
              >
                Hesabı Kapat
              </Button>
            </div>
          )}

          {order.status !== 'open' && (
            <Button onClick={() => router.push('/')} className="w-full">
              Masalara Dön
            </Button>
          )}
        </div>
      </main>

      {showPayment && (
        <PaymentModal
          order={{ ...order, total_amount: total, order_items: items }}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  )
}
