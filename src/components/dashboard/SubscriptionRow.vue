<script setup lang="ts">
import { computed } from 'vue'
import ServiceLogo from '@/components/ui/ServiceLogo.vue'
import { chargeCopy, formatMoney } from '@/lib/format'
import { useProfileStore } from '@/stores/profile'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import type { SubscriptionMetrics } from '@/types/database'

const props = defineProps<{ sub: SubscriptionMetrics; rank: number }>()

const profile = useProfileStore()
const subscriptions = useSubscriptionsStore()

const isTop = computed(() => props.rank === 1)
const isIdle = computed(() => props.sub.days_since_use >= profile.unusedDays)
const hasHike = computed(() => subscriptions.hasPriceHike(props.sub.id))
const flag = computed(() => (isIdle.value ? 'sin usar' : hasHike.value ? 'subió de precio' : ''))

const meta = computed(() => {
  const parts = [props.sub.category]
  parts.push(
    props.sub.status === 'active' ? chargeCopy(props.sub.days_until_charge) : 'sin cobros previstos',
  )
  return parts.join(' · ')
})

const price = computed(() =>
  formatMoney(
    profile.isYearly ? Number(props.sub.monthly_amount) * 12 : Number(props.sub.monthly_amount),
    profile.currency,
  ),
)

const priceNote = computed(() => {
  if (profile.isYearly) return 'al año'
  return props.sub.cycle === 'yearly' ? 'prorrateado / mes' : 'al mes'
})
</script>

<template>
  <RouterLink
    :to="{ name: 'detalle', params: { id: sub.id } }"
    class="rank-row flex items-center gap-4 border px-5 py-4 text-ink no-underline hover:text-ink sm:gap-5 sm:px-6"
    :class="isTop ? 'border-accent-400 bg-accent-300/55' : 'border-divider bg-accent-100'"
  >
    <span
      class="flex-none rounded-full px-3 py-1 text-[13px] font-bold"
      :class="isTop ? 'bg-accent text-white' : 'bg-accent-200 text-accent-700'"
    >
      #{{ rank }}
    </span>

    <ServiceLogo :name="sub.name" :website="sub.website" :size="46" />

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-heading text-[15.5px] font-bold">{{ sub.name }}</span>
        <span
          v-if="flag"
          class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          :class="isIdle ? 'bg-ink text-bg' : 'bg-accent-200 text-accent-800'"
        >
          {{ flag }}
        </span>
      </div>
      <div class="text-muted mt-0.5 truncate text-[13px]">{{ meta }}</div>
      <div class="text-[12px] text-neutral-500">último uso hace {{ sub.days_since_use }} días</div>
    </div>

    <div class="text-right">
      <div class="font-heading text-[16px] font-bold text-accent-700 tabular-nums">
        {{ price }}
      </div>
      <div class="text-[12px] text-neutral-500">{{ priceNote }}</div>
    </div>
  </RouterLink>
</template>
