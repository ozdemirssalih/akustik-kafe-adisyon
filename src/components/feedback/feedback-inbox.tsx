'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, Trash2, CheckCheck, Mail, MailOpen } from 'lucide-react'

interface FeedbackInboxProps {
  feedback: any[]
}

export function FeedbackInbox({ feedback: initFeedback }: FeedbackInboxProps) {
  const supabase = createClient()
  const [feedback, setFeedback] = useState(initFeedback)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const filtered = feedback.filter(f => {
    if (filter === 'unread') return !f.is_read
    if (filter === 'read') return f.is_read
    return true
  })

  const unreadCount = feedback.filter(f => !f.is_read).length

  const toggleRead = async (item: any) => {
    const { error } = await supabase.from('feedback').update({ is_read: !item.is_read }).eq('id', item.id)
    if (error) return
    setFeedback(feedback.map(f => f.id === item.id ? { ...f, is_read: !f.is_read } : f))
  }

  const deleteFeedback = async (id: string) => {
    if (!confirm('Bu mesaji silmek istiyor musunuz?')) return
    const { error } = await supabase.from('feedback').delete().eq('id', id)
    if (error) return
    setFeedback(feedback.filter(f => f.id !== id))
  }

  const markAllRead = async () => {
    await supabase.from('feedback').update({ is_read: true }).eq('is_read', false)
    setFeedback(feedback.map(f => ({ ...f, is_read: true })))
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Logo height={168} />
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-amber-700 font-semibold hover:underline">
                Tumunu okundu isaretle
              </button>
            )}
            <div className="flex gap-1">
              {(['all', 'unread', 'read'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${filter === f ? 'bg-amber-700 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {f === 'all' ? `Tumu (${feedback.length})` : f === 'unread' ? `Okunmamis (${unreadCount})` : 'Okunmus'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-stone-400 py-16">Henuz mesaj yok</p>
        ) : filtered.map(item => (
          <Card key={item.id} className={`p-4 ${!item.is_read ? 'border-amber-300 bg-amber-50/30' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`mt-1 ${!item.is_read ? 'text-amber-600' : 'text-stone-400'}`}>
                  {!item.is_read ? <Mail className="w-5 h-5" /> : <MailOpen className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-stone-900">{item.nickname}</span>
                    {!item.is_read && <Badge variant="warning">Yeni</Badge>}
                    <span className="text-xs text-stone-400">{formatDateTime(item.created_at)}</span>
                  </div>
                  <p className="text-stone-700 text-sm whitespace-pre-wrap">{item.message}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggleRead(item)} className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors" title={item.is_read ? 'Okunmamis isaretle' : 'Okundu isaretle'}>
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button onClick={() => deleteFeedback(item.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </main>
    </>
  )
}
