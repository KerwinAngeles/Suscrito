
export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'
export type ActivityKind =
  | 'created'
  | 'price_change'
  | 'charge'
  | 'cancelled'
  | 'reactivated'
  | 'paused'
  | 'resumed'

export type Currency = '€' | '$' | '£'
export type PreferredView = 'month' | 'year'

export type Profile = {
  id: string
  display_name: string | null
  currency: Currency
  monthly_budget: number
  preferred_view: PreferredView
  remind_days: number
  unused_days: number
  alert_hikes: boolean
  alert_unused: boolean
  alert_trials: boolean
  created_at: string
  updated_at: string
}

export type Subscription = {
  id: string
  user_id: string
  name: string
  category: string
  amount: number
  cycle: BillingCycle
  next_charge: string
  last_used_on: string
  started_on: string
  status: SubscriptionStatus
  cancelled_at: string | null
  website: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type SubscriptionMetrics = Subscription & {
  monthly_amount: number
  yearly_amount: number
  days_until_charge: number
  days_since_use: number
}

export type SubscriptionPrice = {
  id: string
  subscription_id: string
  user_id: string
  amount: number
  effective_from: string
  created_at: string
}

export type ActivityEntry = {
  id: string
  user_id: string
  subscription_id: string | null
  subscription_name: string
  kind: ActivityKind
  description: string
  created_at: string
}

export type MonthlySpendRow = {
  month: string
  total: number
}

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] }

export type Database = {
  public: {
    Tables: {
      profiles: Row<Profile>
      subscriptions: Row<Subscription>
      subscription_prices: Row<SubscriptionPrice>
      activity_log: Row<ActivityEntry>
    }
    Views: {
      subscription_metrics: { Row: SubscriptionMetrics; Relationships: [] }
    }
    Functions: {
      monthly_spend_history: {
        Args: { p_months?: number }
        Returns: MonthlySpendRow[]
      }
      seed_demo_subscriptions: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: {
      billing_cycle: BillingCycle
      subscription_status: SubscriptionStatus
      activity_kind: ActivityKind
    }
    CompositeTypes: Record<string, never>
  }
}
