'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Table, Category, Product } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Minus, Plus, X, Search, Banknote, CreditCard, Percent } from 'lucide-react'

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

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash')
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'amount'>('none')
  const [discountValue, setDiscountValue] = useState('')
  const [cashAmount, setCashAmount] = useState<string>('0')
  const [cardAmount, setCardAmount] = useState<string>('0')

  const addItem = (product: Product) => {
    const existing = items.find((item) => item.product.id === product.id)
    if (existing) {
      setItems(items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setItems([...items, { product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    setItems(items.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0))
  }

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.product.id !== productId))
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // Discount
  const discountAmount = discountType === 'percent'
    ? subtotal * Math.min(parseFloat(discountValue) || 0, 100) / 100
    : discountType === 'amount'
    ? Math.min(parseFloat(discountValue) || 0, subtotal)
    : 0
  const total = Math.max(subtotal - discountAmount, 0)

  const updatePaymentAmounts = (method: 'cash' | 'card' | 'split', newTotal: number) => {
    if (method === 'cash') { setCashAmount(newTotal.toFixed(2)); setCardAmount('0') }
    else if (method === 'card') { setCashAmount('0'); setCardAmount(newTotal.toFixed(2)) }
    else { const h = (newTotal / 2).toFixed(2); setCashAmount(h); setCardAmount(h) }
  }

  // Open order without payment
  const handleOpenOrder = async () => {
    if (items.length === 0) return
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert({ table_id: table.id, waiter_id: waiterId, status: 'open', subtotal, tax_amount: 0, total_amount: subtotal }).select().single()
      if (orderError) throw orderError
      const orderItems = items.map((item) => ({ order_id: order.id, product_id: item.product.id, quantity: item.quantity, unit_price: item.product.price, total_price: item.product.price * item.quantity, notes: item.notes }))
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError
      await supabase.from('tables').update({ status: 'occupied' }).eq('id', table.id)
      router.push(`/orders/${order.id}`)
    } catch (error) {
      alert('Siparis olusturulurken hata olustu')
    } finally { setLoading(false) }
  }

  // Create order and pay immediately
  const handlePayNow = async () => {
    if (items.length === 0) return
    if (paymentMethod === 'split') {
      const cash = parseFloat(cashAmount) || 0
      const card = parseFloat(cardAmount) || 0
      if (cash + card < total) { alert('Odeme tutari yetersiz!'); return }
    }
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert({ table_id: table.id, waiter_id: waiterId, status: 'closed', subtotal, tax_amount: 0, total_amount: total, payment_method: paymentMethod, closed_at: new Date().toISOString() }).select().single()
      if (orderError) throw orderError
      const orderItems = items.map((item) => ({ order_id: order.id, product_id: item.product.id, quantity: item.quantity, unit_price: item.product.price, total_price: item.product.price * item.quantity, notes: item.notes }))
      await supabase.from('order_items').insert(orderItems)
      const cash = paymentMethod === 'cash' ? total : (paymentMethod === 'split' ? parseFloat(cashAmount) : 0)
      const card = paymentMethod === 'card' ? total : (paymentMethod === 'split' ? parseFloat(cardAmount) : 0)
      await supabase.from('payments').insert({ order_id: order.id, payment_method: paymentMethod, cash_amount: cash, card_amount: card, total_amount: total, paid_at: new Date().toISOString() })
      router.push('/')
    } catch (error) {
      alert('Odeme islemi basarisiz!')
    } finally { setLoading(false) }
  }

  const allProducts = categories.flatMap(c => c.products.filter(p => p.is_available))
  const searchResults = search.length >= 1 ? allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : []
  const currentCategory = categories.find((c) => c.id === selectedCategory)
  const availableProducts = currentCategory?.products.filter((p) => p.is_available) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Urun ara..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>}
        </div>

        {search.length >= 1 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {searchResults.length > 0 ? searchResults.map((product) => (
              <button key={product.id} onClick={() => { addItem(product); setSearch('') }} className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all text-left">
                <p className="font-semibold text-stone-900 mb-1">{product.name}</p>
                <p className="text-sm text-amber-700 font-medium">{formatCurrency(product.price)}</p>
              </button>
            )) : <p className="col-span-full text-center text-stone-400 py-4">Sonuc bulunamadi</p>}
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${selectedCategory === category.id ? 'bg-amber-700 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'}`}>{category.name}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableProducts.map((product) => (
                <button key={product.id} onClick={() => addItem(product)} className="bg-white p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all text-left">
                  <p className="font-semibold text-stone-900 mb-1">{product.name}</p>
                  <p className="text-sm text-amber-700 font-medium">{formatCurrency(product.price)}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Order Summary + Payment */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="sticky top-20">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Siparis Ozeti</h2>
          </div>

          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Urun secimi yapin</p>
            ) : items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl">
                <button onClick={() => removeItem(item.product.id)} className="text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-stone-500">{formatCurrency(item.product.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-stone-200 rounded"><Minus className="w-4 h-4" /></button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-stone-200 rounded"><Plus className="w-4 h-4" /></button>
                </div>
                <p className="font-semibold text-sm w-20 text-right">{formatCurrency(item.product.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t bg-stone-50">
            <div className="flex justify-between text-lg font-bold">
              <span>Ara Toplam</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </Card>

        {/* Payment */}
        {items.length > 0 && (
          <Card>
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg">Odeme</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Discount */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                  <Percent className="w-4 h-4" /> Indirim
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'percent', 'amount'] as const).map(type => (
                    <button key={type} onClick={() => { setDiscountType(type); if (type === 'none') setDiscountValue(''); updatePaymentAmounts(paymentMethod, type === 'none' ? subtotal : total) }}
                      className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${discountType === type ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-500'}`}>
                      {type === 'none' ? 'Yok' : type === 'percent' ? '% Yuzde' : 'TL Tutar'}
                    </button>
                  ))}
                </div>
                {discountType !== 'none' && (
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.01" min="0" value={discountValue} onChange={(e) => { setDiscountValue(e.target.value); const disc = discountType === 'percent' ? subtotal * Math.min(parseFloat(e.target.value) || 0, 100) / 100 : Math.min(parseFloat(e.target.value) || 0, subtotal); updatePaymentAmounts(paymentMethod, Math.max(subtotal - disc, 0)) }}
                      placeholder={discountType === 'percent' ? '10' : '50.00'} className="flex-1 px-3 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                    <span className="text-sm font-medium text-stone-500 w-20 text-right">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className={`p-3 rounded-xl flex justify-between items-center ${discountAmount > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                <span className={`font-semibold text-sm ${discountAmount > 0 ? 'text-emerald-700' : 'text-amber-800'}`}>{discountAmount > 0 ? 'Indirimli Toplam' : 'Toplam'}</span>
                <span className={`text-xl font-black ${discountAmount > 0 ? 'text-emerald-700' : 'text-amber-800'}`}>{formatCurrency(total)}</span>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Odeme Yontemi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setPaymentMethod('cash'); updatePaymentAmounts('cash', total) }} className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'cash' ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}>
                    <Banknote className="w-5 h-5" /><span className="text-xs font-medium">Nakit</span>
                  </button>
                  <button onClick={() => { setPaymentMethod('card'); updatePaymentAmounts('card', total) }} className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'card' ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}>
                    <CreditCard className="w-5 h-5" /><span className="text-xs font-medium">Kart</span>
                  </button>
                  <button onClick={() => { setPaymentMethod('split'); updatePaymentAmounts('split', total) }} className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'split' ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}>
                    <div className="flex gap-0.5"><Banknote className="w-4 h-4" /><CreditCard className="w-4 h-4" /></div><span className="text-xs font-medium">Bolumlu</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'split' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Nakit</label>
                    <input type="number" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Kart</label>
                    <input type="number" step="0.01" value={cardAmount} onChange={(e) => setCardAmount(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t space-y-2">
              <Button className="w-full" onClick={handlePayNow} disabled={items.length === 0 || loading}>
                {loading ? 'Isleniyor...' : `Ode ${formatCurrency(total)}`}
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => router.back()} disabled={loading}>Iptal</Button>
                <Button variant="secondary" className="flex-1" onClick={handleOpenOrder} disabled={items.length === 0 || loading}>
                  {loading ? 'Kaydediliyor...' : 'Hesabi Ac Birak'}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
