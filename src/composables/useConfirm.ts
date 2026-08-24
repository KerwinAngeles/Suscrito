import { reactive, readonly } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

const state = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  danger: false,
})

let resolver: ((value: boolean) => void) | null = null

function settle(value: boolean) {
  state.open = false
  const resolve = resolver
  resolver = null
  resolve?.(value)
}

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    settle(false)

    state.title = options.title
    state.message = options.message ?? ''
    state.confirmLabel = options.confirmLabel ?? 'Confirmar'
    state.cancelLabel = options.cancelLabel ?? 'Cancelar'
    state.danger = options.danger ?? false
    state.open = true

    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  return {
    state: readonly(state),
    confirm,
    accept: () => settle(true),
    cancel: () => settle(false),
  }
}
