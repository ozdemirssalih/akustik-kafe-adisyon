'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { Coffee, UtensilsCrossed } from 'lucide-react'

interface PublicMenuProps {
  categories: any[]
  products: any[]
}

export function PublicMenu({ categories, products }: PublicMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category_id === activeCategory)

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 px-6 pt-10 pb-8 text-center">
        <img src="/logo.png" alt="Akustik Kafe" className="h-72 w-auto mx-auto" />
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
          // Show by category
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
        <img src="/logo.png" alt="Akustik Kafe" className="h-16 w-auto mx-auto opacity-40" />
      </footer>
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
