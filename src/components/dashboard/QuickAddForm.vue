<script setup lang="ts">
import { computed, ref } from 'vue'
import ServiceLogo from '@/components/ui/ServiceLogo.vue'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useToast } from '@/composables/useToast'
import { startOfToday, toISODate } from '@/lib/format'
import { nameFromDomain, parseDomain } from '@/lib/site'
import type { BillingCycle } from '@/types/database'

const subscriptions = useSubscriptionsStore()
const { toast } = useToast()

function defaultNextCharge(): string {
  const t = startOfToday()
  return toISODate(new Date(t.getFullYear(), t.getMonth() + 1, t.getDate()))
}

const name = ref('')
const amount = ref('')
const nextCharge = ref(defaultNextCharge())
const cycle = ref<BillingCycle>('monthly')
const hint = ref('')
const saving = ref(false)

const today = toISODate(startOfToday())

const parsedAmount = computed(() => Number.parseFloat(amount.value.replace(',', '.')))

const domain = computed(() => parseDomain(name.value))

async function submit() {
  hint.value = ''
  if (!name.value.trim()) {
    hint.value = 'Escribe el nombre del servicio.'
    return
  }
  if (!Number.isFinite(parsedAmount.value) || parsedAmount.value <= 0) {
    hint.value = 'Falta un importe válido.'
    return
  }
  if (!nextCharge.value) {
    hint.value = 'Elige la fecha del próximo cobro.'
    return
  }

  saving.value = true
  const created = await subscriptions.add({
    name: domain.value ? nameFromDomain(domain.value) : name.value,
    amount: Math.round(parsedAmount.value * 100) / 100,
    cycle: cycle.value,
    nextCharge: nextCharge.value,
    website: domain.value,
  })
  saving.value = false

  if (!created) {
    hint.value = subscriptions.error || 'No se ha podido guardar.'
    return
  }
  toast(`${created.name} añadida`)
  name.value = ''
  amount.value = ''
  nextCharge.value = defaultNextCharge()
  cycle.value = 'monthly'
}
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <div class="flex flex-wrap items-center justify-center gap-2.5">
      <div class="relative min-w-[260px] flex-1">
        <svg
          class="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-neutral-500"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20" />
        </svg>
        <input
          v-model="name"
          class="input pl-12"
          :class="domain ? 'pr-14' : ''"
          type="text"
          placeholder="Servicio nuevo — nombre o web"
          aria-label="Nombre o web del servicio"
        />
        <div v-if="domain" class="absolute top-1/2 right-3 -translate-y-1/2">
          <ServiceLogo :name="domain" :website="domain" :size="30" />
        </div>
      </div>

      <input
        v-model="amount"
        class="input w-[140px] flex-none text-center"
        type="text"
        inputmode="decimal"
        placeholder="Precio"
        aria-label="Precio"
      />

      <button type="submit" class="btn btn-primary h-[46px] px-7" :disabled="saving">
        {{ saving ? 'Guardando…' : 'Añadir' }}
      </button>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5">
      <label class="flex items-center gap-2.5 text-[13px] text-neutral-600">
        <span>Próximo cobro</span>
        <input
          v-model="nextCharge"
          class="input h-[38px] w-[168px] min-h-0 px-4 py-0 text-[13.5px]"
          type="date"
          :min="today"
          aria-label="Fecha del próximo cobro"
        />
      </label>

      <div class="flex items-center gap-1 rounded-full border border-divider bg-sunken p-1">
        <button
          v-for="c in [
            { value: 'monthly' as const, label: 'Mensual' },
            { value: 'yearly' as const, label: 'Anual' },
          ]"
          :key="c.value"
          type="button"
          class="rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors"
          :class="
            cycle === c.value ? 'bg-surface text-ink shadow-sm' : 'text-neutral-600 hover:text-ink'
          "
          :aria-pressed="cycle === c.value ? 'true' : 'false'"
          @click="cycle = c.value"
        >
          {{ c.label }}
        </button>
      </div>
    </div>

    <div
      class="mt-2.5 min-h-[18px] text-center text-[12.5px] font-medium"
      :class="hint ? 'text-accent-700' : 'text-transparent'"
      role="alert"
    >
      {{ hint }}
    </div>
  </form>
</template>
