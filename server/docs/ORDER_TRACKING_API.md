# Order Tracking API Documentation

## Overview

Complete order tracking system with public guest tracking, protected customer orders with filtering/pagination, and status history tracking.

---

## Endpoints

### 1. Track Order by Number (Public with Validation)

**GET** `/api/orders/track/:orderNumber`

Track an order using its order number. Requires email or phone verification for security.

**Parameters:**
- `orderNumber` (path, required): Order number (e.g., "MLA-20250123-0001")

**Query Parameters (at least one required):**
- `email` (string, optional): Customer email address
- `phone` (string, optional): Customer phone number (format: +243XXXXXXXXX)

**Response:** `200 OK`
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "MLA-20250123-0001",
    "status": "CONFIRMED",
    "paymentMethod": "MOBILE_MONEY",
    "paymentStatus": "PENDING",
    "deliveryMethod": "HOME_DELIVERY",
    "deliveryAddress": {
      "fullAddress": "123 Avenue Kalemie",
      "zone": "Gombe",
      "instructions": "Appeler en arrivant"
    },
    "deliveryZone": "Gombe",
    "deliveryFee": 5.00,
    "subtotal": 150.00,
    "total": 155.00,
    "notes": null,
    "createdAt": "2025-01-23T10:00:00Z",
    "updatedAt": "2025-01-23T10:30:00Z",
    "completedAt": null,
    "customer": {
      "firstName": "Jean",
      "lastName": "Kabongo",
      "email": "jean@example.com",
      "phone": "+243123456789"
    },
    "items": [
      {
        "id": "item-uuid",
        "productId": "product-uuid",
        "productName": "Chemise Homme Élégante",
        "quantity": 2,
        "priceAtPurchase": 75.00,
        "variant": {
          "size": "M",
          "color": "Bleu Marine",
          "colorHex": "#001f3f",
          "sku": "CHM-001-M-BLU"
        },
        "product": {
          "name": "Chemise Homme Élégante",
          "slug": "chemise-homme-elegante",
          "images": ["url1", "url2"]
        }
      }
    ],
    "statusHistory": [
      {
        "id": "history-uuid",
        "fromStatus": null,
        "toStatus": "PENDING",
        "notes": "Commande créée",
        "createdAt": "2025-01-23T10:00:00Z",
        "changedBy": null
      },
      {
        "id": "history-uuid-2",
        "fromStatus": "PENDING",
        "toStatus": "CONFIRMED",
        "notes": "Commande confirmée par admin",
        "createdAt": "2025-01-23T10:30:00Z",
        "changedBy": {
          "name": "Admin User"
        }
      }
    ],
    "paymentInfo": {
      "method": "MOBILE_MONEY",
      "status": "PENDING"
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Missing or invalid email/phone
```json
{
  "message": "Validation échouée",
  "errors": [
    {
      "field": "email",
      "message": "Email ou numéro de téléphone requis pour la vérification"
    }
  ]
}
```

`403 Forbidden` - Email/phone doesn't match
```json
{
  "message": "Email ou numéro de téléphone ne correspond pas"
}
```

`404 Not Found` - Order not found
```json
{
  "message": "Commande introuvable",
  "orderNumber": "MLA-20250123-0001"
}
```

**Example Requests:**

```bash
# Track with email
curl "http://localhost:5000/api/orders/track/MLA-20250123-0001?email=jean@example.com"

# Track with phone
curl "http://localhost:5000/api/orders/track/MLA-20250123-0001?phone=%2B243123456789"
```

---

### 2. Get Customer Orders (Protected)

**GET** `/api/orders/customer/:customerId`

Get all orders for a specific customer with filtering and pagination.

**Authentication:** Required (Bearer token)

**Parameters:**
- `customerId` (path, required): Customer UUID

**Query Parameters:**
- `status` (string, optional): Filter by order status
  - Values: `PENDING`, `CONFIRMED`, `PROCESSING`, `READY_FOR_PICKUP`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- `startDate` (ISO datetime, optional): Filter orders from this date
- `endDate` (ISO datetime, optional): Filter orders until this date
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 10): Items per page

**Response:** `200 OK`
```json
{
  "orders": [
    {
      "id": "order-uuid",
      "orderNumber": "MLA-20250123-0001",
      "status": "DELIVERED",
      "paymentStatus": "PAID",
      "paymentMethod": "MOBILE_MONEY",
      "deliveryMethod": "HOME_DELIVERY",
      "subtotal": 150.00,
      "deliveryFee": 5.00,
      "total": 155.00,
      "itemCount": 2,
      "createdAt": "2025-01-23T10:00:00Z",
      "updatedAt": "2025-01-24T15:00:00Z",
      "completedAt": "2025-01-24T15:00:00Z",
      "items": [
        {
          "id": "item-uuid",
          "productName": "Chemise Homme Élégante",
          "quantity": 2,
          "priceAtPurchase": 75.00,
          "variant": {
            "size": "M",
            "color": "Bleu Marine",
            "colorHex": "#001f3f"
          },
          "product": {
            "name": "Chemise Homme Élégante",
            "slug": "chemise-homme-elegante",
            "images": ["url1", "url2"]
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 15,
    "totalPages": 2,
    "hasMore": true
  }
}
```

**Example Requests:**

```bash
# Get all orders for customer
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders/customer/customer-uuid"

# Filter by status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders/customer/customer-uuid?status=DELIVERED"

# Filter by date range
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders/customer/customer-uuid?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"

# With pagination
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders/customer/customer-uuid?page=2&limit=5"

# Combined filters
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders/customer/customer-uuid?status=DELIVERED&page=1&limit=10"
```

---

### 3. Get Order Status History (Protected)

**GET** `/api/orders/:orderId/status-history`

Get complete status history timeline for an order.

**Authentication:** Required (Bearer token)

**Parameters:**
- `orderId` (path, required): Order UUID

**Response:** `200 OK`
```json
{
  "orderNumber": "MLA-20250123-0001",
  "currentStatus": "DELIVERED",
  "timeline": [
    {
      "id": "history-uuid-1",
      "fromStatus": null,
      "toStatus": "PENDING",
      "timestamp": "2025-01-23T10:00:00Z",
      "notes": "Commande créée",
      "changedBy": {
        "name": "Système",
        "email": null,
        "role": null
      }
    },
    {
      "id": "history-uuid-2",
      "fromStatus": "PENDING",
      "toStatus": "CONFIRMED",
      "timestamp": "2025-01-23T10:30:00Z",
      "notes": "Commande confirmée par admin",
      "changedBy": {
        "name": "Admin User",
        "email": "admin@mlallure.com",
        "role": "ADMIN"
      }
    },
    {
      "id": "history-uuid-3",
      "fromStatus": "CONFIRMED",
      "toStatus": "PROCESSING",
      "timestamp": "2025-01-23T14:00:00Z",
      "notes": "Commande en cours de préparation",
      "changedBy": {
        "name": "Staff Member",
        "email": "staff@mlallure.com",
        "role": "INVENTORY_MANAGER"
      }
    },
    {
      "id": "history-uuid-4",
      "fromStatus": "PROCESSING",
      "toStatus": "SHIPPED",
      "timestamp": "2025-01-24T09:00:00Z",
      "notes": "Commande expédiée",
      "changedBy": {
        "name": "Staff Member",
        "email": "staff@mlallure.com",
        "role": "INVENTORY_MANAGER"
      }
    },
    {
      "id": "history-uuid-5",
      "fromStatus": "SHIPPED",
      "toStatus": "DELIVERED",
      "timestamp": "2025-01-24T15:00:00Z",
      "notes": "Commande livrée avec succès",
      "changedBy": {
        "name": "Delivery Staff",
        "email": "delivery@mlallure.com",
        "role": "SALES_STAFF"
      }
    }
  ],
  "totalChanges": 5
}
```

**Error Response:**

`404 Not Found`
```json
{
  "message": "Commande introuvable"
}
```

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders/order-uuid/status-history"
```

---

## Status Workflow

### Home Delivery Flow
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
         ↓            ↓            ↓
      CANCELLED   CANCELLED   CANCELLED
```

### Store Pickup Flow
```
PENDING → CONFIRMED → PROCESSING → READY_FOR_PICKUP → DELIVERED
         ↓            ↓            ↓
      CANCELLED   CANCELLED   CANCELLED
```

---

## Order Status Reference

| Status | French Label | Description |
|--------|-------------|-------------|
| `PENDING` | En attente | Order awaiting confirmation |
| `CONFIRMED` | Confirmée | Order confirmed by staff |
| `PROCESSING` | En préparation | Order being prepared |
| `READY_FOR_PICKUP` | Prête pour retrait | Ready for store pickup |
| `SHIPPED` | Expédiée | Order shipped for delivery |
| `DELIVERED` | Livrée | Order successfully delivered |
| `CANCELLED` | Annulée | Order cancelled |

---

## Security Notes

1. **Public Order Tracking:**
   - Requires email OR phone verification
   - Does not expose sensitive payment details
   - Only shows necessary customer information

2. **Protected Endpoints:**
   - Require valid JWT Bearer token
   - Customer role can only access their own orders
   - Admin/Manager roles can access all orders

3. **Data Privacy:**
   - Payment references are not exposed in tracking
   - Sensitive transaction details are filtered
   - User credentials are never returned

---

## Integration Examples

### React Component - Track Order

```typescript
import { useState } from 'react';

export function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const trackOrder = async () => {
    try {
      const res = await fetch(
        `/api/orders/track/${orderNumber}?email=${encodeURIComponent(email)}`
      );
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      
      const data = await res.json();
      setOrder(data.order);
      setError('');
    } catch (err) {
      setError(err.message);
      setOrder(null);
    }
  };

  return (
    <div>
      <input 
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="Numéro de commande"
      />
      <input 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
      />
      <button onClick={trackOrder}>Suivre</button>
      
      {error && <p className="error">{error}</p>}
      {order && <OrderDetails order={order} />}
    </div>
  );
}
```

### React Component - Customer Orders

```typescript
import { useEffect, useState } from 'react';

export function CustomerOrders({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState<'all' | 'delivered' | 'active'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [filter, page]);

  const fetchOrders = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
    });
    
    if (filter === 'delivered') {
      params.set('status', 'DELIVERED');
    } else if (filter === 'active') {
      // Fetch multiple statuses - make separate calls or use backend enhancement
    }

    const res = await fetch(
      `/api/orders/customer/${customerId}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    
    const data = await res.json();
    setOrders(data.orders);
  };

  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
        <option value="all">Toutes</option>
        <option value="active">En cours</option>
        <option value="delivered">Livrées</option>
      </select>
      
      <div>
        {orders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
```

---

## Testing

Run Prisma migrations first:
```bash
npx prisma migrate dev --name add-order-status-history
npx prisma generate
```

Then test the endpoints:

```bash
# 1. Track order (guest)
curl "http://localhost:5000/api/orders/track/MLA-20250123-0001?email=test@example.com"

# 2. Get customer orders (authenticated)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders/customer/customer-uuid?status=DELIVERED&page=1"

# 3. Get status history (authenticated)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/orders/order-uuid/status-history"
```

---

## Notes

- Status history is automatically created when orders are created or updated
- All timestamps are in ISO 8601 format (UTC)
- Phone numbers must be in Congo format: +243XXXXXXXXX
- Pagination defaults: page=1, limit=10
- Maximum limit per page: 100
