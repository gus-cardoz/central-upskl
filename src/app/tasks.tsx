import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSession } from '@/lib/session'
import { getTasksSeed, TASK_STATUS_META, type Task, type TaskStatus } from './data'

/* ----------------------------------------------------------------------------
   Store de tarefas (gestão estilo ClickUp/Asana)
   ----------------------------------------------------------------------------
   Lista única de tarefas do time (não é por cliente). Persiste tudo em
   localStorage e hidrata do seed na primeira carga. Cada mutação registra uma
   entrada no histórico da tarefa, atribuída ao usuário logado (via sessão).
---------------------------------------------------------------------------- */

const KEY = 'upskl-tasks-v1'

function readTasks(): Task[] {
  if (typeof window === 'undefined') return getTasksSeed()
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Task[]) : getTasksSeed()
  } catch {
    return getTasksSeed()
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Entrada de criação de tarefa (sem campos derivados). */
export type TaskInput = Pick<Task, 'title'> &
  Partial<Pick<Task, 'description' | 'status' | 'priority' | 'assignees' | 'due' | 'tag' | 'clientId'>>

/** Campos editáveis de uma tarefa. */
export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'priority' | 'assignees' | 'due' | 'tag' | 'clientId'>
>

interface TasksCtx {
  tasks: Task[]
  addTask: (input: TaskInput) => string
  editTask: (id: string, patch: TaskPatch) => void
  moveTask: (id: string, status: TaskStatus) => void
  removeTask: (id: string) => void
}

const Context = createContext<TasksCtx | null>(null)

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession()
  const [tasks, setTasks] = useState<Task[]>(() => readTasks())

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(tasks))
    } catch {
      // localStorage cheio — ignora a persistência.
    }
  }, [tasks])

  const event = useCallback(
    (text: string) => ({ id: uid('h'), at: new Date().toISOString(), who: user.name, text }),
    [user.name],
  )

  const addTask = useCallback(
    (input: TaskInput) => {
      const id = uid('tk')
      const now = new Date().toISOString()
      const status = input.status ?? 'a-fazer'
      const task: Task = {
        id,
        title: input.title,
        description: input.description,
        status,
        priority: input.priority ?? 'media',
        assignees: input.assignees ?? [],
        due: input.due,
        tag: input.tag,
        clientId: input.clientId,
        createdAt: now,
        completedAt: status === 'concluida' ? now : undefined,
        history: [{ id: uid('h'), at: now, who: user.name, text: 'criou a tarefa' }],
      }
      setTasks((ts) => [task, ...ts])
      return id
    },
    [user.name],
  )

  const editTask = useCallback(
    (id: string, patch: TaskPatch) => {
      setTasks((ts) =>
        ts.map((t) => (t.id === id ? { ...t, ...patch, history: [...t.history, event('editou a tarefa')] } : t)),
      )
    },
    [event],
  )

  const moveTask = useCallback(
    (id: string, status: TaskStatus) => {
      setTasks((ts) =>
        ts.map((t) => {
          if (t.id !== id || t.status === status) return t
          const now = new Date().toISOString()
          const text =
            status === 'concluida'
              ? 'concluiu a tarefa'
              : t.status === 'concluida'
                ? `reabriu em ${TASK_STATUS_META[status].label}`
                : `moveu para ${TASK_STATUS_META[status].label}`
          return {
            ...t,
            status,
            completedAt: status === 'concluida' ? now : undefined,
            history: [...t.history, { id: uid('h'), at: now, who: user.name, text }],
          }
        }),
      )
    },
    [user.name],
  )

  const removeTask = useCallback((id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const value = useMemo<TasksCtx>(
    () => ({ tasks, addTask, editTask, moveTask, removeTask }),
    [tasks, addTask, editTask, moveTask, removeTask],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTasks() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useTasks deve ser usado dentro de <TasksProvider>')
  return ctx
}
