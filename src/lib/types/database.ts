export type UserRole = 'admin' | 'cashier' | 'waiter'
export type TableStatus = 'available' | 'occupied' | 'reserved'
export type OrderStatus = 'open' | 'closed' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'split'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Table {
  id: string
  table_number: string
  capacity: number
  status: TableStatus
  position_x?: number
  position_y?: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  category_id: string
  name: string
  description?: string
  price: number
  is_available: boolean
  image_url?: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  table_id: string
  waiter_id: string
  status: OrderStatus
  subtotal: number
  tax_amount: number
  total_amount: number
  payment_method?: PaymentMethod
  opened_at: string
  closed_at?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  order_id: string
  payment_method: PaymentMethod
  cash_amount: number
  card_amount: number
  total_amount: number
  paid_at: string
  created_at: string
}

// With relations
export interface OrderWithDetails extends Order {
  table: Table
  waiter: Profile
  order_items: (OrderItem & { product: Product })[]
}
