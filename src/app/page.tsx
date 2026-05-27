import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase.from('tasks').select('*, profiles:assigned_to(id, email, full_name, avatar_url, created_at), projects:project_id(id, name, client_name, color, created_by, created_at)').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*'),
  ])

  return <Dashboard tasks={tasks || []} profiles={profiles || []} user={user} />
}
