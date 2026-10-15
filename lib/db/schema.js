import { pgSchema, integer, bigint, text, boolean, jsonb, timestamp, uuid, primaryKey } from 'drizzle-orm/pg-core';

export const store = pgSchema('stoffels');
export const categories = store.table('categories', {
  slug: text('slug').primaryKey(), name: text('name').notNull(), count: integer('product_count').notNull(),
});
export const products = store.table('products', {
  id: integer('id').primaryKey(), slug: text('slug').notNull().unique(), name: text('name').notNull(),
  priceCents: bigint('price_cents',{mode:'number'}).notNull(), originalPriceCents: bigint('original_price_cents',{mode:'number'}).notNull(),
  brand: text('brand').notNull(), model: text('model').notNull(), available: boolean('available').notNull(),
  categorySlug: text('category_slug').notNull().references(()=>categories.slug),
  stockQuantity: integer('stock_quantity'),
  catalog: jsonb('catalog').notNull(), details: jsonb('details').notNull(),
  updatedAt: timestamp('updated_at',{withTimezone:true}).defaultNow().notNull(),
});
export const productImages = store.table('product_images', {
  productId: integer('product_id').notNull().references(()=>products.id),
  path: text('path').notNull(), position: integer('position').notNull(),
}, t=>[primaryKey({columns:[t.productId,t.path]})]);
export const orders = store.table('orders', {
  id: uuid('id').primaryKey().defaultRandom(), accessTokenHash: text('access_token_hash').notNull(),
  status: text('status').notNull().default('pending'), currency: text('currency').notNull().default('BRL'),
  subtotalCents: bigint('subtotal_cents',{mode:'number'}).notNull(), shippingCents: bigint('shipping_cents',{mode:'number'}).notNull(),
  totalCents: bigint('total_cents',{mode:'number'}).notNull(), shippingMethod: text('shipping_method'),
  customerName: text('customer_name'), customerEmail: text('customer_email'), address: jsonb('address'),
  checkoutUrl: text('checkout_url'), transactionNsu: text('transaction_nsu').unique(),
  createdAt: timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
  paidAt: timestamp('paid_at',{withTimezone:true}),
});
export const orderItems = store.table('order_items', {
  orderId: uuid('order_id').notNull().references(()=>orders.id), productId: integer('product_id').notNull().references(()=>products.id),
  quantity: integer('quantity').notNull(), unitPriceCents: bigint('unit_price_cents',{mode:'number'}).notNull(), name: text('name').notNull(),
}, t=>[primaryKey({columns:[t.orderId,t.productId]})]);
export const paymentEvents = store.table('payment_events', {
  id: uuid('id').primaryKey().defaultRandom(), orderId: uuid('order_id').notNull().references(()=>orders.id),
  transactionNsu: text('transaction_nsu').notNull().unique(), captureMethod: text('capture_method').notNull(),
  amountCents: bigint('amount_cents',{mode:'number'}).notNull(), verified: boolean('verified').notNull().default(false),
  payload: jsonb('payload').notNull(), receivedAt: timestamp('received_at',{withTimezone:true}).defaultNow().notNull(),
});
export const users = store.table('users', {
  id: uuid('id').primaryKey().defaultRandom(), name:text('name').notNull(), email:text('email').notNull().unique(),
  passwordHash:text('password_hash').notNull(), role:text('role').notNull().default('customer'),
  createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
});
export const sessions = store.table('sessions', {
  tokenHash:text('token_hash').primaryKey(),userId:uuid('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
  expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
});
export const authLimits = store.table('auth_limits', {
  key:text('key').primaryKey(),attempts:integer('attempts').notNull(),windowStart:timestamp('window_start',{withTimezone:true}).defaultNow().notNull(),
});
