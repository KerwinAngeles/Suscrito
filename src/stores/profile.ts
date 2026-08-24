import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { Currency, PreferredView, Profile } from '@/types/database'

const DEFAULTS = {
  currency: '€' as Currency,
  monthly_budget: 120,
  preferred_view: 'month' as PreferredView,
  remind_days: 3,
  unused_days: 45,
  alert_hikes: true,
  alert_unused: true,
  alert_trials: false,
}

export const useProfileStore = defineStore('profile', () => {
  const auth = useAuthStore()
  const { toast, toastError } = useToast()
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const error = ref('')

  const currency = computed<Currency>(() => profile.value?.currency ?? DEFAULTS.currency)
  const budget = computed(() => Number(profile.value?.monthly_budget ?? DEFAULTS.monthly_budget))
  const view = computed<PreferredView>(() => profile.value?.preferred_view ?? DEFAULTS.preferred_view)
  const isYearly = computed(() => view.value === 'year')
  const remindDays = computed(() => profile.value?.remind_days ?? DEFAULTS.remind_days)
  const unusedDays = computed(() => profile.value?.unused_days ?? DEFAULTS.unused_days)
  const alerts = computed(() => ({
    hikes: profile.value?.alert_hikes ?? DEFAULTS.alert_hikes,
    unused: profile.value?.alert_unused ?? DEFAULTS.alert_unused,
    trials: profile.value?.alert_trials ?? DEFAULTS.alert_trials,
  }))

  async function load() {
    const userId = auth.user?.id
    if (!userId) return
    loading.value = true
    error.value = ''
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (err) {
      error.value = err.message
    } else if (data) {
      profile.value = data as Profile
    } else {
      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .insert({ id: userId, display_name: auth.displayName, ...DEFAULTS })
        .select()
        .single()
      if (insertErr) error.value = insertErr.message
      else profile.value = created as Profile
    }
    loading.value = false
  }

  async function update(patch: Partial<Profile>, successMessage?: string) {
    const userId = auth.user?.id
    if (!userId || !profile.value) return
    const previous = { ...profile.value }
    profile.value = { ...profile.value, ...patch }

    const { error: err } = await supabase.from('profiles').update(patch).eq('id', userId)
    if (err) {
      profile.value = previous
      error.value = err.message
      toastError(`No se pudo guardar: ${err.message}`)
      return
    }
    if (successMessage) toast(successMessage)
  }

  const setBudget = (value: number) =>
    update({ monthly_budget: Math.max(10, Math.round(value)) }, 'Objetivo actualizado')
  const setView = (value: PreferredView) => update({ preferred_view: value })
  const setRemindDays = (value: number) => update({ remind_days: value }, 'Aviso actualizado')
  const setUnusedDays = (value: number) =>
    update({ unused_days: value }, `Sin usar tras ${value} días`)
  const setCurrency = (value: Currency) => update({ currency: value }, `Moneda: ${value}`)

  function toggleAlert(key: 'hikes' | 'unused' | 'trials') {
    const column = ({ hikes: 'alert_hikes', unused: 'alert_unused', trials: 'alert_trials' } as const)[key]
    const next = !alerts.value[key]
    return update(
      { [column]: next } as Partial<Profile>,
      next ? 'Alerta activada' : 'Alerta desactivada',
    )
  }

  function reset() {
    profile.value = null
    error.value = ''
  }

  return {
    profile,
    loading,
    error,
    currency,
    budget,
    view,
    isYearly,
    remindDays,
    unusedDays,
    alerts,
    load,
    update,
    setBudget,
    setView,
    setRemindDays,
    setUnusedDays,
    setCurrency,
    toggleAlert,
    reset,
  }
})
