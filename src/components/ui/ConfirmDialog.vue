<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useConfirm } from '@/composables/useConfirm'

const { state, accept, cancel } = useConfirm()

const confirmButton = ref<HTMLButtonElement | null>(null)
let lastFocused: HTMLElement | null = null

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
  }
}

watch(
  () => state.open,
  async (open) => {
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      confirmButton.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      lastFocused?.focus()
      lastFocused = null
    }
  },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div v-if="state.open" class="fixed inset-0 z-70 flex items-center justify-center p-5">
        <div class="absolute inset-0 bg-neutral-900/45 backdrop-blur-[2px]" @click="cancel"></div>

        <div
          class="card relative w-full max-w-[380px] p-6 shadow-lg"
          role="dialog"
          aria-modal="true"
          :aria-label="state.title"
        >
          <div class="flex items-center gap-2.5">
            <span
              v-if="state.danger"
              class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-200 text-accent-700"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              >
                <path d="M12 8v5M12 16.5v.5" />
                <path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
            </span>
            <h4 class="m-0 text-[19px]">{{ state.title }}</h4>
          </div>
          <p v-if="state.message" class="text-muted mt-2 mb-0 text-[13.5px] text-pretty">
            {{ state.message }}
          </p>

          <div class="mt-5 flex gap-2.5">
            <button
              ref="confirmButton"
              type="button"
              class="btn btn-primary flex-1"
              @click="accept"
            >
              {{ state.confirmLabel }}
            </button>
            <button type="button" class="btn btn-secondary flex-1" @click="cancel">
              {{ state.cancelLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
