import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FeedbackInbox } from '@/components/feedback/feedback-inbox'

export default async function InboxPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: feedback } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
      <FeedbackInbox feedback={feedback || []} />
    </div>
  )
}
