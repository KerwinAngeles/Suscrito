<script setup lang="ts">
defineProps<{ active?: boolean }>()
</script>

<template>
  <button
    type="button"
    class="rounded-full px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors"
    :class="
      active
        ? 'bg-accent text-white'
        : 'text-neutral-700 hover:bg-accent-200 hover:text-accent-800'
    "
    :aria-pressed="active ? 'true' : 'false'"
  >
    <slot />
  </button>
</template>
