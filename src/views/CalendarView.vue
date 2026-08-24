<script setup lang="ts">
import { computed, ref } from 'vue'
import { MONTHS_LONG, WEEKDAYS_SHORT, formatMoney, parseDate, startOfToday } from '@/lib/format'
import { useProfileStore } from '@/stores/profile'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import type { SubscriptionMetrics } from '@/types/database'

interface CellCharge {
  id: string
  name: string
}

const profile = useProfileStore()
const subscriptions = useSubscriptionsStore()

const offset = ref(0)
const today = startOfToday()

const cursor = computed(() => new Date(today.getFullYear(), today.getMonth() + offset.value, 1))
const title = computed(() => `${MONTHS_LONG[cursor.value.getMonth()]} ${cursor.value.getFullYear()}`)

function chargeDay(sub: SubscriptionMetrics, year: number, month: number): number | null {
  const anchor = parseDate(sub.next_charge)
  const started = parseDate(sub.started_on)
  const monthIndex = year * 12 + month

  if (monthIndex < started.getFullYear() * 12 + started.getMonth()) return null
  if (sub.cycle === 'yearly' && month !== anchor.getMonth()) return null

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Math.min(anchor.getDate(), daysInMonth)
}

const cells = computed(() => {
  const year = cursor.value.getFullYear()
  const month = cursor.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (cursor.value.getDay() + 6) % 7

  const byDay = new Map<number, CellCharge[]>()
  for (const sub of subscriptions.active) {
    const day = chargeDay(sub, year, month)
    if (day === null) continue
    const list = byDay.get(day) ?? []
    list.push({ id: sub.id, name: sub.name })
    byDay.set(day, list)
  }

  const out: { key: string; day: number | null; charges: CellCharge[]; isToday: boolean }[] = []
  for (let i = 0; i < leading; i++) {
    out.push({ key: `pad-${i}`, day: null, charges: [], isToday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    out.push({
      key: `d-${d}`,
      day: d,
      charges: byDay.get(d) ?? [],
      isToday: offset.value === 0 && d === today.getDate(),
    })
  }
  return out
})

const monthTotal = computed(() =>
  subscriptions.active.reduce((sum, sub) => {
    const day = chargeDay(sub, cursor.value.getFullYear(), cursor.value.getMonth())
    return day === null ? sum : sum + Number(sub.amount)
  }, 0),
)

const summary = computed(() =>
  monthTotal.value > 0
    ? `${formatMoney(monthTotal.value, profile.currency)} en cobros este mes`
    : 'Sin cobros este mes',
)
</script>

<template>
  <main class="mx-auto max-w-[980px] px-6 pt-8 pb-24">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="m-0 text-[38px]">{{ title }}</h1>
        <div class="text-muted mt-1 text-[13.5px]">{{ summary }}</div>
      </div>

      <div class="flex gap-2">
        <button type="button" class="btn btn-secondary" @click="offset--">← Anterior</button>
        <button v-if="offset !== 0" type="button" class="btn btn-secondary" @click="offset = 0">
          Hoy
        </button>
        <button type="button" class="btn btn-secondary" @click="offset++">Siguiente →</button>
      </div>
    </div>

    <div class="card mt-7 overflow-hidden">
      <div class="grid grid-cols-7">
        <div
          v-for="w in WEEKDAYS_SHORT"
          :key="w"
          class="border-b border-divider bg-sunken px-3 py-3 text-[11.5px] font-semibold text-neutral-600"
        >
          {{ w }}
        </div>

        <div
          v-for="(cell, i) in cells"
          :key="cell.key"
          class="min-h-[110px] border-divider p-2"
          :class="[
            cell.day === null ? 'bg-sunken/60' : '',
            (i + 1) % 7 !== 0 ? 'border-r' : '',
            i < cells.length - 7 ? 'border-b' : '',
          ]"
        >
          <div
            v-if="cell.day !== null"
            class="mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-semibold"
            :class="cell.isToday ? 'bg-accent text-white' : 'text-neutral-600'"
          >
            {{ cell.day }}
          </div>

          <RouterLink
            v-for="charge in cell.charges"
            :key="charge.id"
            :to="{ name: 'detalle', params: { id: charge.id } }"
            class="mb-1 block truncate rounded-lg bg-accent-200 px-2 py-1.5 text-[11.5px] leading-tight font-semibold text-accent-900 no-underline transition-colors hover:bg-accent-300"
          >
            {{ charge.name }}
          </RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>
