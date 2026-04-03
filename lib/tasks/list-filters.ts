import { addDays, startOfDay } from 'date-fns'
import type { Prisma } from '@/lib/generated/prisma'
import { TaskStatus } from '@/lib/generated/prisma'

export type TaskListDueFilter = 'all' | 'overdue' | 'upcoming'

export function taskDueWhere(due: TaskListDueFilter): Prisma.TaskWhereInput | undefined {
  if (due === 'all') return undefined
  const sod = startOfDay(new Date())
  if (due === 'overdue') {
    return {
      dueDate: { lt: sod },
      NOT: { status: TaskStatus.DONE },
    }
  }
  const end = addDays(sod, 14)
  return {
    dueDate: { gte: sod, lte: end },
  }
}

export function taskKeywordOr(q: string): Prisma.TaskWhereInput['OR'] | undefined {
  const t = q.trim()
  if (!t) return undefined
  return [
    { title: { contains: t, mode: 'insensitive' } },
    { description: { contains: t, mode: 'insensitive' } },
  ]
}
