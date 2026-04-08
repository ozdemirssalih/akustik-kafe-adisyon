import { createClient } from '@/lib/supabase/server'
import { MenuManager } from '@/components/menu/menu-manager'

export default async function MenuPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('display_order'),
    supabase.from('products').select('*, category:categories(name)').order('display_order'),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <MenuManager
        categories={categories || []}
        products={products || []}
      />
    </div>
  )
}
