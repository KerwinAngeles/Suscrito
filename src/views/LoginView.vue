<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

type Mode = 'signin' | 'signup'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { toast } = useToast()

const mode = ref<Mode>('signin')
const email = ref('')
const password = ref('')
const name = ref('')
const notice = ref('')

const isSignup = computed(() => mode.value === 'signup')
const canSubmit = computed(
  () => email.value.includes('@') && password.value.length >= 6 && !auth.loading,
)

function switchMode(next: Mode) {
  mode.value = next
  auth.error = ''
  notice.value = ''
}

async function submit() {
  if (!canSubmit.value) return
  notice.value = ''

  if (isSignup.value) {
    const needsConfirmation = await auth.signUp(email.value, password.value, name.value)
    if (needsConfirmation === null) return
    if (needsConfirmation) {
      notice.value = 'Te hemos enviado un correo para confirmar la cuenta.'
      return
    }
  } else {
    const session = await auth.signIn(email.value, password.value)
    if (!session) return
  }

  toast('Hola de nuevo')
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  await router.push(redirect)
}

async function recover() {
  if (!email.value.includes('@')) {
    notice.value = 'Escribe tu correo para enviarte el enlace.'
    return
  }
  const ok = await auth.sendPasswordReset(email.value)
  if (ok) notice.value = 'Revisa tu correo: te hemos enviado un enlace para cambiar la contraseña.'
}
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-[460px] flex-col justify-center px-6 py-16">
    <div class="fixed top-5 right-5">
      <ThemeToggle />
    </div>

    <div class="mb-8 flex flex-col items-center text-center">
      <span class="flex h-9 w-9 flex-col justify-center gap-1 rounded-xl bg-ink px-2">
        <span class="block h-[2.5px] w-full rounded-full bg-bg"></span>
        <span class="block h-[2.5px] w-3/5 rounded-full bg-accent"></span>
        <span class="block h-[2.5px] w-full rounded-full bg-bg"></span>
      </span>

      <h1 class="mt-5 text-[34px] leading-[1.15]">
        Todo lo que pagas, <span class="text-accent">de un vistazo</span>
      </h1>
      <p class="text-muted mt-3 max-w-[36ch] text-[14.5px] text-pretty">
        Suscripciones, subidas de precio y servicios que llevas meses sin abrir.
      </p>
    </div>

    <div class="card p-6 sm:p-7">
      <div class="flex gap-1 rounded-full border border-divider bg-sunken p-1">
        <button
          type="button"
          class="flex-1 rounded-full py-2 text-[14px] font-semibold transition-colors"
          :class="!isSignup ? 'bg-surface text-ink shadow-sm' : 'text-neutral-600 hover:text-ink'"
          @click="switchMode('signin')"
        >
          Entrar
        </button>
        <button
          type="button"
          class="flex-1 rounded-full py-2 text-[14px] font-semibold transition-colors"
          :class="isSignup ? 'bg-surface text-ink shadow-sm' : 'text-neutral-600 hover:text-ink'"
          @click="switchMode('signup')"
        >
          Crear cuenta
        </button>
      </div>

      <form class="mt-5 flex flex-col gap-3.5" novalidate @submit.prevent="submit">
        <div v-if="isSignup" class="field">
          <label for="name">Nombre</label>
          <input id="name" v-model="name" class="input" type="text" autocomplete="name" />
        </div>

        <div class="field">
          <label for="email">Correo</label>
          <input
            id="email"
            v-model.trim="email"
            class="input"
            type="email"
            required
            autocomplete="email"
            placeholder="tu@correo.com"
          />
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            class="input"
            type="password"
            required
            minlength="6"
            :autocomplete="isSignup ? 'new-password' : 'current-password'"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <p
          v-if="auth.error"
          class="m-0 rounded-lg bg-accent-200 px-4 py-2.5 text-[13px] font-medium text-accent-800"
        >
          {{ auth.error }}
        </p>
        <p
          v-else-if="notice"
          class="m-0 rounded-lg bg-neutral-200 px-4 py-2.5 text-[13px] text-neutral-700"
        >
          {{ notice }}
        </p>

        <button type="submit" class="btn btn-primary btn-block h-[46px]" :disabled="!canSubmit">
          {{ auth.loading ? 'Un momento…' : isSignup ? 'Crear cuenta' : 'Entrar' }}
        </button>

        <button
          v-if="!isSignup"
          type="button"
          class="btn btn-ghost mx-auto text-[13px]"
          @click="recover"
        >
          He olvidado la contraseña
        </button>
      </form>
    </div>
  </main>
</template>
