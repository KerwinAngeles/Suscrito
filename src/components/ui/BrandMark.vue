<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ label: string; size?: number; circle?: boolean }>(), {
  size: 46,
  circle: false,
})

const initial = computed(() => props.label.trim().charAt(0).toUpperCase() || '?')
const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.round(props.size * 0.42)}px`,
  borderRadius: props.circle ? '999px' : `${Math.max(Math.round(props.size * 0.26), 8)}px`,
}))
</script>

<template>
  <div
    class="flex flex-none items-center justify-center bg-ink font-heading font-bold text-bg"
    :style="style"
    aria-hidden="true"
  >
    {{ initial }}
  </div>
</template>
