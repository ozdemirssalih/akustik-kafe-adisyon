import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TableGrid } from '@/components/tables/table-grid'
import { StickyNotes } from '@/components/tables/sticky-notes'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { BarChart3, UtensilsCrossed, LogOut, Settings, ClipboardList, Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: tables }, { data: stickyNotes }] = await Promise.all([
    supabase.from('tables').select('*').order('table_number'),
    supabase.from('sticky_notes').select('*, table:tables(table_number)').order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Logo height={64} />
          <div className="flex items-center gap-2">
            <Link href="/menu">
              <Button variant="ghost" size="sm">
                <UtensilsCrossed className="w-4 h-4 mr-1.5" />
                Menu
              </Button>
            </Link>
            <Link href="/tables">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-1.5" />
                Masalar
              </Button>
            </Link>
            <Link href="/inbox">
              <Button variant="ghost" size="sm">
                <Inbox className="w-4 h-4 mr-1.5" />
                Gelen Kutusu
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" size="sm">
                <ClipboardList className="w-4 h-4 mr-1.5" />
                Gecmis
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="ghost" size="sm">
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Raporlar
              </Button>
            </Link>
            <form action="/api/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="w-4 h-4 mr-1.5" />
                Cikis
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        <TableGrid tables={tables || []} />
        <StickyNotes notes={stickyNotes || []} tables={tables || []} />
      </main>
    </div>
  )
}
