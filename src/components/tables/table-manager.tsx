'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Table } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Pencil, Trash2, X, Users } from 'lucide-react'

interface TableManagerProps {
  tables: Table[]
}

export function TableManager({ tables: initTables }: TableManagerProps) {
  const router = useRouter()
  const supabase = createClient()

  const [tables, setTables] = useState(initTables)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Table | null>(null)
  const [form, setForm] = useState({
    table_number: '',
    capacity: '4',
    status: 'available' as 'available' | 'occupied' | 'reserved',
  })

  const openNew = () => {
    setEditing(null)
    setForm({ table_number: '', capacity: '4', status: 'available' })
    setShowForm(true)
  }

  const openEdit = (table: Table) => {
    setEditing(table)
    setForm({
      table_number: table.table_number,
      capacity: table.capacity.toString(),
      status: table.status,
    })
    setShowForm(true)
  }

  const save = async () => {
    const data = {
      table_number: form.table_number,
      capacity: parseInt(form.capacity) || 4,
      status: form.status,
    }

    if (editing) {
      const { error } = await supabase
        .from('tables')
        .update(data)
        .eq('id', editing.id)
      if (error) { alert('Hata: ' + error.message); return }
    } else {
      const { error } = await supabase
        .from('tables')
        .insert(data)
      if (error) { alert('Hata: ' + error.message); return }
    }

    setShowForm(false)
    const { data: newTables } = await supabase
      .from('tables')
      .select('*')
      .order('table_number')
    if (newTables) setTables(newTables)
  }

  const deleteTable = async (table: Table) => {
    if (table.status === 'occupied') {
      alert('Dolu masa silinemez! Once siparisi kapatin.')
      return
    }
    if (!confirm(`Masa ${table.table_number} silinecek. Emin misiniz?`)) return

    const { error } = await supabase.from('tables').delete().eq('id', table.id)
    if (error) { alert('Hata: ' + error.message); return }
    setTables(tables.filter(t => t.id !== table.id))
  }

  const updateStatus = async (table: Table, status: 'available' | 'occupied' | 'reserved') => {
    const { error } = await supabase
      .from('tables')
      .update({ status })
      .eq('id', table.id)
    if (error) return
    setTables(tables.map(t => t.id === table.id ? { ...t, status } : t))
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
            <img src="/logo.png" alt="Akustik Kafe" className="h-[168px] w-auto object-contain" />
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" />
            Masa Ekle
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        <div className="grid gap-3">
          {tables.map(table => (
            <Card key={table.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`
                    flex items-center justify-center w-14 h-14 rounded-xl font-black text-xl
                    ${table.status === 'available'
                      ? 'bg-emerald-100 text-emerald-700'
                      : table.status === 'occupied'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                    }
                  `}>
                    {table.table_number}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">Masa {table.table_number}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-sm text-stone-500">
                        <Users className="w-3.5 h-3.5" />
                        {table.capacity} kisilik
                      </span>
                      <Badge
                        variant={
                          table.status === 'available' ? 'success'
                            : table.status === 'occupied' ? 'danger'
                            : 'warning'
                        }
                      >
                        {table.status === 'available' ? 'Bos'
                          : table.status === 'occupied' ? 'Dolu'
                          : 'Rezerve'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick status buttons */}
                  {table.status !== 'occupied' && (
                    <div className="flex gap-1 mr-2">
                      {table.status !== 'available' && (
                        <button
                          onClick={() => updateStatus(table, 'available')}
                          className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Bos
                        </button>
                      )}
                      {table.status !== 'reserved' && (
                        <button
                          onClick={() => updateStatus(table, 'reserved')}
                          className="px-2 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          Rezerve
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => openEdit(table)}
                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTable(table)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {tables.length === 0 && (
            <p className="text-center text-stone-400 py-12">Henuz masa eklenmemis</p>
          )}
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg text-stone-900">
                {editing ? 'Masa Duzenle' : 'Yeni Masa'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Masa Numarasi / Adi</label>
                <Input
                  value={form.table_number}
                  onChange={e => setForm({ ...form, table_number: e.target.value })}
                  placeholder="Ornek: 11 veya Bahce-1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Kapasite (kisi)</label>
                <Input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Durum</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                >
                  <option value="available">Bos</option>
                  <option value="reserved">Rezerve</option>
                  <option value="occupied">Dolu</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
                Iptal
              </Button>
              <Button onClick={save} className="flex-1" disabled={!form.table_number}>
                {editing ? 'Guncelle' : 'Ekle'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
