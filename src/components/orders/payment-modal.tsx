'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Banknote, CreditCard } from 'lucide-react'

interface PaymentModalProps {
  order: any
  onClose: () => void
}

export function PaymentModal({ order, onClose }: PaymentModalProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash')
  const [cashAmount, setCashAmount] = useState<string>(order.total_amount.toString())
  const [cardAmount, setCardAmount] = useState<string>('0')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const total = order.total_amount

  const handlePayment = async () => {
    if (paymentMethod === 'split') {
      const cash = parseFloat(cashAmount) || 0
      const card = parseFloat(cardAmount) || 0
      if (cash + card < total) {
        alert('Ödeme tutarı yetersiz!')
        return
      }
    }

    setLoading(true)

    try {
      // Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'closed',
          payment_method: paymentMethod,
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
      alert('Ödeme işlemi başarısız!')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg">Ödeme</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600 mb-1">Masa {order.table.table_number}</p>
            <div className="flex justify-between items-center">
              <span className="font-medium">Toplam Tutar</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Ödeme Yöntemi
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setPaymentMethod('cash')
                  setCashAmount(total.toString())
                  setCardAmount('0')
                }}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-sm font-medium">Nakit</span>
              </button>

              <button
                onClick={() => {
                  setPaymentMethod('card')
                  setCashAmount('0')
                  setCardAmount(total.toString())
                }}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-medium">Kart</span>
              </button>

              <button
                onClick={() => {
                  setPaymentMethod('split')
                  const half = (total / 2).toFixed(2)
                  setCashAmount(half)
                  setCardAmount(half)
                }}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === 'split'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1">
                  <Banknote className="w-5 h-5" />
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Bölümlü</span>
              </button>
            </div>
          </div>

          {/* Split Payment Details */}
          {paymentMethod === 'split' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nakit Tutar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Kart Tutar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-gray-50 p-2 rounded flex justify-between text-sm">
                <span>Toplam Ödeme:</span>
                <span className="font-medium">
                  {formatCurrency((parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0))}
                </span>
              </div>
            </div>
          )}

          {/* Order Items List */}
          <div className="border-t pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Sipariş Detayı</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
