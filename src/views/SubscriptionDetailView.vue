<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ServiceLogo from '@/components/ui/ServiceLogo.vue'
import {
  CYCLE_LABEL,
  STATUS_LABEL,
  dayMonthLabel,
  formatMoney,
  monthYearLabel,
} from '@/lib/format'
import { useProfileStore } from '@/stores/profile'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { parseDomain } from '@/lib/site'
import type { BillingCycle } from '@/types/database'

const route = useRoute()
const router = useRouter()
const profile = useProfileStore()
const subscriptions = useSubscriptionsStore()
const { toast } = useToast()
const { confirm } = useConfirm()

const id = computed(() => String(route.params.id))
const sub = computed(() => subscriptions.byId.get(id.value) ?? null)

const editingPrice = ref(false)
const newPrice = ref('')
const editingDate = ref(false)
const newDate = ref('')
const newCycle = ref<BillingCycle>('monthly')
const editingSite = ref(false)
const newSite = ref('')
const editingName = ref(false)
const newName = ref('')
const busy = ref(false)

const previewDomain = computed(() => parseDomain(newSite.value))

const facts = computed(() => {
  const s = sub.value
  if (!s) return []
  const isActive = s.status === 'active'
  return [
    { label: 'Próximo cobro', value: isActive ? dayMonthLabel(s.next_charge) : '—' },
    { label: 'Faltan', value: isActive ? `${s.days_until_charge} días` : '—' },
    { label: 'Coste al año', value: formatMoney(Number(s.yearly_amount), profile.currency, 0) },
    { label: 'Último uso', value: `hace ${s.days_since_use} d` },
  ]
})

const priceHistory = computed(() => {
  const s = sub.value
  if (!s) return []
  const rows = subscriptions.pricesFor(s.id)
  return rows
    .map((row, i) => {
      const previous = i > 0 ? Number(rows[i - 1]!.amount) : null
      const amount = Number(row.amount)
      const up = previous !== null && amount > previous
      const down = previous !== null && amount < previous
      return {
        id: row.id,
        date: monthYearLabel(row.effective_from),
        amount: formatMoney(amount, profile.currency),
        delta:
          previous === null
            ? 'inicial'
            : up
              ? `+${formatMoney(amount - previous, profile.currency)}`
              : down
                ? `−${formatMoney(previous - amount, profile.currency)}`
                : 'sin cambio',
        up,
      }
    })
    .reverse()
})

const advice = computed(() => {
  const s = sub.value
  if (!s) return ''
  const yearly = formatMoney(Number(s.yearly_amount), profile.currency, 0)
  return s.days_since_use >= profile.unusedDays
    ? `No la abres desde hace ${s.days_since_use} días y te cuesta ${yearly} al año. Buena candidata para cancelar.`
    : 'La usas con regularidad. Si cancelas, seguirá activa hasta el próximo cobro.'
})

async function toggleCancel() {
  const s = sub.value
  if (!s) return
  busy.value = true
  const next = s.status === 'cancelled' ? 'active' : 'cancelled'
  await subscriptions.setStatus(s.id, next)
  busy.value = false
  toast(next === 'cancelled' ? `${s.name} cancelada` : `${s.name} reactivada`)
}

async function togglePause() {
  const s = sub.value
  if (!s) return
  busy.value = true
  const next = s.status === 'paused' ? 'active' : 'paused'
  await subscriptions.setStatus(s.id, next)
  busy.value = false
  toast(next === 'paused' ? `${s.name} en pausa` : `${s.name} reanudada`)
}

async function markUsed() {
  const s = sub.value
  if (!s) return
  busy.value = true
  await subscriptions.markUsedToday(s.id)
  busy.value = false
  toast('Marcada como usada hoy')
}

function startEditPrice() {
  if (!sub.value) return
  newPrice.value = String(sub.value.amount).replace('.', ',')
  editingPrice.value = true
}

async function savePrice() {
  const s = sub.value
  if (!s) return
  const amount = Number.parseFloat(newPrice.value.replace(',', '.'))
  if (!Number.isFinite(amount) || amount <= 0) return
  busy.value = true
  await subscriptions.update(s.id, { amount: Math.round(amount * 100) / 100 })
  busy.value = false
  editingPrice.value = false
  toast('Precio actualizado')
}

function startEditDate() {
  const s = sub.value
  if (!s) return
  newDate.value = s.next_charge
  newCycle.value = s.cycle
  editingDate.value = true
}

async function saveDate() {
  const s = sub.value
  if (!s || !newDate.value) return
  busy.value = true
  await subscriptions.update(s.id, { next_charge: newDate.value, cycle: newCycle.value })
  busy.value = false
  editingDate.value = false
  toast('Fecha de cobro actualizada')
}

function startEditName() {
  const s = sub.value
  if (!s) return
  newName.value = s.name
  editingName.value = true
}

async function saveName() {
  const s = sub.value
  if (!s) return
  const value = newName.value.trim()
  if (!value || value === s.name) {
    editingName.value = false
    return
  }
  busy.value = true
  await subscriptions.update(s.id, { name: value })
  busy.value = false
  editingName.value = false
  toast('Nombre actualizado')
}

function startEditSite() {
  const s = sub.value
  if (!s) return
  newSite.value = s.website ?? ''
  editingSite.value = true
}

async function saveSite() {
  const s = sub.value
  if (!s) return
  if (newSite.value.trim() && !previewDomain.value) return
  busy.value = true
  await subscriptions.update(s.id, { website: previewDomain.value })
  busy.value = false
  editingSite.value = false
  toast(previewDomain.value ? 'Logo actualizado' : 'Sitio web quitado')
}

async function removeSub() {
  const s = sub.value
  if (!s) return
  const ok = await confirm({
    title: `¿Eliminar ${s.name}?`,
    message: 'Se borra la suscripción con su historial de precio. No se puede deshacer.',
    confirmLabel: 'Eliminar',
    danger: true,
  })
  if (!ok) return
  busy.value = true
  await subscriptions.remove(s.id)
  busy.value = false
  toast(`${s.name} eliminada`)
  await router.push({ name: 'panel' })
}
</script>

<template>
  <main class="mx-auto max-w-[880px] px-6 pt-8 pb-24">
    <RouterLink :to="{ name: 'panel' }" class="btn btn-secondary mb-6 inline-flex no-underline">
      ← Volver
    </RouterLink>

    <p v-if="!sub" class="text-muted">Esta suscripción ya no existe.</p>

    <section v-else>
      <div class="card flex flex-wrap items-center justify-between gap-6 p-6 sm:p-7">
        <div class="flex items-center gap-4">
          <ServiceLogo :name="sub.name" :website="sub.website" :size="60" />
          <div>
            <h1 class="m-0 text-[30px]">{{ sub.name }}</h1>
            <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span class="pill pill-accent">{{ sub.category }}</span>
              <span
                class="pill"
                :class="sub.status === 'active' ? 'bg-neutral-200 text-neutral-700' : 'pill-ink'"
              >
                {{ STATUS_LABEL[sub.status] }}
              </span>
            </div>
          </div>
        </div>

        <div class="text-right">
          <div class="font-heading text-[34px] leading-none font-extrabold text-accent-700">
            {{ formatMoney(Number(sub.amount), profile.currency) }}
          </div>
          <div class="text-muted mt-1 text-[13px]">{{ CYCLE_LABEL[sub.cycle] }}</div>
        </div>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="f in facts" :key="f.label" class="rounded-lg bg-sunken px-5 py-4">
          <div class="text-[11.5px] font-medium text-neutral-600">{{ f.label }}</div>
          <div class="mt-1 font-heading text-[19px] font-bold">{{ f.value }}</div>
        </div>
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <div class="card p-6">
          <h6 class="mb-3 font-semibold">Historial de precio</h6>
          <div
            v-for="p in priceHistory"
            :key="p.id"
            class="flex items-center justify-between gap-4 border-t border-divider py-3 first:border-t-0"
          >
            <div class="text-muted text-[13px]">{{ p.date }}</div>
            <div class="flex items-center gap-2.5">
              <span class="text-[14px] font-medium tabular-nums">{{ p.amount }}</span>
              <span
                class="rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                :class="p.up ? 'bg-accent-200 text-accent-800' : 'bg-neutral-200 text-neutral-600'"
              >
                {{ p.delta }}
              </span>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h6 class="mb-3 font-semibold">Acciones</h6>
          <p class="text-muted text-[13.5px] text-pretty">{{ advice }}</p>

          <div class="mt-4 flex flex-col gap-2.5">
            <div v-if="editingName" class="flex gap-2">
              <input
                v-model="newName"
                class="input"
                type="text"
                aria-label="Nombre del servicio"
                @keyup.enter="saveName"
              />
              <button type="button" class="btn btn-primary flex-none" :disabled="busy" @click="saveName">
                Guardar
              </button>
              <button type="button" class="btn btn-secondary flex-none" @click="editingName = false">
                Cancelar
              </button>
            </div>
            <button
              v-else
              type="button"
              class="btn btn-secondary btn-block"
              @click="startEditName"
            >
              Cambiar el nombre
            </button>

            <button
              type="button"
              class="btn btn-primary btn-block"
              :disabled="busy"
              @click="toggleCancel"
            >
              {{ sub.status === 'cancelled' ? 'Reactivar suscripción' : 'Cancelar suscripción' }}
            </button>

            <button
              v-if="sub.status !== 'cancelled'"
              type="button"
              class="btn btn-secondary btn-block"
              :disabled="busy"
              @click="togglePause"
            >
              {{ sub.status === 'paused' ? 'Reanudar' : 'Pausar un mes' }}
            </button>

            <button
              type="button"
              class="btn btn-secondary btn-block"
              :disabled="busy"
              @click="markUsed"
            >
              La he usado hoy
            </button>

            <div v-if="editingPrice" class="flex gap-2">
              <input
                v-model="newPrice"
                class="input"
                type="text"
                inputmode="decimal"
                aria-label="Nuevo importe"
                @keyup.enter="savePrice"
              />
              <button type="button" class="btn btn-primary flex-none" :disabled="busy" @click="savePrice">
                Guardar
              </button>
              <button type="button" class="btn btn-secondary flex-none" @click="editingPrice = false">
                Cancelar
              </button>
            </div>
            <button
              v-else
              type="button"
              class="btn btn-secondary btn-block"
              @click="startEditPrice"
            >
              Cambiar el precio
            </button>

            <div v-if="editingDate" class="rounded-lg bg-sunken p-4">
              <label class="block text-[12.5px] font-medium text-neutral-600" for="next-charge">
                Próximo cobro
              </label>
              <input
                id="next-charge"
                v-model="newDate"
                class="input mt-1.5"
                type="date"
                @keyup.enter="saveDate"
              />

              <div class="mt-3 flex items-center gap-1 rounded-full border border-divider bg-surface p-1">
                <button
                  v-for="c in [
                    { value: 'monthly' as const, label: 'Cada mes' },
                    { value: 'yearly' as const, label: 'Cada año' },
                  ]"
                  :key="c.value"
                  type="button"
                  class="flex-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                  :class="
                    newCycle === c.value
                      ? 'bg-accent text-white'
                      : 'text-neutral-600 hover:text-ink'
                  "
                  :aria-pressed="newCycle === c.value ? 'true' : 'false'"
                  @click="newCycle = c.value"
                >
                  {{ c.label }}
                </button>
              </div>

              <div class="mt-3 flex gap-2">
                <button type="button" class="btn btn-primary flex-1" :disabled="busy" @click="saveDate">
                  Guardar
                </button>
                <button type="button" class="btn btn-secondary flex-1" @click="editingDate = false">
                  Cancelar
                </button>
              </div>
            </div>
            <button
              v-else
              type="button"
              class="btn btn-secondary btn-block"
              @click="startEditDate"
            >
              Cambiar la fecha de cobro
            </button>

            <div v-if="editingSite" class="rounded-lg bg-sunken p-4">
              <label class="block text-[12.5px] font-medium text-neutral-600" for="site">
                Sitio web (de ahí sale el logo)
              </label>
              <div class="mt-1.5 flex items-center gap-2.5">
                <input
                  id="site"
                  v-model="newSite"
                  class="input"
                  type="text"
                  placeholder="netflix.com"
                  autocomplete="off"
                  @keyup.enter="saveSite"
                />
                <ServiceLogo
                  v-if="previewDomain"
                  :name="previewDomain"
                  :website="previewDomain"
                  :size="40"
                />
              </div>
              <p
                v-if="newSite.trim() && !previewDomain"
                class="mt-2 mb-0 text-[12px] font-medium text-accent-700"
              >
                Eso no parece un dominio.
              </p>

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="btn btn-primary flex-1"
                  :disabled="busy || (!!newSite.trim() && !previewDomain)"
                  @click="saveSite"
                >
                  Guardar
                </button>
                <button type="button" class="btn btn-secondary flex-1" @click="editingSite = false">
                  Cancelar
                </button>
              </div>
            </div>
            <button
              v-else
              type="button"
              class="btn btn-secondary btn-block"
              @click="startEditSite"
            >
              {{ sub.website ? 'Cambiar el logo' : 'Añadir web para el logo' }}
            </button>

            <button
              type="button"
              class="btn btn-ghost mt-1 text-[13px]"
              :disabled="busy"
              @click="removeSub"
            >
              Eliminar del listado
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
