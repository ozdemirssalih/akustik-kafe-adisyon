'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Banknote, CreditCard, Percent } from 'lucide-react'

interface PaymentModalProps {
  order: any
  onClose: () => void
}

export function PaymentModal({ order, onClose }: PaymentModalProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash')
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'amount'>('none')
  const [discountValue, setDiscountValue] = useState('')
  const [cashAmount, setCashAmount] = useState<string>(order.total_amount.toString())
  const [cardAmount, setCardAmount] = useState<string>('0')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const subtotal = order.total_amount

  // Calculate discount
  const discountAmount = discountType === 'percent'
    ? subtotal * (Math.min(parseFloat(discountValue) || 0, 100)) / 100
    : discountType === 'amount'
    ? Math.min(parseFloat(discountValue) || 0, subtotal)
    : 0

  const total = Math.max(subtotal - discountAmount, 0)

  // Update cash/card when total changes
  const updatePaymentAmounts = (method: 'cash' | 'card' | 'split', newTotal: number) => {
    if (method === 'cash') {
      setCashAmount(newTotal.toFixed(2))
      setCardAmount('0')
    } else if (method === 'card') {
      setCashAmount('0')
      setCardAmount(newTotal.toFixed(2))
    } else {
      const half = (newTotal / 2).toFixed(2)
      setCashAmount(half)
      setCardAmount(half)
    }
  }

  const handleDiscountChange = (type: 'none' | 'percent' | 'amount', value: string) => {
    setDiscountType(type)
    setDiscountValue(value)
    const disc = type === 'percent'
      ? subtotal * Math.min(parseFloat(value) || 0, 100) / 100
      : type === 'amount'
      ? Math.min(parseFloat(value) || 0, subtotal)
      : 0
    const newTotal = Math.max(subtotal - disc, 0)
    updatePaymentAmounts(paymentMethod, newTotal)
  }

  const handlePayment = async () => {
    if (paymentMethod === 'split') {
      const cash = parseFloat(cashAmount) || 0
      const card = parseFloat(cardAmount) || 0
      if (cash + card < total) {
        alert('Odeme tutari yetersiz!')
        return
      }
    }

    setLoading(true)

    try {
      const cash = paymentMethod === 'cash' ? total : (paymentMethod === 'split' ? parseFloat(cashAmount) : 0)
      const card = paymentMethod === 'card' ? total : (paymentMethod === 'split' ? parseFloat(cardAmount) : 0)

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          payment_method: paymentMethod,
          cash_amount: cash,
          card_amount: card,
          total_amount: total,
          paid_at: new Date().toISOString(),
        })

      if (paymentError) throw paymentError

      // Update order with final amount
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'closed',
          payment_method: paymentMethod,
          total_amount: total,
          closed_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (orderError) throw orderError

      // Update table status
      const { error: tableError } = await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', order.table_id)

      if (tableError) throw tableError

      router.push('/')
    } catch (error) {
      console.error('Payment error:', error)
      alert('Odeme islemi basarisiz!')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-lg text-stone-900">Odeme</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Order Summary */}
          <div className="bg-stone-50 p-3 rounded-xl">
            <p className="text-sm text-stone-500 mb-1">Masa {order.table.table_number}</p>
            <div className="flex justify-between items-center">
              <span className="font-medium text-stone-700">Ara Toplam</span>
              <span className="text-xl font-bold text-stone-800">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>

          {/* Discount Section */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
              <Percent className="w-4 h-4" />
              Indirim
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDiscountChange('none', '')}
                className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  discountType === 'none'
                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                Yok
              </button>
              <button
                onClick={() => handleDiscountChange('percent', discountValue)}
                className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  discountType === 'percent'
                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                % Yuzde
              </button>
              <button
                onClick={() => handleDiscountChange('amount', discountValue)}
                className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  discountType === 'amount'
                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                TL Tutar
              </button>
            </div>
            {discountType !== 'none' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={discountType === 'percent' ? '100' : subtotal.toString()}
                  value={discountValue}
                  onChange={(e) => handleDiscountChange(discountType, e.target.value)}
                  placeholder={discountType === 'percent' ? '10' : '50.00'}
                  className="flex-1 px-3 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <span className="text-sm font-medium text-stone-500 w-16 text-right">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center">
                <span className="font-semibold text-emerald-700">Indirimli Toplam</span>
                <span className="text-2xl font-black text-emerald-700">
                  {formatCurrency(total)}
                </span>
              </div>
            )}
          </div>

          {/* Final total if no discount */}
          {discountAmount === 0 && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center">
              <span className="font-semibold text-amber-800">Toplam</span>
              <span className="text-2xl font-black text-amber-800">
                {formatCurrency(total)}
              </span>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              Odeme Yontemi
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setPaymentMethod('cash')
                  updatePaymentAmounts('cash', total)
                }}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-sm font-medium">Nakit</span>
              </button>

              <button
                onClick={() => {
                  setPaymentMethod('card')
                  updatePaymentAmounts('card', total)
                }}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-medium">Kart</span>
              </button>

              <button
                onClick={() => {
                  setPaymentMethod('split')
                  updatePaymentAmounts('split', total)
                }}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'split'
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex gap-1">
                  <Banknote className="w-5 h-5" />
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Bolumlu</span>
              </button>
            </div>
          </div>

          {/* Split Payment Details */}
          {paymentMethod === 'split' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-sm font-semibold text-stone-700 block mb-1">
                  Nakit Tutar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-stone-700 block mb-1">
                  Kart Tutar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="bg-stone-50 p-2 rounded-xl flex justify-between text-sm">
                <span>Toplam Odeme:</span>
                <span className="font-medium">
                  {formatCurrency((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0))}
                </span>
              </div>
            </div>
          )}

          {/* Order Items List */}
          <div className="border-t pt-3">
            <p className="text-sm font-semibold text-stone-700 mb-2">Siparis Detayi</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-stone-500">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-medium text-stone-700">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Iptal
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Isleniyor...' : `Ode ${formatCurrency(total)}`}
          </Button>
        </div>
      </Card>
    </div>
  )
}
