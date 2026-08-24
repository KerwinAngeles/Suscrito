import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  typeof url === 'string' && url.startsWith('http') && typeof anonKey === 'string' && anonKey.length > 20

export const supabase = createClient<Database>(
  isSupabaseConfigured ? url : 'http://localhost:54321',
  isSupabaseConfigured ? anonKey : 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export function friendlyAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed': 'Confirma tu correo antes de entrar.',
    'User already registered': 'Ya existe una cuenta con ese correo.',
    'Password should be at least 6 characters': 'La contraseña necesita al menos 6 caracteres.',
    'Signup requires a valid password': 'Escribe una contraseña válida.',
    'Unable to validate email address: invalid format': 'El correo no tiene un formato válido.',
  }
  return map[message] ?? message
}
