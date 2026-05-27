'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, Project, Profile, Comment, TaskStatus, TaskPriority, COLUMNS, STATUS_LABELS } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

export default function TaskDetail({
  task, projects, profiles, user, onClose, onUpdate, onDelete,
}: {
  task: Task; projects: Project[]; profiles: Profile[]; user: User
  onClose: () => void; onUpdate: (t: Task) => void; onDelete: (id: string) => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to || '',
    project_id: task.project_id || '',
    due_date: task.due_date || '',
  })
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      project_id: task.project_id || '',
      due_date: task.due_date || '',
    })
    setConfirmDelete(false)
    loadComments()
  }, [task.id])

  async function loadComments() {
    const { data } = await supabase.from('comments').select('*, profiles(*)').eq('task_id', task.id).order('created_at')
    if (data) setComments(data)
  }

  async function handleSave() {
    setSaving(true)
    const { data } = await supabase.from('tasks').update({
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      assigned_to: form.assigned_to || null,
      project_id: form.project_id || null,
      due_date: form.due_date || null,
    }).eq('id', task.id).select('*, profiles(*), projects(*)').single()

    if (data) onUpdate(data)
    setSaving(false)
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    const { data } = await supabase.from('comments').insert({
      task_id: task.id,
      user_id: user.id,
      content: newComment.trim(),
    }).select('*, profiles(*)').single()
    if (data) setComments(prev => [...prev, data])
    setNewComment('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Task Details</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
          </div>

          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <textarea
            placeholder="Description..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                {COLUMNS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Assigned To</label>
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                <option value="">Unassigned</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Project</label>
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                <option value="">None</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <div className="ml-auto">
              {confirmDelete ? (
                <div className="flex gap-1">
                  <button onClick={() => onDelete(task.id)} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Confirm</button>
                  <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 text-sm text-slate-500">No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="px-3 py-2 text-sm text-red-500 hover:text-red-700">Delete</button>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Comments</h3>
            <div className="space-y-3 mb-3">
              {comments.map(c => (
                <div key={c.id} className="text-sm">
                  <span className="font-medium text-slate-700">{c.profiles?.full_name || c.profiles?.email || 'User'}</span>
                  <span className="text-xs text-slate-400 ml-2">{new Date(c.created_at).toLocaleDateString()}</span>
                  <p className="text-slate-600 mt-0.5">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-xs text-slate-400">No comments yet</p>}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddComment() }}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={handleAddComment} className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
