<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { message, variant, dismiss } = useToast()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="translate-y-3 opacity-0"
  >
    <button
      v-if="message"
      type="button"
      class="fixed bottom-8 left-1/2 z-60 flex -translate-x-1/2 items-center gap-2.5 rounded-full px-5 py-3 font-heading text-[13.5px] font-semibold shadow-lg"
      :class="variant === 'error' ? 'bg-accent text-white' : 'bg-ink text-bg'"
      role="status"
      aria-live="polite"
      title="Descartar"
      @click="dismiss"
    >
      <svg
        v-if="variant === 'error'"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
      <svg
        v-else
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="4 12.5 9.5 18 20 6.5" />
      </svg>
      {{ message }}
    </button>
  </Transition>
</template>
