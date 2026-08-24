<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChipButton from '@/components/ui/ChipButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useConfirm } from '@/composables/useConfirm'
import type { Currency } from '@/types/database'

const auth = useAuthStore()
const profile = useProfileStore()
const router = useRouter()
const { confirm } = useConfirm()

const remindOptions = [
  { value: 0, label: 'El mismo día' },
  { value: 1, label: '1 día antes' },
  { value: 3, label: '3 días antes' },
  { value: 7, label: 'Una semana antes' },
]

const unusedOptions = [30, 45, 60, 90].map((v) => ({ value: v, label: `${v} días` }))
const currencies: Currency[] = ['€', '$', '£']

const toggles = computed(() => [
  {
    key: 'hikes' as const,
    label: 'Subidas de precio',
    hint: 'Aviso cuando un servicio cambia de tarifa',
    on: profile.alerts.hikes,
  },
  {
    key: 'unused' as const,
    label: 'Suscripciones sin usar',
    hint: 'Resumen mensual de lo que no abres',
    on: profile.alerts.unused,
  },
  {
    key: 'trials' as const,
    label: 'Fin de prueba gratuita',
    hint: 'Aviso 2 días antes de que empiece a cobrar',
    on: profile.alerts.trials,
  },
])



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
  <main class="mx-auto max-w-[720px] px-6 pt-8 pb-24">
    <h1 class="m-0 text-[38px]">Ajustes</h1>
    <p class="text-muted mt-2">Avisos antes de cada cobro y alertas automáticas.</p>

    <section class="card mt-7 p-6">
      <h6 class="mb-4 font-semibold">Avisarme antes del cobro</h6>
      <div class="flex flex-wrap gap-1.5">
        <ChipButton
          v-for="o in remindOptions"
          :key="o.value"
          :active="profile.remindDays === o.value"
          @click="profile.setRemindDays(o.value)"
        >
          {{ o.label }}
        </ChipButton>
      </div>
    </section>

    <section class="card mt-4 p-6">
      <h6 class="mb-2 font-semibold">Alertas</h6>
      <button
        v-for="t in toggles"
        :key="t.key"
        type="button"
        class="row-hit -mx-2 flex w-[calc(100%+1rem)] items-center gap-5 px-2 py-3.5 text-left"
        :aria-pressed="t.on ? 'true' : 'false'"
        @click="profile.toggleAlert(t.key)"
      >
        <span class="flex-1">
          <span class="block font-heading text-[14.5px] font-semibold">{{ t.label }}</span>
          <span class="block text-[12.5px] text-neutral-600">{{ t.hint }}</span>
        </span>
        <span
          class="flex h-6 w-11 flex-none items-center rounded-full p-[3px] transition-colors duration-200"
          :class="[t.on ? 'bg-accent' : 'bg-neutral-300', t.on ? 'justify-end' : 'justify-start']"
        >
          <span class="block h-[18px] w-[18px] rounded-full bg-white shadow-sm"></span>
        </span>
      </button>
    </section>

    <section class="card mt-4 p-6">
      <h6 class="mb-4 font-semibold">Marcar como «sin usar» tras</h6>
      <div class="flex flex-wrap gap-1.5">
        <ChipButton
          v-for="o in unusedOptions"
          :key="o.value"
          :active="profile.unusedDays === o.value"
          @click="profile.setUnusedDays(o.value)"
        >
          {{ o.label }}
        </ChipButton>
      </div>

      <hr class="hr" />

      <h6 class="mb-4 font-semibold">Moneda</h6>
      <div class="flex flex-wrap gap-1.5">
        <ChipButton
          v-for="c in currencies"
          :key="c"
          :active="profile.currency === c"
          @click="profile.setCurrency(c)"
        >
          {{ c }}
        </ChipButton>
      </div>
    </section>

    <section class="card mt-4 flex flex-wrap items-center justify-between gap-4 p-6">
      <div>
        <h6 class="m-0 font-semibold">Cuenta</h6>
        <div class="text-muted mt-1 text-[13px]">{{ auth.user?.email }}</div>
      </div>
      <button type="button" class="btn btn-secondary" @click="signOut">Cerrar sesión</button>
    </section>
  </main>
</template>
