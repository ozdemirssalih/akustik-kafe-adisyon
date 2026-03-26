'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateTime } from '@/lib/utils/date'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Banknote, CreditCard, ShoppingCart, TrendingUp, ArrowLeft } from 'lucide-react'

interface ReportsDashboardProps {
  todayOrders: any[]
  allOrders: any[]
}

export function ReportsDashboard({ todayOrders, allOrders }: ReportsDashboardProps) {
  const [view, setView] = useState<'today' | 'all'>('today')

  const displayOrders = view === 'today' ? todayOrders : allOrders

  // Calculate metrics
  const totalRevenue = displayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
  const orderCount = displayOrders.length

  const cashOrders = displayOrders.filter((o) => o.payment_method === 'cash')
  const cardOrders = displayOrders.filter((o) => o.payment_method === 'card')
  const splitOrders = displayOrders.filter((o) => o.payment_method === 'split')

  // Nakit: tamamen nakit siparişler + bölümlü ödemelerin nakit kısmı
  const cashTotal = cashOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
    + splitOrders.reduce((sum, o) => {
      const payment = o.payments?.[0]
      return sum + (payment ? parseFloat(payment.cash_amount || 0) : 0)
    }, 0)

  // Kart: tamamen kart siparişler + bölümlü ödemelerin kart kısmı
  const cardTotal = cardOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
    + splitOrders.reduce((sum, o) => {
      const payment = o.payments?.[0]
      return sum + (payment ? parseFloat(payment.card_amount || 0) : 0)
    }, 0)

  const splitTotal = splitOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0)

  // Product statistics
  const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {}

  displayOrders.forEach((order) => {
    order.order_items?.forEach((item: any) => {
      const productId = item.product_id
      if (!productStats[productId]) {
        productStats[productId] = {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        }
      }
      productStats[productId].quantity += item.quantity
      productStats[productId].revenue += parseFloat(item.total_price)
    })
  })

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <img src="/logo.png" alt="Akustik Kafe" className="h-[168px] w-auto object-contain" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'today'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setView('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'all'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Tüm Zamanlar
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Ciro</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sipariş Sayısı</p>
                    <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Banknote className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nakit</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(cashTotal)}
                    </p>
                    <p className="text-xs text-gray-500">{cashOrders.length} sipariş</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kart</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(cardTotal)}
                    </p>
                    <p className="text-xs text-gray-500">{cardOrders.length} sipariş</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>En Çok Satan Ürünler</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Henüz veri yok</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-full font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              {product.quantity} adet satıldı
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-amber-700">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Son Siparişler</CardTitle>
              </CardHeader>
              <CardContent>
                {displayOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Henüz sipariş yok</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {displayOrders.slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        <div>
                          <p className="font-medium">Masa {order.table.table_number}</p>
                          <p className="text-xs text-gray-600">
                            {formatDateTime(order.closed_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-amber-700">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <Badge
                            variant={
                              order.payment_method === 'cash'
                                ? 'warning'
                                : order.payment_method === 'card'
                                ? 'success'
                                : 'default'
                            }
                          >
                            {order.payment_method === 'cash'
                              ? 'Nakit'
                              : order.payment_method === 'card'
                              ? 'Kart'
                              : 'Bölümlü'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Breakdown */}
          {splitOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bölümlü Ödemeler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                  <span className="font-medium">Bölümlü Ödeme Toplamı</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(splitTotal)}
                    </p>
                    <p className="text-sm text-gray-600">{splitOrders.length} sipariş</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
