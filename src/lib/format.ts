import type { BillingCycle, Currency, SubscriptionStatus } from '@/types/database'

export const MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

export const MONTHS_LONG = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function formatMoney(value: number, currency: Currency = '€', decimals = 2): string {
  const amount = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
  return `${amount} ${currency}`
}

export function parseDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

export function toISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

export function chargeCopy(days: number): string {
  if (days < 0) return `venció hace ${Math.abs(days)} d`
  if (days === 0) return 'se cobra hoy'
  if (days === 1) return 'se cobra mañana'
  return `se cobra en ${days} días`
}

export function whenCopy(days: number): string {
  if (days < 0) return `hace ${Math.abs(days)} días`
  if (days === 0) return 'hoy'
  if (days === 1) return 'mañana'
  return `en ${days} días`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'hace 1 día'
  if (days < 7) return `hace ${days} días`
  const weeks = Math.round(days / 7)
  if (weeks === 1) return 'hace 1 semana'
  if (weeks < 5) return `hace ${weeks} semanas`
  const months = Math.round(days / 30)
  return months <= 1 ? 'hace 1 mes' : `hace ${months} meses`
}

export function dayMonthLabel(isoDate: string): string {
  const d = parseDate(isoDate)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export function monthYearLabel(isoDate: string): string {
  const d = parseDate(isoDate)
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: 'cada mes',
  yearly: 'cada año',
}

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  cancelled: 'Cancelada',
}
