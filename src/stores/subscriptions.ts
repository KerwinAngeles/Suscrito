import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { startOfToday, toISODate } from '@/lib/format'
import { useToast } from '@/composables/useToast'
import type {
  ActivityEntry,
  BillingCycle,
  MonthlySpendRow,
  Subscription,
  SubscriptionMetrics,
  SubscriptionPrice,
  SubscriptionStatus,
} from '@/types/database'

export interface NewSubscription {
  name: string
  amount: number
  cycle?: BillingCycle
  category?: string
  nextCharge?: string
  website?: string | null
}

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const auth = useAuthStore()
  const profile = useProfileStore()
  const { toastError } = useToast()

  const items = ref<SubscriptionMetrics[]>([])
  const prices = ref<SubscriptionPrice[]>([])
  const activity = ref<ActivityEntry[]>([])
  const history = ref<MonthlySpendRow[]>([])
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)

  let channel: RealtimeChannel | null = null

  const active = computed(() => items.value.filter((s) => s.status === 'active'))

  const monthlyTotal = computed(() =>
    active.value.reduce((sum, s) => sum + Number(s.monthly_amount), 0),
  )
  const yearlyTotal = computed(() => monthlyTotal.value * 12)
  const total = computed(() => (profile.isYearly ? yearlyTotal.value : monthlyTotal.value))
  const budget = computed(() => (profile.isYearly ? profile.budget * 12 : profile.budget))
  const budgetDelta = computed(() => total.value - budget.value)

  const unused = computed(() => active.value.filter((s) => s.days_since_use >= profile.unusedDays))
  const unusedYearlyCost = computed(() =>
    unused.value.reduce((sum, s) => sum + Number(s.monthly_amount) * 12, 0),
  )

  const nextCharge = computed(() =>
    active.value
      .slice()
      .sort((a, b) => a.days_until_charge - b.days_until_charge)
      .find((s) => s.days_until_charge >= 0) ?? active.value[0] ?? null,
  )

  const categories = computed(() => [...new Set(active.value.map((s) => s.category))].slice(0, 6))

  const byId = computed(
    () => new Map(items.value.map((s) => [s.id, s] as const)),
  )

  function pricesFor(subscriptionId: string): SubscriptionPrice[] {
    return prices.value
      .filter((p) => p.subscription_id === subscriptionId)
      .sort(
        (a, b) =>
          a.effective_from.localeCompare(b.effective_from) ||
          a.created_at.localeCompare(b.created_at),
      )
  }

  function hasPriceHike(subscriptionId: string): boolean {
    const list = pricesFor(subscriptionId)
    return list.length > 1 && Number(list.at(-1)!.amount) > Number(list.at(-2)!.amount)
  }

  async function loadAll() {
    const userId = auth.user?.id
    if (!userId) return
    loading.value = true
    error.value = ''

    const [subsRes, pricesRes, activityRes, historyRes] = await Promise.all([
      supabase.from('subscription_metrics').select('*').order('created_at', { ascending: true }),
      supabase.from('subscription_prices').select('*'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8),
      supabase.rpc('monthly_spend_history', { p_months: 12 }),
    ])

    const failed = [subsRes, pricesRes, activityRes, historyRes].find((r) => r.error)
    if (failed?.error) {
      error.value = failed.error.message
      toastError(failed.error.message)
    } else {
      items.value = (subsRes.data ?? []) as SubscriptionMetrics[]
      prices.value = (pricesRes.data ?? []) as SubscriptionPrice[]
      activity.value = (activityRes.data ?? []) as ActivityEntry[]
      history.value = (historyRes.data ?? []) as MonthlySpendRow[]
    }

    loading.value = false
    loaded.value = true
  }

  async function refreshDerived() {
    const [pricesRes, activityRes, historyRes] = await Promise.all([
      supabase.from('subscription_prices').select('*'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8),
      supabase.rpc('monthly_spend_history', { p_months: 12 }),
    ])
    if (pricesRes.data) prices.value = pricesRes.data as SubscriptionPrice[]
    if (activityRes.data) activity.value = activityRes.data as ActivityEntry[]
    if (historyRes.data) history.value = historyRes.data as MonthlySpendRow[]
  }

  async function add(input: NewSubscription): Promise<SubscriptionMetrics | null> {
    const userId = auth.user?.id
    if (!userId) return null

    const today = startOfToday()
    const defaultNext = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())

    const { data, error: err } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        name: input.name.trim(),
        category: input.category?.trim() || 'Otros',
        amount: input.amount,
        cycle: input.cycle ?? 'monthly',
        next_charge: input.nextCharge ?? toISODate(defaultNext),
        last_used_on: toISODate(today),
        started_on: toISODate(today),
        website: input.website ?? null,
      })
      .select('id')
      .single()

    if (err) {
      error.value = err.message
      toastError(err.message)
      return null
    }

    await loadAll()
    return byId.value.get(data.id) ?? null
  }

  async function setStatus(id: string, status: SubscriptionStatus) {
    const target = byId.value.get(id)
    if (!target) return
    const previous = target.status
    target.status = status

    const { error: err } = await supabase.from('subscriptions').update({ status }).eq('id', id)
    if (err) {
      target.status = previous
      error.value = err.message
      toastError(err.message)
      return
    }
    await refreshDerived()
  }

  async function update(id: string, patch: Partial<Omit<Subscription, 'id' | 'user_id'>>) {
    const { error: err } = await supabase.from('subscriptions').update(patch).eq('id', id)
    if (err) {
      error.value = err.message
      toastError(err.message)
      return
    }
    await loadAll()
  }

  async function markUsedToday(id: string) {
    await update(id, { last_used_on: toISODate(startOfToday()) })
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('subscriptions').delete().eq('id', id)
    if (err) {
      error.value = err.message
      toastError(err.message)
      return
    }
    items.value = items.value.filter((s) => s.id !== id)
    await refreshDerived()
  }

  async function seedDemo(): Promise<number> {
    const { data, error: err } = await supabase.rpc('seed_demo_subscriptions')
    if (err) {
      error.value = err.message
      toastError(err.message)
      return 0
    }
    await loadAll()
    return Number(data ?? 0)
  }

  function subscribeToChanges() {
    const userId = auth.user?.id
    if (!userId || channel) return
    channel = supabase
      .channel(`subs:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` },
        () => void loadAll(),
      )
      .subscribe()
  }

  function unsubscribe() {
    if (channel) {
      void supabase.removeChannel(channel)
      channel = null
    }
  }

  function reset() {
    items.value = []
    prices.value = []
    activity.value = []
    history.value = []
    loaded.value = false
    error.value = ''
    unsubscribe()
  }

  return {
    items,
    prices,
    activity,
    history,
    loading,
    loaded,
    error,
    active,
    monthlyTotal,
    yearlyTotal,
    total,
    budget,
    budgetDelta,
    unused,
    unusedYearlyCost,
    nextCharge,
    categories,
    byId,
    pricesFor,
    hasPriceHike,
    loadAll,
    refreshDerived,
    add,
    setStatus,
    update,
    markUsedToday,
    remove,
    seedDemo,
    subscribeToChanges,
    unsubscribe,
    reset,
  }
})
