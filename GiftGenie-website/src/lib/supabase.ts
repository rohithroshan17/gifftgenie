import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const hasValidUrl = (() => {
  if (!supabaseUrl || !supabaseAnonKey) return false
  try {
    const parsed = new URL(supabaseUrl)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
})()

export const supabase: SupabaseClient | null = hasValidUrl && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = Boolean(supabase)

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function signIn(email: string, password: string) {
  if (!supabase) return { error: new Error('Supabase is not configured yet.') }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  if (!supabase) return { error: new Error('Supabase is not configured yet.') }
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSavedGifts(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data } = await supabase.from('saved_gifts').select('product_id').eq('user_id', userId)
  return data?.map((row) => row.product_id) ?? []
}

export async function toggleSavedGift(userId: string, productId: string, saved: boolean) {
  if (!supabase) return
  if (saved) {
    await supabase.from('saved_gifts').delete().eq('user_id', userId).eq('product_id', productId)
  } else {
    await supabase.from('saved_gifts').upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' })
  }
}
