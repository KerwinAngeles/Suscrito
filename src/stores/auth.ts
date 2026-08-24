import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { friendlyAuthError, supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref('')

  const user = computed<User | null>(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => session.value !== null)
  const displayName = computed(
    () =>
      (user.value?.user_metadata?.display_name as string | undefined) ??
      user.value?.email?.split('@')[0] ??
      '',
  )

  async function initialize() {
    if (initialized.value) return
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    supabase.auth.onAuthStateChange((_event, next) => {
      session.value = next
    })
    initialized.value = true
  }

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true
    error.value = ''
    try {
      return await fn()
    } catch (e) {
      error.value = friendlyAuthError(e instanceof Error ? e.message : String(e))
      return null
    } finally {
      loading.value = false
    }
  }

  function signIn(email: string, password: string) {
    return run(async () => {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      session.value = data.session
      return data.session
    })
  }

  function signUp(email: string, password: string, name: string) {
    return run(async () => {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() || email.split('@')[0] } },
      })
      if (err) throw err
      session.value = data.session
      return data.session === null
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    session.value = null
  }

  function sendPasswordReset(email: string) {
    return run(async () => {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/entrar`,
      })
      if (err) throw err
      return true
    })
  }

  return {
    session,
    user,
    displayName,
    isAuthenticated,
    initialized,
    loading,
    error,
    initialize,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
  }
})
