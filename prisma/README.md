# ML Allure - Prisma Database Schema

## Overview

This directory contains the comprehensive Prisma schema for the ML Allure fashion e-commerce platform, including:

- **9 Enums**: UserRole, OrderStatus, PaymentMethod, PaymentStatus, DeliveryMethod, OrderSource, TransactionMethod, TransactionStatus, InventoryChangeType
- **10 Models**: User, Customer, Category, Product, ProductVariant, Order, OrderItem, Transaction, InventoryLog
- **Complete relationships** between all models
- **Seed data** including admin user, categories, products, variants, and inventory logs

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database instance. You can use:
   - Local PostgreSQL installation
   - [Supabase](https://supabase.com/) (Free PostgreSQL database)
   - [Neon](https://neon.tech/) (Serverless PostgreSQL)
   - [Railway](https://railway.app/) (PostgreSQL hosting)
   - Docker: `docker run --name ml-allure-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

2. **Database Connection URL**: Format:
   ```
   postgresql://username:password@host:port/database?schema=public
   ```

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file in the project root (or copy from `.env.example`):

```bash
# PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@localhost:5432/ml_allure_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/ml_allure_db?schema=public"
```

**Example for Supabase:**
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

Generate the Prisma Client based on your schema:

```bash
npm run db:generate
```

### 4. Run Database Migration

Create the database tables:

```bash
npm run db:migrate
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your database
- Generate Prisma Client

**Alternative (for quick prototyping):**
```bash
npm run db:push
```
This pushes the schema without creating migration files.

### 5. Seed the Database

Populate your database with initial data:

```bash
npm run db:seed
```

This will create:
- ✅ **1 Admin User**: 
  - Email: `admin@mlallure.com`
  - Password: `Admin123!`
  - Role: `ADMIN`

- ✅ **6 Categories** (French):
  - Hommes (Men's)
  - Femmes (Women's)
  - Accessoires (Accessories)
  - Chaussures (Shoes)
  - Sacs (Bags)
  - Bijoux (Jewelry)

- ✅ **20 Products** with French names and descriptions
- ✅ **60+ Product Variants** with sizes, colors, and stock
- ✅ **Sample Inventory Logs** showing restocks and adjustments

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Generate Client | `npm run db:generate` | Generate Prisma Client from schema |
| Push Schema | `npm run db:push` | Push schema to database (no migrations) |
| Create Migration | `npm run db:migrate` | Create and apply migrations |
| Seed Database | `npm run db:seed` | Populate database with seed data |
| Prisma Studio | `npm run db:studio` | Open Prisma Studio GUI |

## Prisma Studio

Launch the visual database browser:

```bash
npm run db:studio
```

This opens a GUI at `http://localhost:5555` where you can:
- View and edit all your data
- Run queries
- Manage relationships

## Database Schema Overview

### Core Models

#### User
Admin and staff users with role-based access:
- `ADMIN` - Full system access
- `INVENTORY_MANAGER` - Inventory management
- `SALES_STAFF` - POS and order management
- `CUSTOMER` - Basic customer access

#### Customer
Customer records (both registered and guest):
- Links to User for registered customers
- Supports guest checkout
- Stores multiple addresses as JSON

#### Product & ProductVariant
Product hierarchy with variants:
- Products have base information
- Variants store size, color, stock, and pricing
- Each variant has unique SKU
- Supports additional pricing per variant

#### Order & OrderItem
Complete order management:
- Multiple payment methods (Mobile Money, Cash on Delivery)
- Delivery methods (Home Delivery, Store Pickup)
- Order source tracking (Online, In-Store)
- Item snapshots preserve pricing history

#### Transaction
Payment tracking and verification:
- Mobile money providers (M-Pesa, Airtel Money, Orange Money)
- Verification workflow with user tracking
- Transaction status monitoring

#### InventoryLog
Complete inventory audit trail:
- SALE, RESTOCK, ADJUSTMENT, RETURN operations
- Links to orders for automatic tracking
- Stores previous/new quantities
- Admin user tracking

## Data Examples

### Seeded Products Include:

**Hommes (Men's):**
- Costume Élégant Noir - $450
- Chemise Blanche Classic - $85
- Pantalon Chino Beige - $95
- Veste en Cuir Marron - $320

**Femmes (Women's):**
- Robe Soirée Rouge - $280
- Blouse en Soie Crème - $120
- Manteau Long Camel - $380

**Accessoires:**
- Ceinture en Cuir Italien - $65
- Écharpe en Cachemire - $145

**Chaussures:**
- Mocassins en Cuir Noir - $180
- Escarpins Rouges - $165
- Baskets Blanches Premium - $140

**Sacs:**
- Sac à Main en Cuir Caramel - $295
- Sac à Dos en Toile - $125

**Bijoux:**
- Collier en Or Rose - $350
- Bracelet en Argent - $125

## Using Prisma Client in Your Code

### Import and Initialize

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

### Example Queries

**Get all products with variants:**
```typescript
const products = await prisma.product.findMany({
  include: {
    category: true,
    variants: true,
  },
});
```

**Create an order:**
```typescript
const order = await prisma.order.create({
  data: {
    orderNumber: 'MLA-20250123-0001',
    customerId: customer.id,
    status: 'PENDING',
    paymentMethod: 'MOBILE_MONEY',
    paymentStatus: 'PENDING',
    deliveryMethod: 'HOME_DELIVERY',
    deliveryFee: 10.00,
    subtotal: 450.00,
    total: 460.00,
    source: 'ONLINE',
    orderItems: {
      create: [
        {
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          priceAtPurchase: 450.00,
          productName: 'Costume Élégant Noir',
          variantDetails: { size: 'M', color: 'Noir' },
        },
      ],
    },
  },
});
```

**Track inventory changes:**
```typescript
const inventoryLog = await prisma.inventoryLog.create({
  data: {
    variantId: variant.id,
    changeType: 'SALE',
    quantityChange: -1,
    previousQuantity: 15,
    newQuantity: 14,
    reason: 'Sold via online order',
    performedBy: user.id,
    orderId: order.id,
  },
});
```

## Troubleshooting

### Migration Issues

If you encounter migration errors:

```bash
# Reset database (⚠️ WARNING: Deletes all data)
npx prisma migrate reset

# Then re-seed
npm run db:seed
```

### Connection Issues

- Verify your `DATABASE_URL` is correct
- Check if PostgreSQL is running
- Ensure database exists
- Verify network access and firewall settings

### Type Issues

If TypeScript doesn't recognize Prisma types:

```bash
npm run db:generate
```

Then restart your TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## Migration Files

Migrations are stored in `prisma/migrations/` and track schema changes over time. Each migration includes:
- SQL commands to apply changes
- Timestamp and name
- Complete audit trail

## Production Deployment

### 1. Apply Migrations

```bash
npx prisma migrate deploy
```

### 2. Generate Client

```bash
npx prisma generate
```

### 3. (Optional) Seed Data

```bash
npm run db:seed
```

## Best Practices

1. **Always use transactions** for operations affecting multiple tables
2. **Include soft deletes** for important records (add `deletedAt` field)
3. **Use connection pooling** in production (PgBouncer)
4. **Monitor query performance** with Prisma logging
5. **Keep migrations** in version control
6. **Test migrations** in staging before production

## Support

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Discord](https://discord.gg/prisma)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## License

Proprietary - ML Allure Platform
