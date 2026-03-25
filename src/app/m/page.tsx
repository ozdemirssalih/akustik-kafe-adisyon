import { createClient } from '@/lib/supabase/server'
import { PublicMenu } from '@/components/menu/public-menu'

export const metadata = {
  title: 'Akustik Kafe - Menu',
  description: 'Akustik Kafe menu - Kahveler, icecekler, yiyecekler ve tatlilar',
}

export default async function PublicMenuPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(name)')
    .eq('is_available', true)
    .order('display_order')

  return (
    <PublicMenu
      categories={categories || []}
      products={products || []}
    />
  )
}
