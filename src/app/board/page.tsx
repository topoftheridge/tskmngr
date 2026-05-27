import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoardClient from './BoardClient'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tasks }, { data: projects }, { data: profiles }] = await Promise.all([
    supabase.from('tasks').select('*, profiles:assigned_to(id, email, full_name, avatar_url, created_at), projects:project_id(id, name, client_name, color, created_by, created_at)').order('position'),
    supabase.from('projects').select('*').order('name'),
    supabase.from('profiles').select('*'),
  ])

  return <BoardClient initialTasks={tasks || []} projects={projects || []} profiles={profiles || []} user={user} />
}
