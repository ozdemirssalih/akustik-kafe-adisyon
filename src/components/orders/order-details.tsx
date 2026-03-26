'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, X, Search, Banknote, CreditCard, Percent } from 'lucide-react'

export function OrderDetails({ order, categories }: any) {
  const router = useRouter()
  const [items, setItems] = useState(order.order_items || [])
  const [showProducts, setShowProducts] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [detailSearch, setDetailSearch] = useState('')

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash')
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'amount'>('none')
  const [discountValue, setDiscountValue] = useState('')
  const [cashAmount, setCashAmount] = useState<string>('0')
  const [cardAmount, setCardAmount] = useState<string>('0')

  const supabase = createClient()

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + parseFloat(item.total_price),
    0
  )

  // Discount calculation
  const discountAmount = discountType === 'percent'
    ? subtotal * (Math.min(parseFloat(discountValue) || 0, 100)) / 100
    : discountType === 'amount'
    ? Math.min(parseFloat(discountValue) || 0, subtotal)
    : 0
  const total = Math.max(subtotal - discountAmount, 0)

  // Search
  const allDetailProducts = categories.flatMap((c: any) => c.products?.filter((p: any) => p.is_available) || [])
  const detailSearchResults = detailSearch.length >= 1
    ? allDetailProducts.filter((p: any) => p.name.toLowerCase().includes(detailSearch.toLowerCase()))
    : []
  const currentCategory = categories.find((c: any) => c.id === selectedCategory)
  const availableProducts = currentCategory?.products.filter((p: any) => p.is_available) || []

  const updatePaymentAmounts = (method: 'cash' | 'card' | 'split', newTotal: number) => {
    if (method === 'cash') { setCashAmount(newTotal.toFixed(2)); setCardAmount('0') }
    else if (method === 'card') { setCashAmount('0'); setCardAmount(newTotal.toFixed(2)) }
    else { const h = (newTotal / 2).toFixed(2); setCashAmount(h); setCardAmount(h) }
  }

  const addProduct = async (product: any) => {
    const existing = items.find((item: any) => item.product_id === product.id)
    if (existing) {
      const newQuantity = existing.quantity + 1
      const newTotal = product.price * newQuantity
      const { error } = await supabase.from('order_items').update({ quantity: newQuantity, total_price: newTotal }).eq('id', existing.id)
      if (!error) setItems(items.map((item: any) => item.id === existing.id ? { ...item, quantity: newQuantity, total_price: newTotal } : item))
    } else {
      const { data, error } = await supabase.from('order_items').insert({ order_id: order.id, product_id: product.id, quantity: 1, unit_price: product.price, total_price: product.price }).select('*, product:products(*)').single()
      if (!error && data) setItems([...items, data])
    }
    await updateOrderTotal()
  }

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = items.find((i: any) => i.id === itemId)
    if (!item) return
    const newQuantity = item.quantity + delta
    if (newQuantity <= 0) { await deleteItem(itemId); return }
    const newTotal = item.unit_price * newQuantity
    const { error } = await supabase.from('order_items').update({ quantity: newQuantity, total_price: newTotal }).eq('id', itemId)
    if (!error) { setItems(items.map((i: any) => i.id === itemId ? { ...i, quantity: newQuantity, total_price: newTotal } : i)); await updateOrderTotal() }
  }

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase.from('order_items').delete().eq('id', itemId)
    if (!error) { setItems(items.filter((i: any) => i.id !== itemId)); await updateOrderTotal() }
  }

  const updateOrderTotal = async () => {
    const newTotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.total_price), 0)
    await supabase.from('orders').update({ subtotal: newTotal, total_amount: newTotal }).eq('id', order.id)
  }

  const handleCancelOrder = async () => {
    if (!confirm('Siparisi iptal etmek istediginizden emin misiniz?')) return
    setLoading(true)
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    if (!error) { await supabase.from('tables').update({ status: 'available' }).eq('id', order.table_id); router.push('/') }
    else { alert('Iptal islemi basarisiz'); setLoading(false) }
  }

  const handlePayment = async () => {
    if (paymentMethod === 'split') {
      const cash = parseFloat(cashAmount) || 0
      const card = parseFloat(cardAmount) || 0
      if (cash + card < total) { alert('Odeme tutari yetersiz!'); return }
    }
    setLoading(true)
    try {
      const cash = paymentMethod === 'cash' ? total : (paymentMethod === 'split' ? parseFloat(cashAmount) : 0)
      const card = paymentMethod === 'card' ? total : (paymentMethod === 'split' ? parseFloat(cardAmount) : 0)
      await supabase.from('payments').insert({ order_id: order.id, payment_method: paymentMethod, cash_amount: cash, card_amount: card, total_amount: total, paid_at: new Date().toISOString() })
      await supabase.from('orders').update({ status: 'closed', payment_method: paymentMethod, total_amount: total, closed_at: new Date().toISOString() }).eq('id', order.id)
      await supabase.from('tables').update({ status: 'available' }).eq('id', order.table_id)
      router.push('/')
    } catch (error) {
      alert('Odeme islemi basarisiz!')
      setLoading(false)
    }
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Masa {order.table.table_number}</h1>
            <p className="text-sm text-stone-500">{formatDateTime(order.opened_at)}</p>
          </div>
          <Badge variant={order.status === 'open' ? 'warning' : 'default'}>
            {order.status === 'open' ? 'Acik' : order.status === 'closed' ? 'Kapali' : 'Iptal'}
          </Badge>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="space-y-4">
          {/* Order Items */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Siparis Kalemleri</h2>
              {order.status === 'open' && (
                <Button size="sm" onClick={() => setShowProducts(!showProducts)}>
                  {showProducts ? 'Gizle' : 'Urun Ekle'}
                </Button>
              )}
            </div>

            {showProducts && order.status === 'open' && (
              <div className="p-4 border-b space-y-3 bg-stone-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} placeholder="Urun ara..." className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  {detailSearch && <button onClick={() => setDetailSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><X className="w-3.5 h-3.5" /></button>}
                </div>
                {detailSearch.length >= 1 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {detailSearchResults.length > 0 ? detailSearchResults.map((product: any) => (
                      <button key={product.id} onClick={() => { addProduct(product); setDetailSearch('') }} className="bg-white p-3 rounded-xl border border-amber-200 hover:border-amber-400 text-left">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-amber-700">{formatCurrency(product.price)}</p>
                      </button>
                    )) : <p className="col-span-full text-center text-stone-400 py-2 text-sm">Sonuc bulunamadi</p>}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 overflow-x-auto">
                      {categories.map((category: any) => (
                        <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${selectedCategory === category.id ? 'bg-amber-700 text-white' : 'bg-white text-stone-600'}`}>{category.name}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableProducts.map((product: any) => (
                        <button key={product.id} onClick={() => addProduct(product)} className="bg-white p-3 rounded-xl border hover:border-amber-400 text-left">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-amber-700">{formatCurrency(product.price)}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="p-4 space-y-2">
              {items.length === 0 ? (
                <p className="text-center text-stone-400 py-8">Henuz urun eklenmemis</p>
              ) : items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                  {order.status === 'open' && <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>}
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-stone-500">{formatCurrency(item.unit_price)}</p>
                  </div>
                  {order.status === 'open' ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-stone-200 rounded"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-stone-200 rounded"><Plus className="w-4 h-4" /></button>
                    </div>
                  ) : <span className="font-medium">x{item.quantity}</span>}
                  <p className="font-semibold w-24 text-right">{formatCurrency(item.total_price)}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t bg-stone-50 rounded-b-2xl">
              <div className="flex justify-between text-xl font-bold">
                <span>Ara Toplam</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </Card>

          {/* Payment Section - directly on page */}
          {order.status === 'open' && items.length > 0 && (
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
                <div className={`p-4 rounded-xl flex justify-between items-center ${discountAmount > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <span className={`font-semibold ${discountAmount > 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {discountAmount > 0 ? 'Indirimli Toplam' : 'Toplam'}
                  </span>
                  <span className={`text-2xl font-black ${discountAmount > 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700">Odeme Yontemi</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => { setPaymentMethod('cash'); updatePaymentAmounts('cash', total) }}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}>
                      <Banknote className="w-6 h-6" /><span className="text-sm font-medium">Nakit</span>
                    </button>
                    <button onClick={() => { setPaymentMethod('card'); updatePaymentAmounts('card', total) }}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}>
                      <CreditCard className="w-6 h-6" /><span className="text-sm font-medium">Kart</span>
                    </button>
                    <button onClick={() => { setPaymentMethod('split'); updatePaymentAmounts('split', total) }}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'split' ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}>
                      <div className="flex gap-1"><Banknote className="w-5 h-5" /><CreditCard className="w-5 h-5" /></div><span className="text-sm font-medium">Bolumlu</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'split' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-stone-700 block mb-1">Nakit</label>
                      <input type="number" step="0.01" value={cashAmount}
                        onChange={(e) => { setCashAmount(e.target.value); setCardAmount((total - (parseFloat(e.target.value) || 0)).toFixed(2)) }}
                        className="w-full px-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-stone-700 block mb-1">Kart</label>
                      <input type="number" step="0.01" value={cardAmount}
                        onChange={(e) => { setCardAmount(e.target.value); setCashAmount((total - (parseFloat(e.target.value) || 0)).toFixed(2)) }}
                        className="w-full px-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                    </div>
                    <div className="bg-stone-50 p-2 rounded-xl flex justify-between text-sm">
                      <span>Toplam Odeme:</span>
                      <span className="font-semibold">{formatCurrency((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0))}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => router.push('/')}>Masalara Don</Button>
                <Button variant="danger" onClick={handleCancelOrder} disabled={loading}>Iptal Et</Button>
                <Button className="flex-1" onClick={handlePayment} disabled={loading || items.length === 0}>
                  {loading ? 'Isleniyor...' : `Ode ${formatCurrency(total)}`}
                </Button>
              </div>
            </Card>
          )}

          {order.status === 'open' && items.length === 0 && (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => router.push('/')}>Masalara Don</Button>
              <Button variant="danger" onClick={handleCancelOrder} disabled={loading}>Iptal Et</Button>
            </div>
          )}

          {order.status !== 'open' && (
            <Button onClick={() => router.push('/')} className="w-full">Masalara Don</Button>
          )}
        </div>
      </main>
    </>
  )
}
