import { createClient } from '@/lib/supabase/server'
import { PublicMenu } from '@/components/menu/public-menu'

export const metadata = {
  title: 'Akustik Kafe - Menu',
  description: 'Akustik Kafe menu - Kahveler, icecekler, yiyecekler ve tatlilar',
}

export const revalidate = 60 // cache 1 dakika

export default async function PublicMenuPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
    supabase.from('products').select('*, category:categories(name)').eq('is_available', true).order('display_order'),
  ])

  return (
    <PublicMenu
      categories={categories || []}
      products={products || []}
    />
  )
}
