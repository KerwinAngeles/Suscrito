<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useConfirm } from '@/composables/useConfirm'
import type { PreferredView } from '@/types/database'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const profile = useProfileStore()
const { confirm } = useConfirm()

const tabs = [
  { name: 'panel', label: 'Panel' },
  { name: 'calendario', label: 'Calendario' },
  { name: 'ajustes', label: 'Ajustes' },
] as const

const views: { value: PreferredView; label: string }[] = [
  { value: 'month', label: 'Al mes' },
  { value: 'year', label: 'Al año' },
]

const currentTab = computed(() => (route.name === 'detalle' ? 'panel' : route.name))

async function signOut() {
  const ok = await confirm({
    title: '¿Cerrar sesión?',
    message: 'Tendrás que volver a entrar con tu correo y contraseña.',
    confirmLabel: 'Cerrar sesión',
    cancelLabel: 'Seguir aquí',
  })
  if (!ok) return
  await auth.signOut()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="sticky top-0 z-20 bg-bg/85 backdrop-blur-md">
    <div class="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-6 py-4">
      <RouterLink
        :to="{ name: 'panel' }"
        class="flex items-center gap-2.5 text-ink no-underline hover:text-ink"
      >
        <span class="flex h-7 w-7 flex-col justify-center gap-[3px] rounded-lg bg-ink px-1.5">
          <span class="block h-[2px] w-full rounded-full bg-bg"></span>
          <span class="block h-[2px] w-3/5 rounded-full bg-accent"></span>
          <span class="block h-[2px] w-full rounded-full bg-bg"></span>
        </span>
        <span class="font-heading text-[19px] font-extrabold tracking-[-0.03em]">
          suscrito<span class="text-accent">.</span>
        </span>
      </RouterLink>

      <div
        class="flex items-center gap-1 rounded-full border border-divider bg-sunken p-1"
        role="group"
        aria-label="Periodo"
      >
        <button
          v-for="v in views"
          :key="v.value"
          type="button"
          class="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
          :class="
            profile.view === v.value
              ? 'bg-surface text-ink shadow-sm'
              : 'text-neutral-600 hover:text-ink'
          "
          :aria-pressed="profile.view === v.value ? 'true' : 'false'"
          @click="profile.setView(v.value)"
        >
          {{ v.label }}
        </button>
      </div>

      <nav class="ml-auto flex items-center gap-6">
        <RouterLink
          v-for="t in tabs"
          :key="t.name"
          :to="{ name: t.name }"
          class="text-[14.5px] no-underline transition-colors"
          :class="
            currentTab === t.name
              ? 'font-semibold text-ink'
              : 'font-medium text-neutral-600 hover:text-ink'
          "
        >
          {{ t.label }}
        </RouterLink>

        <div class="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-surface text-accent-700 shadow-sm transition-colors hover:bg-accent-200"
            :title="`Cerrar sesión (${auth.user?.email ?? ''})`"
            aria-label="Cerrar sesión"
            @click="signOut"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  </header>
</template>
