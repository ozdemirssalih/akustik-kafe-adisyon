'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { Coffee, UtensilsCrossed, MessageSquarePlus, X, Send } from 'lucide-react'

interface PublicMenuProps {
  categories: any[]
  products: any[]
}

export function PublicMenu({ categories, products }: PublicMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showFeedback, setShowFeedback] = useState(false)
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category_id === activeCategory)

  const handleSendFeedback = async () => {
    if (!nickname.trim() || !message.trim()) return
    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.from('feedback').insert({
      nickname: nickname.trim(),
      message: message.trim(),
    })
    setSending(false)
    if (error) { alert('Gonderilemedi, tekrar deneyin.'); return }
    setSent(true)
    setNickname('')
    setMessage('')
    setTimeout(() => { setSent(false); setShowFeedback(false) }, 2000)
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 px-6 pt-10 pb-8 text-center relative">
        <img src="/logo.png" alt="Akustik Kafe" className="h-[216px] w-auto object-contain mx-auto" />
        {/* Feedback button */}
        <button
          onClick={() => setShowFeedback(true)}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-white/10 backdrop-blur rounded-xl text-amber-200 text-xs font-semibold hover:bg-white/20 transition-all"
        >
          <MessageSquarePlus className="w-4 h-4" />
          Dilek / Sikayet
        </button>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
        <div className="flex gap-1 overflow-x-auto px-4 py-3 max-w-3xl mx-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            Tumu
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <main className="px-4 py-6 max-w-3xl mx-auto">
        {activeCategory === 'all' ? (
          <div className="space-y-8">
            {categories.map(cat => {
              const catProducts = products.filter(p => p.category_id === cat.id)
              if (catProducts.length === 0) return null
              return (
                <div key={cat.id}>
                  <h2 className="text-lg font-bold text-amber-500 mb-4 flex items-center gap-2">
                    <span className="w-8 h-[2px] bg-amber-600 rounded-full" />
                    {cat.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catProducts.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <UtensilsCrossed className="w-12 h-12 text-stone-700 mx-auto mb-3" />
            <p className="text-stone-500">Bu kategoride urun bulunamadi</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-stone-800">
        <img src="/logo.png" alt="Akustik Kafe" className="h-[48px] w-auto object-contain mx-auto opacity-40" />
      </footer>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-stone-900 rounded-2xl w-full max-w-md border border-stone-700 overflow-hidden">
            <div className="p-4 border-b border-stone-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-white">Dilek / Sikayet</h2>
              </div>
              <button onClick={() => setShowFeedback(false)} className="text-stone-500 hover:text-stone-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {sent ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-semibold">Tesekkurler!</p>
                <p className="text-stone-400 text-sm mt-1">Mesajiniz iletildi.</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5">Isminiz / Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ornek: Ahmet"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5">Mesajiniz</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Dilek, sikayet veya onerinizi yazin..."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  />
                </div>
                <button
                  onClick={handleSendFeedback}
                  disabled={!nickname.trim() || !message.trim() || sending}
                  className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Gonderiliyor...' : 'Gonder'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: any }) {
  return (
    <div className="bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 hover:border-stone-700 transition-all group">
      {product.image_url ? (
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-gradient-to-br from-stone-800 to-stone-850 flex items-center justify-center">
          <Coffee className="w-12 h-12 text-stone-700" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-white text-base">{product.name}</h3>
            {product.description && (
              <p className="text-stone-500 text-sm mt-0.5">{product.description}</p>
            )}
          </div>
          <span className="text-amber-500 font-bold text-lg whitespace-nowrap">
            {formatCurrency(product.price)}
          </span>
        </div>
      </div>
    </div>
  )
}
