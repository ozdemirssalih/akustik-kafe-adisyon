'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, X, StickyNote } from 'lucide-react'

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
  { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  { name: 'green', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900' },
  { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
  { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
  { name: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
]

function getColor(name: string) {
  return COLORS.find(c => c.name === name) || COLORS[0]
}

interface StickyNotesProps {
  notes: any[]
  tables: any[]
}

export function StickyNotes({ notes: initNotes, tables }: StickyNotesProps) {
  const router = useRouter()
  const supabase = createClient()

  const [notes, setNotes] = useState(initNotes)
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [selectedColor, setSelectedColor] = useState('yellow')

  const addNote = async () => {
    if (!content.trim()) return

    const { data, error } = await supabase
      .from('sticky_notes')
      .insert({
        table_id: selectedTable || null,
        content: content.trim(),
        color: selectedColor,
      })
      .select('*, table:tables(table_number)')
      .single()

    if (error) { alert('Hata: ' + error.message); return }
    setNotes([data, ...notes])
    setContent('')
    setShowForm(false)
  }

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('sticky_notes').delete().eq('id', id)
    if (error) return
    setNotes(notes.filter(n => n.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-700" />
          <h2 className="text-lg font-bold text-stone-900">Notlar</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" />
          Not Ekle
        </Button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <Card className="p-4 mb-4 space-y-3">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Not yaz..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
            >
              <option value="">Genel not</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>Masa {t.table_number}</option>
              ))}
            </select>
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.name)}
                  className={`w-7 h-7 rounded-full ${c.bg} border-2 transition-all ${
                    selectedColor === c.name ? `${c.border} scale-110 ring-2 ring-offset-1 ring-stone-400` : 'border-transparent'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Iptal</Button>
              <Button size="sm" onClick={addNote} disabled={!content.trim()}>Ekle</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Notes Grid */}
      {notes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {notes.map(note => {
            const color = getColor(note.color)
            return (
              <div
                key={note.id}
                className={`${color.bg} ${color.border} border rounded-2xl p-4 relative group shadow-sm hover:shadow-md transition-all`}
                style={{ minHeight: '120px' }}
              >
                <button
                  onClick={() => deleteNote(note.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {note.table && (
                  <p className={`text-xs font-bold ${color.text} opacity-60 mb-1`}>
                    Masa {note.table.table_number}
                  </p>
                )}
                <p className={`text-sm font-medium ${color.text} whitespace-pre-wrap`}>
                  {note.content}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-center text-stone-400 py-6">Henuz not eklenmemis</p>
      )}
    </div>
  )
}
