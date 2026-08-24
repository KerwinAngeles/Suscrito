<script setup lang="ts">
import { computed } from 'vue'
import ServiceLogo from '@/components/ui/ServiceLogo.vue'
import { useSubscriptionsStore } from '@/stores/subscriptions'

const subscriptions = useSubscriptionsStore()

const entries = computed(() =>
  subscriptions.activity.slice(0, 5).map((a) => ({
    id: a.id,
    name: a.subscription_name,
    website: a.subscription_id
      ? (subscriptions.byId.get(a.subscription_id)?.website ?? null)
      : null,
  })),
)
</script>

<template>
  <div class="mt-10 rounded-2xl bg-sunken px-5 py-4">
    <div class="mb-3 flex items-center gap-2">
      <span class="h-[5px] w-[5px] rounded-full bg-accent"></span>
      <span class="font-heading text-[12.5px] font-bold">Movimiento reciente</span>
    </div>

    <div v-if="entries.length" class="flex flex-wrap gap-2">
      <div
        v-for="a in entries"
        :key="a.id"
        class="flex min-w-0 flex-1 basis-[130px] items-center gap-2.5 rounded-full bg-surface px-3 py-2 shadow-sm"
      >
        <ServiceLogo :name="a.name" :website="a.website" :size="28" circle />
        <span class="truncate font-heading text-[12.5px] font-bold">{{ a.name }}</span>
      </div>
    </div>

    <p v-else class="text-muted m-0 text-[12.5px]">
      Aquí aparecerán las altas, bajas y subidas de precio.
    </p>
  </div>
</template>
