'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Coffee,
  Package,
} from 'lucide-react'

interface MenuManagerProps {
  categories: any[]
  products: any[]
}

export function MenuManager({ categories: initCategories, products: initProducts }: MenuManagerProps) {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState(initCategories)
  const [products, setProducts] = useState(initProducts)
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Product form
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_available: true,
  })

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    display_order: '',
  })

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory)

  // === PRODUCT OPERATIONS ===
  const openNewProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      is_available: true,
    })
    setShowProductForm(true)
  }

  const openEditProduct = (product: any) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id,
      is_available: product.is_available,
    })
    setShowProductForm(true)
  }

  const saveProduct = async () => {
    const data = {
      name: productForm.name,
      description: productForm.description || null,
      price: parseFloat(productForm.price),
      category_id: productForm.category_id,
      is_available: productForm.is_available,
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', editingProduct.id)
      if (error) { alert('Hata: ' + error.message); return }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(data)
      if (error) { alert('Hata: ' + error.message); return }
    }

    setShowProductForm(false)
    router.refresh()
    // Reload products
    const { data: newProducts } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .order('display_order')
    if (newProducts) setProducts(newProducts)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Bu urunu silmek istediginizden emin misiniz?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { alert('Hata: ' + error.message); return }
    setProducts(products.filter(p => p.id !== id))
  }

  const toggleAvailability = async (product: any) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id)
    if (error) return
    setProducts(products.map(p =>
      p.id === product.id ? { ...p, is_available: !p.is_available } : p
    ))
  }

  // === CATEGORY OPERATIONS ===
  const openNewCategory = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '', display_order: ((categories.length + 1) * 1).toString() })
    setShowCategoryForm(true)
  }

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat)
    setCategoryForm({ name: cat.name, display_order: cat.display_order.toString() })
    setShowCategoryForm(true)
  }

  const saveCategory = async () => {
    const data = {
      name: categoryForm.name,
      display_order: parseInt(categoryForm.display_order) || 0,
      is_active: true,
    }

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', editingCategory.id)
      if (error) { alert('Hata: ' + error.message); return }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert(data)
      if (error) { alert('Hata: ' + error.message); return }
    }

    setShowCategoryForm(false)
    const { data: newCats } = await supabase
      .from('categories')
      .select('*')
      .order('display_order')
    if (newCats) setCategories(newCats)
  }

  const deleteCategory = async (id: string) => {
    const hasProducts = products.some(p => p.category_id === id)
    if (hasProducts) {
      alert('Bu kategoride urunler var, once urunleri silin veya tasiyin!')
      return
    }
    if (!confirm('Bu kategoriyi silmek istediginizden emin misiniz?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { alert('Hata: ' + error.message); return }
    setCategories(categories.filter(c => c.id !== id))
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-stone-900">Menu Yonetimi</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'products'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Package className="w-4 h-4 inline mr-1.5" />
              Urunler
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'categories'
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Coffee className="w-4 h-4 inline mr-1.5" />
              Kategoriler
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {activeTab === 'products' ? (
          <div className="space-y-4">
            {/* Category filter + Add button */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-amber-700 text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  Tumu ({products.length})
                </button>
                {categories.map(cat => {
                  const count = products.filter(p => p.category_id === cat.id).length
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-amber-700 text-white'
                          : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  )
                })}
              </div>
              <Button size="sm" onClick={openNewProduct}>
                <Plus className="w-4 h-4 mr-1" />
                Urun Ekle
              </Button>
            </div>

            {/* Products list */}
            <div className="grid gap-3">
              {filteredProducts.map(product => (
                <Card key={product.id} className={`p-4 ${!product.is_available ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900">{product.name}</h3>
                        <Badge variant={product.is_available ? 'success' : 'danger'}>
                          {product.is_available ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-500 mt-0.5">
                        {product.category?.name} {product.description ? `- ${product.description}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-amber-700">
                        {formatCurrency(product.price)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleAvailability(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.is_available
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-stone-400 hover:bg-stone-100'
                          }`}
                          title={product.is_available ? 'Pasife al' : 'Aktife al'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditProduct(product)}
                          className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-center text-stone-400 py-12">Urun bulunamadi</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={openNewCategory}>
                <Plus className="w-4 h-4 mr-1" />
                Kategori Ekle
              </Button>
            </div>

            <div className="grid gap-3">
              {categories.map(cat => {
                const count = products.filter(p => p.category_id === cat.id).length
                return (
                  <Card key={cat.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-900">{cat.name}</h3>
                        <p className="text-sm text-stone-500">{count} urun - Sira: {cat.display_order}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditCategory(cat)}
                          className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg text-stone-900">
                {editingProduct ? 'Urun Duzenle' : 'Yeni Urun'}
              </h2>
              <button onClick={() => setShowProductForm(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Urun Adi</label>
                <Input
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ornek: Latte"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Aciklama</label>
                <Input
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Ornek: Sicak/Soguk"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Fiyat (TL)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Kategori</label>
                <select
                  value={productForm.category_id}
                  onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.is_available}
                  onChange={e => setProductForm({ ...productForm, is_available: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-stone-700">Satilikta</span>
              </label>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button variant="secondary" onClick={() => setShowProductForm(false)} className="flex-1">
                Iptal
              </Button>
              <Button onClick={saveProduct} className="flex-1" disabled={!productForm.name || !productForm.price}>
                {editingProduct ? 'Guncelle' : 'Ekle'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg text-stone-900">
                {editingCategory ? 'Kategori Duzenle' : 'Yeni Kategori'}
              </h2>
              <button onClick={() => setShowCategoryForm(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Kategori Adi</label>
                <Input
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Ornek: Sicak Icecekler"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Siralama</label>
                <Input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={e => setCategoryForm({ ...categoryForm, display_order: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button variant="secondary" onClick={() => setShowCategoryForm(false)} className="flex-1">
                Iptal
              </Button>
              <Button onClick={saveCategory} className="flex-1" disabled={!categoryForm.name}>
                {editingCategory ? 'Guncelle' : 'Ekle'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
