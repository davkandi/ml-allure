# Order Processing API Documentation

## Overview
Comprehensive order processing API for ML Allure platform with stock management, delivery fee calculation, and atomic transactions using Prisma.

---

## **POST /api/orders** (Public/Protected)
Create a new order with automatic stock validation and deduction.

### Request Body
```json
{
  "customerId": "uuid-string", // Optional - for authenticated users
  "guestInfo": { // Required if no customerId
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+243812345678"
  },
  "items": [
    {
      "variantId": "uuid-string",
      "quantity": 2
    }
  ],
  "deliveryMethod": "HOME_DELIVERY", // or "STORE_PICKUP"
  "deliveryAddress": { // Required if HOME_DELIVERY
    "fullAddress": "123 Avenue de la Liberté, Immeuble ABC",
    "zone": "Gombe", // Commune name
    "instructions": "Appeler 30 minutes avant la livraison"
  },
  "paymentMethod": "MOBILE_MONEY", // or "CASH_ON_DELIVERY"
  "paymentReference": "REF123456", // Optional
  "notes": "Livraison urgente", // Optional
  "saveCustomerInfo": true // Optional - for authenticated users
}
```

### Response (Success - 201)
```json
{
  "message": "Commande créée avec succès",
  "orderNumber": "MLA-20250123-0001",
  "order": {
    "id": "uuid",
    "orderNumber": "MLA-20250123-0001",
    "status": "PENDING",
    "subtotal": 150.00,
    "deliveryFee": 5.00,
    "total": 155.00,
    "paymentMethod": "MOBILE_MONEY",
    "paymentStatus": "PENDING",
    "deliveryMethod": "HOME_DELIVERY",
    "deliveryZone": "Gombe",
    "createdAt": "2025-01-23T10:00:00.000Z"
  },
  "items": [
    {
      "id": "uuid",
      "productName": "Robe Élégante",
      "quantity": 2,
      "priceAtPurchase": 75.00,
      "variantDetails": {
        "size": "M",
        "color": "Rouge",
        "colorHex": "#FF0000",
        "sku": "RDE-M-ROU-001"
      }
    }
  ],
  "transaction": {
    "id": "uuid",
    "amount": 155.00,
    "method": "MOBILE_MONEY",
    "provider": "M-Pesa/Airtel/Orange",
    "status": "PENDING"
  },
  "deliveryFeeDetails": {
    "fee": 5.00,
    "zone": "Gombe",
    "currency": "USD",
    "isFree": false,
    "freeDeliveryThreshold": 100
  },
  "paymentInstructions": {
    "message": "Veuillez effectuer le paiement via Mobile Money",
    "providers": [
      "M-Pesa: +243 XXX XXX XXX",
      "Airtel Money: +243 XXX XXX XXX",
      "Orange Money: +243 XXX XXX XXX"
    ],
    "reference": "MLA-20250123-0001"
  }
}
```

### Error Responses

#### Stock Error (400)
```json
{
  "message": "Articles non disponibles en stock:\nRobe Élégante (M, Rouge) - Stock disponible: 1",
  "type": "STOCK_ERROR"
}
```

#### Validation Error (400)
```json
{
  "message": "Données invalides",
  "errors": [
    {
      "field": "items",
      "message": "Au moins un article est requis"
    },
    {
      "field": "deliveryAddress",
      "message": "L'adresse de livraison est requise pour la livraison à domicile"
    }
  ]
}
```

---

## **GET /api/orders** (Protected)
Get all orders (filtered by user role).

### Headers
```
Authorization: Bearer <token>
```

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by order status
- `paymentStatus`: Filter by payment status

### Response (200)
```json
{
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "MLA-20250123-0001",
      "status": "PENDING",
      "total": 155.00,
      "customer": {
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@example.com"
      },
      "createdAt": "2025-01-23T10:00:00.000Z"
    }
  ]
}
```

---

## **GET /api/orders/:id** (Protected)
Get order details by ID.

### Headers
```
Authorization: Bearer <token>
```

### Response (200)
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "MLA-20250123-0001",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "subtotal": 150.00,
    "deliveryFee": 5.00,
    "total": 155.00,
    "customer": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+243812345678"
    },
    "items": [...],
    "deliveryAddress": {...},
    "createdAt": "2025-01-23T10:00:00.000Z"
  }
}
```

---

## **PUT /api/orders/:id** (Admin/Staff Only)
Update order status.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "status": "CONFIRMED", // PENDING, CONFIRMED, PROCESSING, READY_FOR_PICKUP, SHIPPED, DELIVERED, CANCELLED
  "paymentStatus": "PAID", // Optional: PENDING, PAID, FAILED, REFUNDED
  "notes": "Commande confirmée et en préparation" // Optional
}
```

### Response (200)
```json
{
  "message": "Commande mise à jour avec succès",
  "order": {...}
}
```

---

## **DELETE /api/orders/:id** (Admin Only)
Delete an order.

### Headers
```
Authorization: Bearer <token>
```

### Response (200)
```json
{
  "message": "Order deleted successfully"
}
```

---

## Delivery Fee Calculation

### Zones and Fees (USD)
| Zone | Fee | Free Delivery Threshold |
|------|-----|------------------------|
| Gombe | $5 | $100+ |
| Kinshasa | $7 | $100+ |
| Ngaliema | $6 | $100+ |
| Kalamu | $6 | $100+ |
| Kasa-Vubu | $6 | $100+ |
| Limete | $6 | $100+ |
| Lingwala | $6 | $100+ |
| Barumbu | $6 | $100+ |
| Lemba | $8 | $100+ |
| Matete | $8 | $100+ |
| Ngiri-Ngiri | $8 | $100+ |
| Bumbu | $8 | $100+ |
| Makala | $8 | $100+ |
| Selembao | $8 | $100+ |
| Kimbanseke | $9 | $100+ |
| Masina | $9 | $100+ |
| N'djili | $9 | $100+ |
| Mont-Ngafula | $9 | $100+ |
| Others | $10 | $100+ |

### Store Pickup
- **Fee**: $0 (Free)
- **Location**: ML Allure Store, Gombe

---

## Validation Rules

### Phone Number
- Format: `+243XXXXXXXXX` or `0XXXXXXXXX`
- Example: `+243812345678`

### Email
- Valid email format required
- Example: `client@example.com`

### Items
- Minimum: 1 item
- Maximum: 50 items per order
- Each item requires:
  - Valid `variantId` (UUID)
  - `quantity` between 1-100

### Delivery Address
- Required if `deliveryMethod` is `HOME_DELIVERY`
- `fullAddress`: 10-500 characters
- `zone`: 2-100 characters (commune name)
- `instructions`: Optional, max 500 characters

---

## Transaction Flow

1. **Validate Request** - Zod schema validation
2. **Handle Customer** - Create guest or use existing customer
3. **Check Stock** - Validate all items are available
4. **Calculate Totals** - Subtotal + delivery fee
5. **Generate Order Number** - Format: `MLA-YYYYMMDD-XXXX`
6. **Create Order** - Atomic transaction
7. **Create Order Items** - With price snapshots
8. **Deduct Stock** - Update variant quantities
9. **Create Inventory Logs** - SALE type entries
10. **Create Transaction Record** - PENDING status
11. **Return Response** - With payment instructions

### Atomic Transaction
All operations wrapped in Prisma transaction. If any step fails, entire operation rolls back.

---

## Error Handling

### Stock Unavailable
- Returns list of unavailable items with current stock
- Transaction rolled back
- HTTP 400

### Invalid Data
- Zod validation errors
- Field-specific error messages in French
- HTTP 400

### Not Found
- Customer not found
- Variant not found
- HTTP 404

### Database Errors
- Automatic rollback
- Generic error message
- HTTP 500

---

## Order Number Format
```
MLA-YYYYMMDD-XXXX
```
- **MLA**: ML Allure prefix
- **YYYYMMDD**: Date (e.g., 20250123)
- **XXXX**: Random 4-digit number (0001-9999)
- **Uniqueness**: Verified in database, regenerates if collision

---

## Payment Instructions

### Mobile Money
```json
{
  "message": "Veuillez effectuer le paiement via Mobile Money",
  "providers": [
    "M-Pesa: +243 XXX XXX XXX",
    "Airtel Money: +243 XXX XXX XXX",
    "Orange Money: +243 XXX XXX XXX"
  ],
  "reference": "MLA-20250123-0001"
}
```

### Cash on Delivery
```json
{
  "message": "Paiement à la livraison",
  "note": "Veuillez préparer le montant exact"
}
```

---

## Testing

### Create Order (Guest)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "guestInfo": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "phone": "+243812345678"
    },
    "items": [
      {
        "variantId": "uuid-here",
        "quantity": 2
      }
    ],
    "deliveryMethod": "HOME_DELIVERY",
    "deliveryAddress": {
      "fullAddress": "123 Avenue de la Liberté",
      "zone": "Gombe",
      "instructions": "Appeler avant"
    },
    "paymentMethod": "MOBILE_MONEY"
  }'
```

### Get All Orders (Authenticated)
```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Order Status (Admin)
```bash
curl -X PUT http://localhost:5000/api/orders/ORDER_UUID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED",
    "paymentStatus": "PAID"
  }'
```

---

## Security Features

- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Atomic transactions (all-or-nothing)
- ✅ Stock validation before deduction
- ✅ Role-based access control
- ✅ Error message sanitization
- ✅ French error messages for users

---

## Database Schema

### Order
- UUID primary key
- Unique order number
- Status tracking
- Payment information
- Delivery details
- Timestamps

### OrderItem
- Links to Order, Product, Variant
- Price snapshot at purchase time
- Product/variant details snapshot
- Quantity

### Transaction
- Links to Order
- Amount, method, provider
- Status tracking
- Verification info

### InventoryLog
- Links to Variant and Order
- Change type (SALE)
- Quantity changes
- Audit trail

---

## Files Created

1. **server/schemas/orderSchemas.ts** - Zod validation schemas
2. **server/utils/calculateDeliveryFee.ts** - Delivery fee logic
3. **server/controllers/order.controller.ts** - Order business logic
4. **server/routes/order.routes.ts** - Order API routes
5. **server/config/prisma.ts** - Prisma client singleton
6. **server/docs/ORDER_API.md** - This documentation

---

## Integration Notes

- Compatible with existing checkout flow at `/caisse`
- Uses Prisma schema from `prisma/schema.prisma`
- Integrates with inventory management system
- Supports both guest and authenticated orders
- Automatic stock deduction on order creation
- Inventory logs for audit trail
- Transaction records for payment tracking

---

## Next Steps

1. ✅ Order creation API implemented
2. ✅ Stock validation and deduction
3. ✅ Delivery fee calculation
4. ✅ Inventory logging
5. ✅ Transaction records
6. 🔄 Email notifications (optional)
7. 🔄 SMS notifications (optional)
8. 🔄 Payment provider integration (optional)
9. 🔄 Order tracking page (frontend)
10. 🔄 Admin order management dashboard

---

**Created**: 2025-01-23  
**Version**: 1.0.0  
**Author**: ML Allure Development Team
