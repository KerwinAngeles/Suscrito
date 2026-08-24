<script setup lang="ts">
import { computed, ref } from 'vue'
import ActivityFeed from '@/components/dashboard/ActivityFeed.vue'
import BudgetControl from '@/components/dashboard/BudgetControl.vue'
import QuickAddForm from '@/components/dashboard/QuickAddForm.vue'
import SpendHistory from '@/components/dashboard/SpendHistory.vue'
import SubscriptionRow from '@/components/dashboard/SubscriptionRow.vue'
import ChipButton from '@/components/ui/ChipButton.vue'
import { formatMoney, whenCopy } from '@/lib/format'
import { useProfileStore } from '@/stores/profile'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useToast } from '@/composables/useToast'

const profile = useProfileStore()
const subscriptions = useSubscriptionsStore()
const { toast } = useToast()

const filter = ref<string>('todas')
const seeding = ref(false)

const filters = computed(() => [
  { key: 'todas', label: 'Todas' },
  ...subscriptions.categories.map((c) => ({ key: c, label: c })),
  { key: 'sin-usar', label: 'Sin usar' },
])

const ranked = computed(() =>
  subscriptions.active
    .filter((s) => {
      if (filter.value === 'todas') return true
      if (filter.value === 'sin-usar') return s.days_since_use >= profile.unusedDays
      return s.category === filter.value
    })
    .slice()
    .sort((a, b) => Number(b.monthly_amount) - Number(a.monthly_amount)),
)

const headline = computed(() =>
  formatMoney(subscriptions.total, profile.currency, profile.isYearly ? 0 : 2),
)

const nextChargeCopy = computed(() => {
  const next = subscriptions.nextCharge
  return next ? `próximo cobro ${whenCopy(next.days_until_charge)} · ${next.name}` : 'sin cobros previstos'
})

const subline = computed(() => {
  const idle = subscriptions.unused
  if (!idle.length) {
    return 'Todo lo que pagas lo estás usando. Aquí verías las que llevan tiempo sin abrirse.'
  }
  const cost = formatMoney(subscriptions.unusedYearlyCost, profile.currency, 0)
  return `suman ${cost} al año. Están marcadas abajo; entra en cualquiera para cancelarla.`
})

const sublineLead = computed(() => {
  const idle = subscriptions.unused
  return idle.length
    ? `${idle.length} suscripciones que no abres desde hace más de ${profile.unusedDays} días`
    : ''
})

async function loadDemo() {
  seeding.value = true
  const inserted = await subscriptions.seedDemo()
  seeding.value = false
  toast(inserted ? `${inserted} suscripciones de ejemplo` : 'No se pudo cargar el ejemplo')
}
</script>

<template>
  <main class="mx-auto max-w-[880px] px-6 pt-8 pb-24">
    <p v-if="subscriptions.loading && !subscriptions.loaded" class="text-muted text-center">
      Cargando…
    </p>

    <section v-else-if="!subscriptions.items.length" class="mx-auto max-w-[620px] text-center">
      <h1 class="mt-10 text-[46px] leading-[1.08]">
        Empieza por la <span class="text-accent">primera</span>
      </h1>
      <p class="text-muted mx-auto mt-4 max-w-[46ch] text-[15px] text-pretty">
        Añade una suscripción con su importe y Suscrito se encarga del resto: próximos cobros,
        histórico de precio y avisos de lo que dejas de usar.
      </p>
      <div class="mt-8">
        <QuickAddForm />
      </div>
      <button type="button" class="btn btn-secondary mt-4" :disabled="seeding" @click="loadDemo">
        {{ seeding ? 'Cargando…' : 'Cargar datos de ejemplo' }}
      </button>
    </section>

    <section v-else>
      <div class="flex justify-center">
        <div class="pill pill-plain">
          <span class="h-[7px] w-[7px] rounded-full bg-success"></span>
          <span class="font-semibold text-ink">{{ subscriptions.active.length }} activas</span>
          <span class="text-neutral-600">· {{ nextChargeCopy }} ·</span>
          <RouterLink
            :to="{ name: 'calendario' }"
            class="font-medium text-accent-700 no-underline hover:underline"
          >
            ver calendario →
          </RouterLink>
        </div>
      </div>

      <h1 class="mt-9 text-center text-[54px] leading-[1.05] sm:text-[58px]">
        Gastas <span class="text-accent">{{ headline }}</span>
        {{ profile.isYearly ? 'al año' : 'al mes' }}
      </h1>

      <div class="mt-6">
        <BudgetControl />
      </div>

      <p class="text-muted mx-auto mt-5 max-w-[62ch] text-center text-[15px] text-pretty">
        <span v-if="sublineLead" class="font-semibold text-accent-700">{{ sublineLead }}</span>
        {{ subline }}
      </p>

      <div class="mt-8">
        <QuickAddForm />
      </div>

      <div class="-mx-6 mt-6 flex gap-1.5 overflow-x-auto px-6 pb-1">
        <ChipButton
          v-for="f in filters"
          :key="f.key"
          :active="filter === f.key"
          @click="filter = f.key"
        >
          {{ f.label }}
        </ChipButton>
      </div>

      <div class="mt-4 flex flex-col gap-3">
        <SubscriptionRow v-for="(sub, i) in ranked" :key="sub.id" :sub="sub" :rank="i + 1" />
        <p v-if="!ranked.length" class="text-muted py-6 text-center text-[13.5px]">
          Ninguna suscripción encaja con este filtro.
        </p>
      </div>

      <ActivityFeed />
      <SpendHistory />
    </section>
  </main>
</template>
