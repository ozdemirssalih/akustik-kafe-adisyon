'use server'

import { revalidateTag } from 'next/cache'

export async function invalidateMenu() {
  revalidateTag('categories', 'max')
  revalidateTag('products', 'max')
}

export async function invalidateCategories() {
  revalidateTag('categories', 'max')
}

export async function invalidateProducts() {
  revalidateTag('products', 'max')
}
