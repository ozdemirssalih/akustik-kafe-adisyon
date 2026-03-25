import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TableGrid } from '@/components/tables/table-grid'
import { Button } from '@/components/ui/button'
import { BarChart3, UtensilsCrossed, LogOut, Settings } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('table_number')

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <img src="/logo.png" alt="Akustik Kafe" className="h-10 w-auto" />
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

      <main className="p-6 max-w-7xl mx-auto">
        <TableGrid tables={tables || []} />
      </main>
    </div>
  )
}
