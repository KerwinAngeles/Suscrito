<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppToast from '@/components/ui/AppToast.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import SetupNotice from '@/components/ui/SetupNotice.vue'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useSubscriptionsStore } from '@/stores/subscriptions'

const route = useRoute()
const auth = useAuthStore()
const profile = useProfileStore()
const subscriptions = useSubscriptionsStore()

const showChrome = computed(() => auth.isAuthenticated && route.meta.chrome !== false)

watch(
  () => auth.user?.id,
  async (userId, previous) => {
    if (userId === previous) return
    if (!userId) {
      profile.reset()
      subscriptions.reset()
      return
    }
    await profile.load()
    await subscriptions.loadAll()
    subscriptions.subscribeToChanges()
  },
  { immediate: true },
)

onBeforeUnmount(() => subscriptions.unsubscribe())
</script>

<template>
  <SetupNotice v-if="!isSupabaseConfigured" />
  <template v-else>
    <AppHeader v-if="showChrome" />
    <RouterView />
    <AppToast />
    <ConfirmDialog />
  </template>
</template>
