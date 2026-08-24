<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney } from '@/lib/format'
import { useProfileStore } from '@/stores/profile'
import { useSubscriptionsStore } from '@/stores/subscriptions'

const profile = useProfileStore()
const subscriptions = useSubscriptionsStore()

const periodWord = computed(() => (profile.isYearly ? 'anual' : 'mensual'))
const budgetLabel = computed(() => formatMoney(subscriptions.budget, profile.currency, 0))
const over = computed(() => subscriptions.budgetDelta)
const diffLabel = computed(() =>
  over.value > 0
    ? `${formatMoney(over.value, profile.currency, 0)} por encima`
    : `${formatMoney(-over.value, profile.currency, 0)} de margen`,
)
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
    <span class="text-muted text-[13.5px]">Objetivo {{ periodWord }}</span>

    <div class="flex items-center gap-2.5">
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-full bg-accent-200 text-[16px] leading-none font-semibold text-accent-700 transition-colors hover:bg-accent-300"
        aria-label="Bajar objetivo"
        @click="profile.setBudget(profile.budget - 10)"
      >
        −
      </button>
      <span class="font-heading text-[19px] font-bold tabular-nums">{{ budgetLabel }}</span>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-full bg-accent-200 text-[16px] leading-none font-semibold text-accent-700 transition-colors hover:bg-accent-300"
        aria-label="Subir objetivo"
        @click="profile.setBudget(profile.budget + 10)"
      >
        +
      </button>
    </div>

    <span
      class="rounded-full px-3 py-1 text-[12.5px] font-semibold"
      :class="over > 0 ? 'bg-accent-200 text-accent-800' : 'bg-neutral-200 text-neutral-700'"
    >
      {{ diffLabel }}
    </span>
  </div>
</template>
