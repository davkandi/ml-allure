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

// Refunds table - Track order refunds
export const refunds = sqliteTable('refunds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  amount: real('amount').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull(), // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  refundMethod: text('refund_method'), // 'MOBILE_MONEY', 'CASH', 'STORE_CREDIT'
  transactionReference: text('transaction_reference'),
  processedBy: integer('processed_by').references(() => users.id),
  processedAt: integer('processed_at'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  orderIdx: index('refunds_order_idx').on(table.orderId),
  statusIdx: index('refunds_status_idx').on(table.status),
}));

// Returns (RMA) table - Track product returns
export const returns = sqliteTable('returns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rmaNumber: text('rma_number').notNull().unique(), // Format: "RMA-YYYYMMDD-XXXX"
  orderId: integer('order_id').references(() => orders.id),
  customerId: integer('customer_id').references(() => customers.id),
  status: text('status').notNull(), // 'REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'COMPLETED'
  reason: text('reason').notNull(),
  description: text('description'),
  refundId: integer('refund_id').references(() => refunds.id),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: integer('approved_at'),
  receivedBy: integer('received_by').references(() => users.id),
  receivedAt: integer('received_at'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  rmaNumberIdx: index('returns_rma_number_idx').on(table.rmaNumber),
  orderIdx: index('returns_order_idx').on(table.orderId),
  customerIdx: index('returns_customer_idx').on(table.customerId),
  statusIdx: index('returns_status_idx').on(table.status),
}));

// Return Items table - Individual items in a return
export const returnItems = sqliteTable('return_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  returnId: integer('return_id').references(() => returns.id),
  orderItemId: integer('order_item_id').references(() => orderItems.id),
  variantId: integer('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  condition: text('condition'), // 'UNOPENED', 'OPENED_UNUSED', 'DEFECTIVE', 'DAMAGED'
  restockable: integer('restockable', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  returnIdx: index('return_items_return_idx').on(table.returnId),
}));

// Promotions table - Discount codes and promotional campaigns
export const promotions = sqliteTable('promotions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'
  value: real('value').notNull(), // Percentage (0-100) or fixed amount
  minOrderValue: real('min_order_value'),
  maxDiscount: real('max_discount'), // Max discount for percentage-based
  usageLimit: integer('usage_limit'), // Total times can be used
  usageCount: integer('usage_count').default(0),
  perUserLimit: integer('per_user_limit'), // Times per customer
  startDate: integer('start_date').notNull(),
  endDate: integer('end_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  codeIdx: index('promotions_code_idx').on(table.code),
  activeIdx: index('promotions_active_idx').on(table.isActive, table.startDate, table.endDate),
}));

// Promotion Usage table - Track who used which promotions
export const promotionUsage = sqliteTable('promotion_usage', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  promotionId: integer('promotion_id').references(() => promotions.id),
  orderId: integer('order_id').references(() => orders.id),
  customerId: integer('customer_id').references(() => customers.id),
  discountAmount: real('discount_amount').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  promotionIdx: index('promotion_usage_promotion_idx').on(table.promotionId),
  customerIdx: index('promotion_usage_customer_idx').on(table.customerId),
}));

// Email Templates table - Configurable email templates
export const emailTemplates = sqliteTable('email_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(), // 'ORDER_CONFIRMATION', 'SHIPPING_UPDATE', etc.
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  variables: text('variables', { mode: 'json' }), // Available template variables
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Notifications table - Email/SMS notification log
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'EMAIL', 'SMS'
  recipient: text('recipient').notNull(), // Email or phone
  subject: text('subject'),
  content: text('content').notNull(),
  status: text('status').notNull(), // 'PENDING', 'SENT', 'FAILED'
  provider: text('provider'), // 'SENDGRID', 'TWILIO'
  providerId: text('provider_id'), // External ID from provider
  error: text('error'),
  orderId: integer('order_id').references(() => orders.id),
  customerId: integer('customer_id').references(() => customers.id),
  sentAt: integer('sent_at'),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  statusIdx: index('notifications_status_idx').on(table.status),
  orderIdx: index('notifications_order_idx').on(table.orderId),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}));

// Shipping Integrations table - Track shipments with providers
export const shipments = sqliteTable('shipments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id),
  trackingNumber: text('tracking_number').unique(),
  carrier: text('carrier').notNull(), // 'DHL', 'FEDEX', 'UPS', 'LOCAL'
  service: text('service'), // Service level
  status: text('status').notNull(), // 'PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'
  estimatedDelivery: integer('estimated_delivery'),
  actualDelivery: integer('actual_delivery'),
  recipientName: text('recipient_name'),
  recipientPhone: text('recipient_phone'),
  shippingAddress: text('shipping_address', { mode: 'json' }),
  weight: real('weight'), // In kg
  cost: real('cost'),
  labelUrl: text('label_url'),
  providerResponse: text('provider_response', { mode: 'json' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  trackingIdx: index('shipments_tracking_idx').on(table.trackingNumber),
  orderIdx: index('shipments_order_idx').on(table.orderId),
  statusIdx: index('shipments_status_idx').on(table.status),
}));