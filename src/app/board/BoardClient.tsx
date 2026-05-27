'use client'

import { useState, useMemo, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import Shell from '@/components/Shell'
import TaskDetail from '@/components/TaskDetail'
import { createClient } from '@/lib/supabase/client'
import { Task, Project, Profile, TaskStatus, COLUMNS, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

function Avatar({ profile }: { profile?: Profile | null }) {
  if (!profile) return null
  const initials = (profile.full_name || profile.email || '?').slice(0, 2).toUpperCase()
  return (
    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0" title={profile.full_name || profile.email}>
      {initials}
    </div>
  )
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()
  return (
    <div onClick={onClick} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {task.projects && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: task.projects.color + '20', color: task.projects.color }}>
            {task.projects.name}
          </span>
        )}
        {task.due_date && <span className={isOverdue ? 'text-red-500 font-medium' : ''}>{task.due_date}</span>}
        <div className="ml-auto"><Avatar profile={task.profiles} /></div>
      </div>
    </div>
  )
}

export default function BoardClient({
  initialTasks, projects, profiles, user,
}: {
  initialTasks: Task[]; projects: Project[]; profiles: Profile[]; user: User
}) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')

  const filtered = useMemo(() => {
    let t = tasks
    if (search) t = t.filter(x => x.title.toLowerCase().includes(search.toLowerCase()))
    if (projectFilter) t = t.filter(x => x.project_id === projectFilter)
    return t
  }, [tasks, search, projectFilter])

  const columnTasks = useCallback((status: TaskStatus) => filtered.filter(t => t.status === status), [filtered])

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const { source, destination, draggableId } = result
    const newStatus = destination.droppableId as TaskStatus
    const task = tasks.find(t => t.id === draggableId)
    if (!task) return

    // Optimistic update
    const updated = tasks.map(t => t.id === draggableId ? { ...t, status: newStatus, position: destination.index } : t)
    setTasks(updated)
    if (selectedTask?.id === draggableId) setSelectedTask({ ...selectedTask, status: newStatus })

    await supabase.from('tasks').update({ status: newStatus, position: destination.index }).eq('id', draggableId)
  }

  async function handleQuickAdd(status: TaskStatus) {
    if (!newTitle.trim()) return
    const payload = {
      title: newTitle.trim(),
      status,
      priority: 'medium' as const,
      created_by: user.id,
      position: columnTasks(status).length,
    }
    console.log('[TaskInsert] payload:', payload)

    const { data, error } = await supabase.from('tasks').insert(payload).select('*, profiles:assigned_to(id, email, full_name, avatar_url, created_at), projects:project_id(id, name, client_name, color, created_by, created_at)').single()

    console.log('[TaskInsert] data:', data)
    if (error) { console.error('[TaskInsert] error:', error); return }

    if (data) {
      // Re-fetch all tasks to ensure consistency
      const { data: freshTasks } = await supabase
        .from('tasks')
        .select('*, profiles:assigned_to(id, email, full_name, avatar_url, created_at), projects:project_id(id, name, client_name, color, created_by, created_at)')
        .order('position')
      if (freshTasks) setTasks(freshTasks)
      // Auto-open the newly created task for editing
      setSelectedTask(data)
    }
    setNewTitle('')
    setAddingTo(null)
  }

  async function handleTaskUpdate(updated: Task) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }

  async function handleTaskDelete(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelectedTask(null)
  }

  return (
    <Shell userEmail={user.email}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
        />
        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.client_name ? ` (${p.client_name})` : ''}</option>)}
        </select>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
          {COLUMNS.map(status => (
            <div key={status} className="flex-shrink-0 w-72">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                  <span className="text-xs text-slate-400">{columnTasks(status).length}</span>
                </div>
                <button
                  onClick={() => { setAddingTo(status); setNewTitle('') }}
                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm flex items-center justify-center transition"
                >+</button>
              </div>

              {addingTo === status && (
                <div className="mb-2">
                  <input
                    autoFocus
                    placeholder="Task title..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(status); if (e.key === 'Escape') setAddingTo(null) }}
                    className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => handleQuickAdd(status)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add</button>
                    <button onClick={() => setAddingTo(null)} className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700">Cancel</button>
                  </div>
                </div>
              )}

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[100px] rounded-lg p-1 transition ${snapshot.isDraggingOver ? 'bg-indigo-50' : ''}`}
                  >
                    {columnTasks(status).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task Detail Slide-over */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          projects={projects}
          profiles={profiles}
          user={user}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </Shell>
  )
}
