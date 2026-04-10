import { getCachedCategories, getCachedProducts } from '@/lib/supabase/cached'
import { MenuManager } from '@/components/menu/menu-manager'

export default async function MenuPage() {
  const [categories, products] = await Promise.all([
    getCachedCategories(),
    getCachedProducts(),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <MenuManager
        categories={categories}
        products={products}
      />
    </div>
  )
}
