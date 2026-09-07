export interface ActionableReminderLike {
  next_due_date: string;
  recurrence_days: number | null;
  default_reschedule_days: number;
}

function parseIsoDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date.");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) throw new Error("Invalid date.");
  return date;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const next = parseIsoDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return isoDate(next);
}

export function isReminderDue(nextDueDate: string, today: string): boolean {
  return nextDueDate <= today;
}

export function nextDateAfterCompletion(reminder: ActionableReminderLike, completedOn: string): string | null {
  if (!reminder.recurrence_days) return null;
  // Advance from the later of the scheduled date or the completion date so a
  // late completion does not immediately create another overdue reminder.
  const anchor = reminder.next_due_date > completedOn ? reminder.next_due_date : completedOn;
  return addDays(anchor, reminder.recurrence_days);
}

export function rescheduleDate(reminder: Pick<ActionableReminderLike, "default_reschedule_days">, today: string): string {
  return addDays(today, reminder.default_reschedule_days);
}

export function daysOverdue(nextDueDate: string, today: string): number {
  const due = parseIsoDate(nextDueDate).getTime();
  const now = parseIsoDate(today).getTime();
  return Math.max(0, Math.floor((now - due) / 86_400_000));
}
