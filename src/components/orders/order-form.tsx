'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Table, Category, Product } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Minus, Plus, X, Search } from 'lucide-react'

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
  const [search, setSearch] = useState('')

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

  const allProducts = categories.flatMap(c => c.products.filter(p => p.is_available))
  const searchResults = search.length >= 1
    ? allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : []
  const currentCategory = categories.find((c) => c.id === selectedCategory)
  const availableProducts = currentCategory?.products.filter((p) => p.is_available) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Urun ara..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {search.length >= 1 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {searchResults.length > 0 ? searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => { addItem(product); setSearch('') }}
                className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all text-left"
              >
                <p className="font-semibold text-stone-900 mb-1">{product.name}</p>
                <p className="text-sm text-amber-700 font-medium">
                  {formatCurrency(product.price)}
                </p>
              </button>
            )) : (
              <p className="col-span-full text-center text-stone-400 py-4">Sonuc bulunamadi</p>
            )}
          </div>
        ) : (
          <>
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-amber-700 text-white shadow-md'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
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
                  className="bg-white p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all text-left"
                >
                  <p className="font-semibold text-stone-900 mb-1">{product.name}</p>
                  <p className="text-sm text-amber-700 font-medium">
                    {formatCurrency(product.price)}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
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
