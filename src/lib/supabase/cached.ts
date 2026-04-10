import { unstable_cache } from 'next/cache'
import { anonSupabase } from './anon'

/**
 * Cached data fetchers for rarely-changing data.
 * Uses anonymous client (no cookies) — safe for caching.
 * Invalidate via revalidateTag() when data actually changes.
 */

export const getCachedCategories = unstable_cache(
  async () => {
    const { data } = await anonSupabase
      .from('categories')
      .select('*')
      .order('display_order')
    return data || []
  },
  ['categories-all'],
  { revalidate: 300, tags: ['categories'] }
)

export const getCachedActiveCategories = unstable_cache(
  async () => {
    const { data } = await anonSupabase
      .from('categories')
      .select('*, products(*)')
      .eq('is_active', true)
      .order('display_order')
    return data || []
  },
  ['categories-active-with-products'],
  { revalidate: 300, tags: ['categories', 'products'] }
)

export const getCachedProducts = unstable_cache(
  async () => {
    const { data } = await anonSupabase
      .from('products')
      .select('*, category:categories(name)')
      .order('display_order')
    return data || []
  },
  ['products-all'],
  { revalidate: 300, tags: ['products'] }
)

export const getCachedPublicMenu = unstable_cache(
  async () => {
    const [categoriesResult, productsResult] = await Promise.all([
      anonSupabase.from('categories').select('*').eq('is_active', true).order('display_order'),
      anonSupabase.from('products').select('*, category:categories(name)').eq('is_available', true).order('display_order'),
    ])
    return {
      categories: categoriesResult.data || [],
      products: productsResult.data || [],
    }
  },
  ['public-menu'],
  { revalidate: 300, tags: ['categories', 'products'] }
)
