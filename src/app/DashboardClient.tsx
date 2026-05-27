'use client'

import { useState, useEffect, useMemo } from 'react'
import Shell from '@/components/Shell'
import { createClient } from '@/lib/supabase/client'
import { Task, Profile, Project, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, COLUMNS } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function Dashboard({ tasks: initialTasks, projects: initialProjects, profiles, user }: { tasks: Task[]; projects: Project[]; profiles: Profile[]; user: User }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [projects, setProjects] = useState(initialProjects)
  const [projectFilter, setProjectFilter] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('tasks').select('*, profiles:assigned_to(id, email, full_name, avatar_url, created_at), projects:project_id(id, name, client_name, color, created_by, created_at)').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('name'),
    ]).then(([tasksRes, projectsRes]) => {
      if (tasksRes.data) setTasks(tasksRes.data)
      if (projectsRes.data) setProjects(projectsRes.data)
    })
  }, [])

  const filteredTasks = useMemo(() => {
    if (!projectFilter) return tasks
    return tasks.filter(t => t.project_id === projectFilter)
  }, [tasks, projectFilter])

  const statusCounts = COLUMNS.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s).length
    return acc
  }, {} as Record<string, number>)

  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueSoon = filteredTasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) <= weekFromNow).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
  const myTasks = filteredTasks.filter(t => t.assigned_to === user.id && t.status !== 'done')

  return (
    <Shell userEmail={user.email}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.client_name ? ` (${p.client_name})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Status stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {COLUMNS.map(s => (
            <StatCard key={s} label={STATUS_LABELS[s]} value={statusCounts[s]} color="text-slate-900" />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Due soon */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="font-semibold text-sm mb-3">Due This Week</h2>
            {dueSoon.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing due soon 🎉</p>
            ) : (
              <ul className="space-y-2">
                {dueSoon.slice(0, 10).map(t => (
                  <li key={t.id} className="flex items-center justify-between text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {t.projects && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: t.projects.color + '20', color: t.projects.color }}>
                          {t.projects.name}
                        </span>
                      )}
                      <Link href={`/board?task=${t.id}`} className="text-slate-700 hover:text-indigo-600 truncate">{t.title}</Link>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{t.due_date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* My tasks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="font-semibold text-sm mb-3">My Tasks</h2>
            {myTasks.length === 0 ? (
              <p className="text-sm text-slate-400">No tasks assigned to you</p>
            ) : (
              <ul className="space-y-2">
                {myTasks.slice(0, 10).map(t => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                    {t.projects && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: t.projects.color + '20', color: t.projects.color }}>
                        {t.projects.name}
                      </span>
                    )}
                    <Link href={`/board?task=${t.id}`} className="text-slate-700 hover:text-indigo-600 truncate">{t.title}</Link>
                    <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded text-xs ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
