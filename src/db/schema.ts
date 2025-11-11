import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';

// Users table - Authentication and role-based access
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF', 'CUSTOMER'
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Customers table - Both registered and guest customers
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  email: text('email'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  isGuest: integer('is_guest', { mode: 'boolean' }).default(false),
  addresses: text('addresses', { mode: 'json' }), // JSON array
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Categories table - Product categorization
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  displayOrder: integer('display_order'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Products table - Main product information
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id),
  basePrice: real('base_price').notNull(),
  currency: text('currency').default('USD'),
  images: text('images', { mode: 'json' }), // JSON array
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  tags: text('tags', { mode: 'json' }), // JSON array
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  // Index on slug for fast product lookups by URL
  slugIdx: index('products_slug_idx').on(table.slug),
  // Index on categoryId for filtering products by category
  categoryIdx: index('products_category_idx').on(table.categoryId),
  // Index on isActive and isFeatured for homepage queries
  activeIdx: index('products_active_idx').on(table.isActive, table.isFeatured),
}));

// Product Variants table - Size, color, stock variations
export const productVariants = sqliteTable('product_variants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').references(() => products.id),
  sku: text('sku').notNull().unique(),
  size: text('size'),
  color: text('color'),
  colorHex: text('color_hex'),
  stockQuantity: integer('stock_quantity').notNull(),
  additionalPrice: real('additional_price').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  // Index on SKU for fast variant lookups in POS
  skuIdx: index('variants_sku_idx').on(table.sku),
  // Index on productId for loading all variants of a product
  productIdx: index('variants_product_idx').on(table.productId),
  // Index on stock quantity for inventory management
  stockIdx: index('variants_stock_idx').on(table.stockQuantity),
}));

// Orders table - Customer orders
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id),
  status: text('status').notNull(), // 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED'
  paymentMethod: text('payment_method').notNull(), // 'MOBILE_MONEY', 'CASH_ON_DELIVERY'
  paymentStatus: text('payment_status').notNull(), // 'PENDING', 'PAID', 'FAILED', 'REFUNDED'
  paymentReference: text('payment_reference'),
  deliveryMethod: text('delivery_method').notNull(), // 'HOME_DELIVERY', 'STORE_PICKUP'
  deliveryAddress: text('delivery_address', { mode: 'json' }),
  deliveryZone: text('delivery_zone'),
  deliveryFee: real('delivery_fee').notNull(),
  subtotal: real('subtotal').notNull(),
  total: real('total').notNull(),
  source: text('source').notNull(), // 'ONLINE', 'IN_STORE'
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  completedAt: integer('completed_at'),
}, (table) => ({
  // Index on orderNumber for order tracking lookups
  orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
  // Index on customerId for customer order history
  customerIdx: index('orders_customer_idx').on(table.customerId),
  // Index on status and paymentStatus for admin filtering
  statusIdx: index('orders_status_idx').on(table.status, table.paymentStatus),
  // Index on createdAt for date range queries
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
}));

// Order Items table - Line items in orders
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  productId: integer('product_id').references(() => products.id),
  variantId: integer('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: real('price_at_purchase').notNull(),
  productName: text('product_name').notNull(),
  variantDetails: text('variant_details', { mode: 'json' }),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  // Index on orderId for loading order items
  orderIdx: index('order_items_order_idx').on(table.orderId),
}));

// Transactions table - Payment transactions
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  amount: real('amount').notNull(),
  method: text('method').notNull(), // 'MOBILE_MONEY', 'CASH'
  provider: text('provider'), // 'M-Pesa', 'Airtel Money', 'Orange Money'
  reference: text('reference'),
  status: text('status').notNull(), // 'PENDING', 'COMPLETED', 'FAILED'
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: integer('verified_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  // Index on orderId for payment lookups
  orderIdx: index('transactions_order_idx').on(table.orderId),
  // Index on status for admin filtering
  statusIdx: index('transactions_status_idx').on(table.status),
  // Index on reference for payment verification
  referenceIdx: index('transactions_reference_idx').on(table.reference),
}));

// Inventory Logs table - Track stock changes
export const inventoryLogs = sqliteTable('inventory_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  variantId: integer('variant_id').references(() => productVariants.id),
  changeType: text('change_type').notNull(), // 'SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN'
  quantityChange: integer('quantity_change').notNull(),
  previousQuantity: integer('previous_quantity').notNull(),
  newQuantity: integer('new_quantity').notNull(),
  reason: text('reason'),
  performedBy: integer('performed_by').references(() => users.id),
  orderId: integer('order_id').references(() => orders.id),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  // Index on variantId for variant history
  variantIdx: index('inventory_logs_variant_idx').on(table.variantId),
  // Index on createdAt for date range queries
  createdAtIdx: index('inventory_logs_created_at_idx').on(table.createdAt),
}));