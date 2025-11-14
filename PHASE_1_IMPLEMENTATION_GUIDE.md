# PHASE 1 IMPLEMENTATION GUIDE
## ML Allure E-commerce Platform - Production Readiness

**Total Effort:** 310 hours (4 weeks)
**Completed:** ~30 hours (10%)
**Remaining:** ~280 hours (90%)
**Updated:** November 14, 2025

---

## ✅ COMPLETED TASKS (30 hours)

### Week 1: Security Hardening
- [x] Fix JWT token verification in middleware (4h)
- [x] Create authentication utilities library (4h)
- [x] Add authentication to inventory APIs (8h)
- [x] Install jose library for Edge JWT verification (1h)

### Week 2: AWS Infrastructure
- [x] Create .gitignore file (1h)
- [x] Create .env.example with all variables (2h)
- [x] Create production Dockerfile (4h)
- [x] Create .dockerignore (1h)
- [x] Create docker-compose.yml (3h)
- [x] Initial commit and documentation (2h)

**Total Completed:** 30 hours

---

## 🔄 REMAINING TASKS (280 hours)

### WEEK 1: Security Hardening (47 hours remaining)

#### 1. Add Authentication to Orders APIs (12h)
**Files to modify:**
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[orderId]/status/route.ts`
- `src/app/api/orders/[orderId]/payment/route.ts`

**Implementation:**
```typescript
// src/app/api/orders/route.ts
import { requireAuth, requireRoles, createAuthErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Customers can only see their own orders
  // Admin/Staff can see all orders
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;

  // Build query based on role
  let query = db.select().from(orders);

  if (user.role === 'CUSTOMER') {
    // Customers only see their own orders
    query = query.where(eq(orders.customerId, user.id));
  }
  // Admin/Staff see all orders (no filter)

  const results = await query;
  return NextResponse.json({ orders: results });
}

export async function POST(request: NextRequest) {
  // Any authenticated user can create orders
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;

  // ... rest of order creation logic
  // Use user.id for audit trails
}
```

**Status Route:**
```typescript
// src/app/api/orders/[orderId]/status/route.ts
import { requireRoles, createAuthErrorResponse } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  // Only ADMIN and STAFF can change order status
  const authCheck = requireRoles(request, ['ADMIN', 'STAFF', 'SALES_STAFF']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Insufficient permissions',
      403
    );
  }

  const user = authCheck.authResult.user!;

  // ... rest of status update logic
  // Log who made the change: user.id
}
```

**Payment Route:**
```typescript
// src/app/api/orders/[orderId]/payment/route.ts
import { requireAuth, createAuthErrorResponse } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;

  // Verify user owns this order (IDOR protection)
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, parseInt(params.orderId))
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (user.role === 'CUSTOMER' && order.customerId !== user.id) {
    return createAuthErrorResponse('You can only pay for your own orders', 403);
  }

  // ... rest of payment logic
}
```

---

#### 2. Add Authentication to Products APIs (8h)
**Files to modify:**
- `src/app/api/products/route.ts` (POST, PUT, DELETE methods)
- `src/app/api/products/[productId]/route.ts`
- `src/app/api/products/[productId]/variants/route.ts`

**Implementation:**
```typescript
// src/app/api/products/route.ts
export async function GET(request: NextRequest) {
  // Public endpoint - no auth required for viewing products
  // ... existing code
}

export async function POST(request: NextRequest) {
  // Only ADMIN can create products
  const authCheck = requireRoles(request, ['ADMIN']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Only administrators can create products',
      403
    );
  }

  const user = authCheck.authResult.user!;

  // ... rest of product creation
  // Add createdBy: user.id to audit trail
}

export async function PUT(request: NextRequest) {
  // Only ADMIN can update products
  const authCheck = requireRoles(request, ['ADMIN']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Only administrators can update products',
      403
    );
  }

  // ... rest of update logic
}

export async function DELETE(request: NextRequest) {
  // Only ADMIN can delete products
  const authCheck = requireRoles(request, ['ADMIN']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Only administrators can delete products',
      403
    );
  }

  // ... rest of delete logic
}
```

---

#### 3. Add Authentication to Payments APIs (8h)
**Files to modify:**
- `src/app/api/payments/initiate/route.ts`
- `src/app/api/payments/verify/route.ts`

**Implementation:**
```typescript
// src/app/api/payments/initiate/route.ts
import { requireAuth, createAuthErrorResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;
  const body = await request.json();
  const { orderId, phoneNumber, provider } = body;

  // Verify user owns this order
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId)
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (user.role === 'CUSTOMER' && order.customerId !== user.id) {
    return createAuthErrorResponse('You can only pay for your own orders', 403);
  }

  // ... rest of payment initiation logic
}
```

```typescript
// src/app/api/payments/verify/route.ts
export async function POST(request: NextRequest) {
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;

  // ... verification logic with user.id for audit
}
```

---

#### 4. Fix File Upload Validation Bypass (3h)
**File to modify:**
- `src/app/api/upload/image/route.ts`

**Current Vulnerability:**
```typescript
// VULNERABLE - Extension comes from filename, MIME can be spoofed
const extension = file.name.split(".").pop() || "jpg";
```

**Fixed Implementation:**
```typescript
// File: src/app/api/upload/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireRoles, createAuthErrorResponse } from "@/lib/auth";

const ALLOWED_MIME_TYPES = new Map([
  ['image/jpeg', ['jpg', 'jpeg']],
  ['image/png', ['png']],
  ['image/webp', ['webp']],
  ['image/gif', ['gif']]
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  // SECURITY FIX: Require authentication
  const authCheck = requireRoles(request, ['ADMIN', 'STAFF']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Unauthorized file upload',
      403
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // SECURITY FIX: Validate MIME type
    if (!file.type || !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 }
      );
    }

    // SECURITY FIX: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // SECURITY FIX: Get extension from MIME type, not filename
    const allowedExtensions = ALLOWED_MIME_TYPES.get(file.type) || [];
    const safeExtension = allowedExtensions[0];

    // SECURITY FIX: Validate filename extension matches MIME type
    const filenameExtension = file.name.split(".").pop()?.toLowerCase();
    if (!filenameExtension || !allowedExtensions.includes(filenameExtension)) {
      return NextResponse.json(
        { error: "File extension doesn't match MIME type" },
        { status: 400 }
      );
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomString}.${safeExtension}`;

    // SECURITY FIX: Use safe path construction
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    // SECURITY FIX: Prevent path traversal
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      url: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
```

---

#### 5. Add IDOR Protection to Customer APIs (8h)
**Files to modify:**
- `src/app/api/customers/route.ts`
- `src/app/api/customers/[customerId]/route.ts`

**Implementation:**
```typescript
// src/app/api/customers/route.ts
import { requireAuth, requireRoles, createAuthErrorResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;

  // Customers can only see their own data
  // Admin/Staff can see all customers
  let query = db.select().from(customers);

  if (user.role === 'CUSTOMER') {
    query = query.where(eq(customers.userId, user.id));
  }

  const results = await query;
  return NextResponse.json({ customers: results });
}

export async function POST(request: NextRequest) {
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;
  const body = await request.json();

  // Ensure customer can only create their own records
  if (user.role === 'CUSTOMER' && body.userId && body.userId !== user.id) {
    return createAuthErrorResponse('You can only create your own customer record', 403);
  }

  // Set userId to authenticated user if not provided
  body.userId = user.id;

  // ... rest of creation logic
}
```

```typescript
// src/app/api/customers/[customerId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, parseInt(params.customerId))
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  // IDOR Protection: Customers can only view their own data
  if (user.role === 'CUSTOMER' && customer.userId !== user.id) {
    return createAuthErrorResponse('Access denied', 403);
  }

  return NextResponse.json({ customer });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(authCheck.authResult.error || 'Unauthorized');
  }

  const user = authCheck.authResult.user!;

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, parseInt(params.customerId))
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  // IDOR Protection: Customers can only update their own data
  if (user.role === 'CUSTOMER' && customer.userId !== user.id) {
    return createAuthErrorResponse('You can only update your own data', 403);
  }

  // ... rest of update logic
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  // Only ADMIN can delete customers
  const authCheck = requireRoles(request, ['ADMIN']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Only administrators can delete customers',
      403
    );
  }

  // ... rest of delete logic
}
```

---

#### 6. Add IDOR Protection to User APIs (8h)
**Files to modify:**
- `src/app/api/users/route.ts`
- `src/app/api/users/[userId]/route.ts`

**Implementation:** Similar pattern to customers above

---

### WEEK 2: AWS Infrastructure (74 hours remaining)

#### 1. Create CloudFormation Templates (40h)
**Files to create:**
- `infrastructure/cloudformation/main.yaml`
- `infrastructure/cloudformation/vpc.yaml`
- `infrastructure/cloudformation/database.yaml`
- `infrastructure/cloudformation/cache.yaml`
- `infrastructure/cloudformation/application.yaml`
- `infrastructure/cloudformation/monitoring.yaml`

See `CLOUDFORMATION_TEMPLATES.md` for complete implementation

---

#### 2. Create Terraform Configuration (34h)
**Files to create:**
- `infrastructure/terraform/main.tf`
- `infrastructure/terraform/variables.tf`
- `infrastructure/terraform/outputs.tf`
- `infrastructure/terraform/vpc.tf`
- `infrastructure/terraform/rds.tf`
- `infrastructure/terraform/elasticache.tf`
- `infrastructure/terraform/ecs.tf`
- `infrastructure/terraform/s3.tf`

See `TERRAFORM_CONFIGURATION.md` for complete implementation

---

### WEEK 3: CI/CD & Logging (80 hours)

#### 1. Create GitHub Actions Workflow (24h)
**File to create:**
- `.github/workflows/deploy.yml`

See code below for implementation

---

#### 2. Add Testing Infrastructure (40h)
**Files to create:**
- `jest.config.js`
- `server/__tests__/auth.controller.test.ts`
- `server/__tests__/order.controller.test.ts`
- `src/__tests__/components/LoginForm.test.tsx`

**Installation:**
```bash
npm install --save-dev \
  jest @types/jest \
  ts-jest \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event \
  supertest @types/supertest
```

---

#### 3. Implement Structured Logging (16h)
**Files to create:**
- `server/config/logger.ts`
- Update all API routes to use logger

**Installation:**
```bash
npm install winston
npm install --save-dev @types/winston
```

See `STRUCTURED_LOGGING.md` for implementation

---

### WEEK 4: Payment Integration (73 hours)

#### 1. Integrate Real Stripe Payment Processing (40h)
**Files to modify:**
- `src/app/api/payments/initiate/route.ts`
- `server/services/paymentService.ts` (create)

See `STRIPE_INTEGRATION.md` for complete implementation

---

#### 2. Implement Stripe Webhook Handlers (20h)
**Files to create:**
- `src/app/api/webhooks/stripe/route.ts`

See `STRIPE_WEBHOOKS.md` for implementation

---

#### 3. Add Payment Verification System (13h)
**Files to modify:**
- `src/app/api/payments/verify/route.ts`

Replace mock verification with real Stripe API calls

---

## 🛠️ DEVELOPMENT WORKFLOW

### 1. Set Up Development Environment
```bash
# Clone repository
git clone <repo-url>
cd ml-allure

# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Update .env with your local values
# Minimum required:
# - DATABASE_URL
# - JWT_SECRET (generate: openssl rand -base64 64)
# - TURSO_CONNECTION_URL
# - TURSO_AUTH_TOKEN

# Run database migrations
npx prisma migrate deploy
npx drizzle-kit push

# Seed database
npm run db:seed

# Start development servers
npm run dev:all
```

### 2. Docker Development
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Run migrations in container
docker-compose exec app npx prisma migrate deploy

# Stop services
docker-compose down
```

### 3. Testing
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### 4. Build for Production
```bash
# Build Next.js
npm run build

# Test production build locally
npm run start

# Build Docker image
docker build -t ml-allure:latest .

# Test Docker container
docker run -p 3000:3000 -p 5000:5000 \
  --env-file .env \
  ml-allure:latest
```

---

## 📋 TESTING CHECKLIST

Before deploying to production, verify:

### Security
- [ ] JWT tokens are properly verified with signature
- [ ] All API endpoints have authentication
- [ ] IDOR protection implemented for all resources
- [ ] File upload validation works correctly
- [ ] No hardcoded secrets in code
- [ ] .env file is not committed to git
- [ ] CORS is properly configured
- [ ] Rate limiting is working

### Functionality
- [ ] Users can register and login
- [ ] Orders can be created and viewed
- [ ] Inventory can be adjusted (with proper auth)
- [ ] Products can be managed (admin only)
- [ ] Payments can be initiated
- [ ] Webhooks are received correctly

### Infrastructure
- [ ] Docker build succeeds
- [ ] docker-compose starts all services
- [ ] Health checks pass
- [ ] Database migrations run successfully
- [ ] Redis caching works
- [ ] Logs are structured and readable

### Performance
- [ ] API responses < 500ms
- [ ] Cache hit rate > 40%
- [ ] No N+1 query issues
- [ ] Image uploads work within 5MB limit

---

## 🚀 DEPLOYMENT STEPS

### AWS ECS Deployment (using CloudFormation)
```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name ml-allure

# 2. Build and push Docker image
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t ml-allure:latest .
docker tag ml-allure:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ml-allure:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ml-allure:latest

# 3. Deploy infrastructure
aws cloudformation create-stack \
  --stack-name ml-allure-infrastructure \
  --template-body file://infrastructure/cloudformation/main.yaml \
  --parameters file://infrastructure/cloudformation/parameters.json \
  --capabilities CAPABILITY_IAM

# 4. Wait for stack creation
aws cloudformation wait stack-create-complete \
  --stack-name ml-allure-infrastructure

# 5. Get outputs
aws cloudformation describe-stacks \
  --stack-name ml-allure-infrastructure \
  --query 'Stacks[0].Outputs'
```

---

## 📊 PROGRESS TRACKING

| Week | Task | Hours | Status |
|------|------|-------|--------|
| 1 | JWT Verification Fix | 4 | ✅ Done |
| 1 | Auth Utilities | 4 | ✅ Done |
| 1 | Inventory Auth | 8 | ✅ Done |
| 1 | Orders Auth | 12 | ❌ TODO |
| 1 | Products Auth | 8 | ❌ TODO |
| 1 | Payments Auth | 8 | ❌ TODO |
| 1 | File Upload Fix | 3 | ❌ TODO |
| 1 | Customer IDOR | 8 | ❌ TODO |
| 1 | User IDOR | 8 | ❌ TODO |
| 1 | Order IDOR | 8 | ❌ TODO |
| 2 | .gitignore | 1 | ✅ Done |
| 2 | .env.example | 2 | ✅ Done |
| 2 | Dockerfile | 4 | ✅ Done |
| 2 | .dockerignore | 1 | ✅ Done |
| 2 | docker-compose | 3 | ✅ Done |
| 2 | CloudFormation | 40 | ❌ TODO |
| 2 | Terraform | 34 | ❌ TODO |
| 3 | GitHub Actions | 24 | ❌ TODO |
| 3 | Testing Infra | 40 | ❌ TODO |
| 3 | Winston Logging | 16 | ❌ TODO |
| 4 | Stripe Integration | 40 | ❌ TODO |
| 4 | Stripe Webhooks | 20 | ❌ TODO |
| 4 | Payment Verification | 13 | ❌ TODO |

**Total:** 310 hours
**Completed:** 30 hours (10%)
**Remaining:** 280 hours (90%)

---

## 🎯 NEXT IMMEDIATE STEPS

1. **Today (4 hours):**
   - Add authentication to orders APIs
   - Test order creation with authenticated users

2. **Tomorrow (8 hours):**
   - Add authentication to products APIs
   - Add authentication to payments APIs
   - Fix file upload validation

3. **This Week (40 hours):**
   - Complete all IDOR protection
   - Start CloudFormation templates
   - Begin GitHub Actions workflow

4. **Next Week (80 hours):**
   - Complete CloudFormation/Terraform
   - Set up CI/CD pipeline
   - Add testing infrastructure
   - Implement structured logging

5. **Weeks 3-4 (120 hours):**
   - Integrate real Stripe payments
   - Implement webhooks
   - Complete testing
   - Deploy to AWS staging environment

---

## 📞 SUPPORT & QUESTIONS

For questions or issues during implementation:
1. Review the comprehensive audit reports in the repository
2. Check the SECURITY_AUDIT_REPORT.md for security details
3. Refer to AWS_PRODUCTION_READINESS_AUDIT.md for infrastructure
4. Consult SCALABILITY_PERFORMANCE_EVALUATION.md for optimization

**Good luck with Phase 1 implementation! 🚀**
