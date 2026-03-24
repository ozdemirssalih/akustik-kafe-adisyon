'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Table, Category, Product } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Minus, Plus, X } from 'lucide-react'

interface OrderItem {
  product: Product
  quantity: number
  notes?: string
}

interface OrderFormProps {
  table: Table
  categories: (Category & { products: Product[] })[]
  waiterId: string
}

export function OrderForm({ table, categories, waiterId }: OrderFormProps) {
  const router = useRouter()
  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.id || ''
  )
  const [loading, setLoading] = useState(false)

  const addItem = (product: Product) => {
    const existing = items.find((item) => item.product.id === product.id)
    if (existing) {
      setItems(
        items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setItems([...items, { product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    setItems(
      items
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.product.id !== productId))
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const handleSubmit = async () => {
    if (items.length === 0) return

    setLoading(true)
    const supabase = createClient()

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: table.id,
          waiter_id: waiterId,
          status: 'open',
          subtotal,
          tax_amount: 0,
          total_amount: subtotal,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        notes: item.notes,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Update table status
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', table.id)

      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Sipariş oluşturulurken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const currentCategory = categories.find((c) => c.id === selectedCategory)
  const availableProducts = currentCategory?.products.filter((p) => p.is_available) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addItem(product)}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
            >
              <p className="font-semibold text-gray-900 mb-1">{product.name}</p>
              <p className="text-sm text-blue-600 font-medium">
                {formatCurrency(product.price)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-20">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Sipariş Özeti</h2>
          </div>

          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Ürün seçimi yapın
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-2 bg-gray-50 p-2 rounded"
                >
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(item.product.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="font-semibold text-sm w-20 text-right">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => router.back()}
              >
                İptal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={items.length === 0 || loading}
              >
                {loading ? 'Kaydediliyor...' : 'Siparişi Aç'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
