import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TableGrid } from '@/components/tables/table-grid'

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Masa Durumu</h1>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Çıkış
            </button>
          </form>
        </div>
      </header>

      <main className="p-6">
        <TableGrid tables={tables || []} />
      </main>
    </div>
  )
}
