<script setup lang="ts">
import { computed } from 'vue'
import { MONTHS_SHORT, parseDate } from '@/lib/format'
import { useSubscriptionsStore } from '@/stores/subscriptions'

const subscriptions = useSubscriptionsStore()

const bars = computed(() => {
  const rows = subscriptions.history
  const max = Math.max(...rows.map((r) => Number(r.total)), 1)
  return rows.map((r, i) => ({
    key: r.month,
    label: MONTHS_SHORT[parseDate(r.month).getMonth()],
    amount: Math.round(Number(r.total)),
    height: `${Math.max((Number(r.total) / max) * 100, 3)}%`,
    isCurrent: i === rows.length - 1,
  }))
})
</script>

<template>
  <section v-if="bars.length" class="card mt-6 p-6 sm:p-7">
    <h6 class="mb-6 font-semibold">Histórico · últimos 12 meses</h6>

    <div class="flex h-[150px] items-end gap-2">
      <div v-for="b in bars" :key="b.key" class="flex h-full flex-1 flex-col justify-end">
        <div class="mb-2 text-center text-[11px] font-medium text-neutral-600 tabular-nums">
          {{ b.amount }}
        </div>
        <div
          class="rounded-t-lg transition-colors"
          :style="{ height: b.height }"
          :class="b.isCurrent ? 'bg-accent' : 'bg-accent-300'"
          :title="`${b.label}: ${b.amount}`"
        ></div>
      </div>
    </div>

    <div class="mt-3 flex gap-2 border-t border-divider pt-3">
      <div
        v-for="b in bars"
        :key="`l-${b.key}`"
        class="flex-1 text-center text-[11px] font-medium text-neutral-500"
      >
        {{ b.label }}
      </div>
    </div>
  </section>
</template>
