import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TableManager } from '@/components/tables/table-manager'

export default async function TablesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('table_number')

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <TableManager tables={tables || []} />
    </div>
  )
}
