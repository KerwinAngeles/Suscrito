<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BrandMark from '@/components/ui/BrandMark.vue'
import { logoUrl } from '@/lib/site'

const props = withDefaults(
  defineProps<{ name: string; website?: string | null; size?: number; circle?: boolean }>(),
  { website: null, size: 46, circle: false },
)

const failed = ref(false)

watch(
  () => props.website,
  () => {
    failed.value = false
  },
)

const src = computed(() => (props.website ? logoUrl(props.website) : null))

const tileStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: props.circle ? '999px' : `${Math.max(Math.round(props.size * 0.26), 8)}px`,
}))

const imgSize = computed(() => Math.round(props.size * 0.62))
</script>

<template>
  <BrandMark v-if="!src || failed" :label="name" :size="size" :circle="circle" />

  <div
    v-else
    class="flex flex-none items-center justify-center overflow-hidden border border-divider bg-white"
    :style="tileStyle"
  >
    <img
      :src="src"
      :alt="`Logo de ${name}`"
      :width="imgSize"
      :height="imgSize"
      :style="{ width: `${imgSize}px`, height: `${imgSize}px` }"
      class="object-contain"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="failed = true"
    />
  </div>
</template>
