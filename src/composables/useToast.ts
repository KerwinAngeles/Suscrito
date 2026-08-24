import { readonly, ref } from 'vue'

export type ToastVariant = 'info' | 'error'

const message = ref('')
const variant = ref<ToastVariant>('info')
let timer: ReturnType<typeof setTimeout> | undefined

export function useToast() {
  function show(text: string, kind: ToastVariant, ms: number) {
    message.value = text
    variant.value = kind
    clearTimeout(timer)
    timer = setTimeout(() => {
      message.value = ''
    }, ms)
  }

  function toast(text: string, ms = 2600) {
    show(text, 'info', ms)
  }

  function toastError(text: string, ms = 4200) {
    show(text, 'error', ms)
  }

  function dismiss() {
    clearTimeout(timer)
    message.value = ''
  }

  return { message: readonly(message), variant: readonly(variant), toast, toastError, dismiss }
}
