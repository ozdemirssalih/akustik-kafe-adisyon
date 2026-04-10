import { PublicMenu } from '@/components/menu/public-menu'
import { getCachedPublicMenu } from '@/lib/supabase/cached'

export const metadata = {
  title: 'Akustik Kafe - Menu',
  description: 'Akustik Kafe menu - Kahveler, icecekler, yiyecekler ve tatlilar',
}

export const revalidate = 60

export default async function PublicMenuPage() {
  const { categories, products } = await getCachedPublicMenu()

  return (
    <PublicMenu
      categories={categories}
      products={products}
    />
  )
}
