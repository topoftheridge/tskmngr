'use client'

import Shell from '@/components/Shell'
import { Task, Profile, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, COLUMNS } from '@/lib/types'
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

export default function Dashboard({ tasks, profiles, user }: { tasks: Task[]; profiles: Profile[]; user: User }) {
  const statusCounts = COLUMNS.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length
    return acc
  }, {} as Record<string, number>)

  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueSoon = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) <= weekFromNow).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
  const myTasks = tasks.filter(t => t.assigned_to === user.id && t.status !== 'done')

  return (
    <Shell userEmail={user.email}>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-xl font-bold">Dashboard</h1>

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
                {dueSoon.slice(0, 8).map(t => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <Link href={`/board?task=${t.id}`} className="text-slate-700 hover:text-indigo-600 truncate mr-2">{t.title}</Link>
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
                {myTasks.slice(0, 8).map(t => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                    <Link href={`/board?task=${t.id}`} className="text-slate-700 hover:text-indigo-600 truncate">{t.title}</Link>
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-xs ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
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
