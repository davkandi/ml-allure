# COMPREHENSIVE SECURITY AUDIT REPORT
## ML Allure E-commerce Application

**Audit Date:** 2025-11-14  
**Thoroughness Level:** Very Thorough  
**Application Type:** Next.js Full-Stack E-commerce Platform  
**Database:** Drizzle ORM/LibSQL (Turso) + Prisma  

---

## EXECUTIVE SUMMARY

The application has multiple **critical and high-severity security vulnerabilities** that require immediate attention before production deployment. The main issues include:

1. **Missing Authentication on Critical API Endpoints** (Critical)
2. **Unsafe JWT Token Decoding** (Critical)
3. **Insecure Direct Object References (IDOR)** (High)
4. **Missing Authorization Checks** (High)
5. **Weak Password Requirements** (High)
6. **XSS Vulnerabilities** (High)
7. **File Upload Security Issues** (Medium)
8. **Verbose Error Messages Exposing Stack Traces** (Medium)
9. **Incomplete Cookie Security Configuration** (Medium)
10. **Session Management Issues** (High)

---

## DETAILED FINDINGS

### 1. UNSAFE JWT TOKEN DECODING IN MIDDLEWARE (CRITICAL)

**Severity:** Critical  
**File:** `/home/user/ml-allure/middleware.ts` (Lines 14-23)  
**Vulnerability Type:** Improper JWT Verification  

**Issue Description:**
The Next.js middleware decodes JWT tokens using `atob()` without verification. This allows attackers to forge tokens by creating invalid JWTs that will be accepted by the middleware.

**Code Example:**
```typescript
// VULNERABLE CODE
if (token) {
  try {
    // Decode JWT token to get user role
    const payload = JSON.parse(atob(token.split('.')[1]));
    userRole = payload.role;
    isAuthenticated = true;
  } catch (error) {
    console.error('Token parsing error:', error);
  }
}
```

**Risk:**
- Attackers can forge user roles (ADMIN, STAFF, CUSTOMER)
- Complete bypass of role-based access control
- Unauthorized access to admin/POS panels

**Recommended Fix:**
```typescript
import jwt from 'jsonwebtoken';

if (token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      role: string;
    };
    userRole = payload.role;
    isAuthenticated = true;
  } catch (error) {
    // Token is invalid or expired
    isAuthenticated = false;
  }
}
```

---

### 2. MISSING AUTHENTICATION ON CRITICAL API ENDPOINTS (CRITICAL)

**Severity:** Critical  
**Files:** 
- `/home/user/ml-allure/src/app/api/inventory/adjust/route.ts`
- `/home/user/ml-allure/src/app/api/orders/[orderId]/status/route.ts`
- `/home/user/ml-allure/src/app/api/orders/[orderId]/payment/route.ts`
- `/home/user/ml-allure/src/app/api/payments/verify/route.ts`
- `/home/user/ml-allure/src/app/api/products/route.ts` (POST, PUT, DELETE)
- `/home/user/ml-allure/src/app/api/customers/route.ts` (All CRUD operations)
- `/home/user/ml-allure/src/app/api/users/route.ts` (All CRUD operations)

**Vulnerability Type:** Missing Authentication/Authorization  

**Issue Description:**
Many critical API endpoints that modify data (create, update, delete) lack authentication and authorization checks. Any unauthenticated user can:
- Create/modify/delete products
- Adjust inventory
- Change order statuses
- Verify payments
- Create/modify/delete users and customers

**Code Example - Inventory Adjustment:**
```typescript
// VULNERABLE CODE - /src/app/api/inventory/adjust/route.ts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // NO AUTHENTICATION CHECK!
    const { variantId, quantityChange, reason, changeType } = body;
    
    // Directly modifies inventory without verifying user permissions
    const previousQuantity = variant.stockQuantity;
    const newQuantity = previousQuantity + quantityChange;
    
    await db.update(productVariants)
      .set({
        stockQuantity: newQuantity,
        updatedAt: Date.now(),
      })
      .where(eq(productVariants.id, variantId));
```

**Code Example - Order Status Update:**
```typescript
// VULNERABLE CODE - /src/app/api/orders/[orderId]/status/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  // NO AUTHENTICATION CHECK!
  const body = await request.json();
  const { newStatus, note } = body;
  
  // Any user can change order status
  const updatedOrder = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, parseInt(orderId)))
    .returning();
```

**Impact:**
- Unauthorized inventory manipulation
- Order status tampering
- Payment fraud
- Data corruption
- Bypass of entire business logic

**Recommended Fix:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

// Authentication middleware
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      role: string;
    };
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Add authentication check
    const user = await getAuthenticatedUser(request);
    
    // Add authorization check
    if (!['ADMIN', 'INVENTORY_MANAGER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // ... rest of the logic
```

---

### 3. INSECURE DIRECT OBJECT REFERENCES (IDOR) (HIGH)

**Severity:** High  
**Files:**
- `/home/user/ml-allure/src/app/api/customers/route.ts` (Lines 6-34)
- `/home/user/ml-allure/src/app/api/users/route.ts` (Lines 15-43)
- `/home/user/ml-allure/src/app/api/orders/route.ts` (Lines 30-64)
- `/home/user/ml-allure/src/app/api/products/[id]/route.ts` (All endpoints)

**Vulnerability Type:** Insecure Direct Object References  

**Issue Description:**
API endpoints allow users to access/modify any resource by ID without verifying ownership or permissions. For example:
- Any user can retrieve customer #5's data by calling `/api/customers?id=5`
- Any user can modify user #3 by calling `/api/users?id=3` with PUT
- Any user can view any order details

**Code Example:**
```typescript
// VULNERABLE CODE - /src/app/api/customers/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  // NO ownership verification!
  if (id) {
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);
    
    return NextResponse.json(customer[0]); // Returns anyone's data
  }
}
```

**Code Example - User Endpoint:**
```typescript
// VULNERABLE CODE - /src/app/api/users/route.ts
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  // NO verification that user can modify this user!
  const updatedUser = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, parseInt(id)))
    .returning();
  
  return NextResponse.json(excludePassword(updatedUser[0]));
}
```

**Risk:**
- Users can view/modify other users' profiles
- Customers can access other customers' data
- No audit trail for who changed what

**Recommended Fix:**
```typescript
// Add authentication and ownership verification
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    throw new Error('Invalid token');
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const requestedId = parseInt(id);
      
      // Only allow users to access their own data (or admins)
      if (user.id !== requestedId && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      // ... fetch and return data
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

---

### 4. WEAK PASSWORD REQUIREMENTS (HIGH)

**Severity:** High  
**Files:**
- `/home/user/ml-allure/src/app/api/users/route.ts` (Line 135)
- `/home/user/ml-allure/server/controllers/auth.controller.ts` (Lines 16)

**Vulnerability Type:** Weak Credential Configuration  

**Issue Description:**
The API endpoint `/api/users` route accepts passwords as short as 6 characters in the POST handler, despite the schema requiring 8 characters. This inconsistency allows weak passwords.

**Code Example:**
```typescript
// VULNERABLE CODE - /src/app/api/users/route.ts (Line 135)
// Validate password length
if (password.length < 6) {  // Should be >= 8!
  return NextResponse.json(
    { error: 'Password must be at least 6 characters', code: 'PASSWORD_TOO_SHORT' },
    { status: 400 }
  );
}
```

**Contrast with better requirement in auth schema:**
```typescript
// /server/schemas/authSchemas.ts - Has proper requirements
password: z
  .string({ required_error: 'Le mot de passe est requis' })
  .min(8, { message: 'Le mot de passe doit contenir au least 8 caractères' })
  .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' }),
```

**Risk:**
- Brute force attacks more feasible
- User accounts easily compromised
- Inconsistent password policies across APIs

**Recommended Fix:**
```typescript
// Validate password strength (minimum 8 chars, uppercase, lowercase, number)
if (password.length < 8) {
  return NextResponse.json(
    { error: 'Password must be at least 8 characters', code: 'PASSWORD_TOO_SHORT' },
    { status: 400 }
  );
}

// Add regex validation
const hasUpperCase = /[A-Z]/.test(password);
const hasLowerCase = /[a-z]/.test(password);
const hasNumber = /[0-9]/.test(password);

if (!hasUpperCase || !hasLowerCase || !hasNumber) {
  return NextResponse.json(
    { 
      error: 'Password must contain uppercase, lowercase, and number',
      code: 'WEAK_PASSWORD'
    },
    { status: 400 }
  );
}
```

---

### 5. XSS VULNERABILITIES (HIGH)

**Severity:** High  
**Files:**
- `/home/user/ml-allure/src/components/ui/chart.tsx` (Line 83)
- `/home/user/ml-allure/src/components/pos/Receipt.tsx` (Line 41)

**Vulnerability Type:** Cross-Site Scripting (XSS)  

**Issue Description:**
The application uses `dangerouslySetInnerHTML` and dynamically created HTML/styles, which can lead to XSS if the data is from user input.

**Code Example - Chart Component:**
```typescript
// VULNERABLE CODE - /src/components/ui/chart.tsx (Line 83)
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}
```

**Code Example - Receipt Component:**
```typescript
// VULNERABLE CODE - /src/components/pos/Receipt.tsx (Line 41)
useEffect(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      ...
    }
  `;
  document.head.appendChild(style);
```

**Risk:**
- If `config` data comes from user input or external source, attacker can inject scripts
- Malicious CSS or JavaScript can be injected
- Session hijacking, credential theft, phishing

**Recommended Fix:**
```typescript
// For Chart Component - sanitize or avoid dangerouslySetInnerHTML
import DOMPurify from 'dompurify';

// Option 1: Use sanitization library
const sanitizedHtml = DOMPurify.sanitize(htmlString);

// Option 2: Use CSS-in-JS instead
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const styles = Object.entries(THEMES).map(([theme, prefix]) => {
    const rules = colorConfig
      .map(([key, itemConfig]) => {
        const color =
          itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
          itemConfig.color;
        return color ? `--color-${key}: ${color};` : '';
      })
      .filter(Boolean)
      .join('\n');
    
    return `${prefix} [data-chart=${id}] { ${rules} }`;
  }).join('\n');
  
  return <style>{styles}</style>;
}

// For Receipt - Use template literals with proper escaping
useEffect(() => {
  const style = document.createElement("style");
  // Define styles in a way that prevents injection
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #receipt-content, #receipt-content * {
        visibility: visible;
      }
    }
  `;
  style.textContent = printStyles; // Use textContent instead of innerHTML
  document.head.appendChild(style);
```

---

### 6. FILE UPLOAD VULNERABILITIES (MEDIUM)

**Severity:** Medium  
**File:** `/home/user/ml-allure/src/app/api/upload/image/route.ts`

**Vulnerability Type:** Insecure File Upload  

**Issue Description:**
The file upload endpoint has minimal validation and no authentication. Issues include:

1. **No Authentication:** Any user can upload files
2. **Weak File Type Validation:** Only checks MIME type (can be spoofed)
3. **Filename Extraction Issue:** Uses `file.name.split(".").pop()` which could be manipulated
4. **Path Traversal Risk:** No restriction on file location

**Code Example:**
```typescript
// VULNERABLE CODE - /src/app/api/upload/image/route.ts
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    // Weak validation - only checks MIME type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "File must be an image" },
        { status: 400 }
      );
    }

    // Weak file size limit - 5MB could be too large
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Insecure filename extraction
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Saves to public directory (can be served)
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Returns public URL - file is immediately accessible
    const url = `/uploads/${filename}`;

    return NextResponse.json({
      message: "Image uploaded successfully",
      url,
      filename,
    });
  }
}
```

**Risks:**
- Arbitrary file upload (executable files, scripts)
- MIME type spoofing
- Path traversal attacks
- Server resources exhausted by large files
- Malicious files served to users

**Recommended Fix:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { createHash } from "crypto";

// Authentication middleware
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    throw new Error('Invalid token');
  }
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB max

export async function POST(request: NextRequest) {
  try {
    // Add authentication
    const user = await getAuthenticatedUser(request);
    
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No image file provided" },
        { status: 400 }
      );
    }

    // Strict MIME type validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Validate extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { message: "Invalid file extension" },
        { status: 400 }
      );
    }

    // Use hash for filename to prevent directory traversal
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hash = createHash('sha256')
      .update(buffer)
      .digest('hex')
      .substring(0, 16);
    
    const filename = `${hash}.${extension}`;

    // Create user-specific directory
    const uploadsDir = join(process.cwd(), "public", "uploads", "images");
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Validate path to prevent directory traversal
    const filepath = join(uploadsDir, filename);
    if (!filepath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { message: "Invalid file path" },
        { status: 400 }
      );
    }

    await writeFile(filepath, buffer);

    // Generate URL with token/signature for added security
    const url = `/uploads/images/${filename}`;

    return NextResponse.json({
      message: "Image uploaded successfully",
      url,
      filename,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.error("Image upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload image" },
      { status: 500 }
    );
  }
}
```

---

### 7. VERBOSE ERROR MESSAGES EXPOSING STACK TRACES (MEDIUM)

**Severity:** Medium  
**Files:** Multiple API routes
- `/home/user/ml-allure/src/app/api/users/route.ts` (Lines 101, 196, 314)
- `/home/user/ml-allure/src/app/api/orders/route.ts` (Line 135)
- `/home/user/ml-allure/src/app/api/products/route.ts` (Lines 160, 339)
- `/home/user/ml-allure/src/app/api/customers/route.ts` (Lines 89, 161, 270, 314)

**Vulnerability Type:** Information Disclosure  

**Issue Description:**
API endpoints return detailed error messages including stack traces and database error details, which can help attackers understand the application's architecture.

**Code Example:**
```typescript
// VULNERABLE CODE - Multiple files
catch (error: any) {
  console.error('GET error:', error);
  return NextResponse.json(
    { error: 'Internal server error: ' + error.message },  // Exposes error details
    { status: 500 }
  );
}

// Another example
catch (error) {
  return NextResponse.json({ 
    error: 'Internal server error: ' + (error as Error).message  // Exposes details
  }, { status: 500 });
}
```

**Errors are also logged in development:**
```typescript
// /server/middleware/errorHandler.ts (Lines 102-105)
if (process.env.NODE_ENV === 'development') {
  response.error = err.name;
  response.stack = err.stack;  // EXPOSES STACK TRACE!
}
```

**Risk:**
- Attackers learn database schema, library versions
- Helps in crafting targeted attacks
- Information about internal system design

**Recommended Fix:**
```typescript
// Implement proper error handling
const handleApiError = (error: Error, isDevelopment: boolean) => {
  // Log full error internally for debugging
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Return generic error to client
  return {
    error: 'An internal server error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDevelopment && {
      debug: {
        message: error.message,
        type: error.constructor.name
      }
    })
  };
};

// In API routes:
catch (error) {
  const isDev = process.env.NODE_ENV === 'development';
  const errorResponse = handleApiError(error as Error, isDev);
  
  return NextResponse.json(
    errorResponse,
    { status: 500 }
  );
}

// For error middleware:
const response: ErrorResponse = {
  success: false,
  message: 'An internal server error occurred'
};

// Only expose stack trace in development
if (process.env.NODE_ENV === 'development') {
  response.error = err.name;
  response.stack = err.stack;
}
// Never expose in production
```

---

### 8. SESSION MANAGEMENT ISSUES - MISSING SESSION USER CONTEXT (HIGH)

**Severity:** High  
**Files:**
- `/home/user/ml-allure/src/app/api/orders/[orderId]/status/route.ts` (Line 115)
- `/home/user/ml-allure/src/app/api/orders/[orderId]/payment/route.ts` (Line 100)
- `/home/user/ml-allure/src/app/api/payments/verify/route.ts` (Line 115)
- `/home/user/ml-allure/src/app/api/inventory/adjust/route.ts` (Line 63)

**Vulnerability Type:** Improper Session/User Tracking  

**Issue Description:**
Multiple API endpoints have TODO comments indicating missing user context from sessions. Instead of tracking who actually performed actions, hardcoded user IDs or null values are used.

**Code Example:**
```typescript
// VULNERABLE CODE - /src/app/api/orders/[orderId]/status/route.ts (Line 115)
await db.insert(inventoryLogs).values({
  variantId: null as any,
  changeType: "ADJUSTMENT",
  quantityChange: 0,
  previousQuantity: 0,
  newQuantity: 0,
  reason: `Status changed from ${currentStatus} to ${newStatus}${note ? `: ${note}` : ""}`,
  performedBy: null as any, // TODO: Get from session <- MISSING!
  orderId: parseInt(orderId),
  createdAt: now,
});

// Another example - hardcoded user ID
// /src/app/api/inventory/adjust/route.ts (Line 63)
const [log] = await db
  .insert(inventoryLogs)
  .values({
    variantId,
    changeType,
    quantityChange,
    previousQuantity,
    newQuantity,
    reason,
    performedBy: 1, // HARDCODED! Should be from session
    createdAt: Date.now(),
  })
  .returning();
```

**Risk:**
- No audit trail of who made changes
- Cannot track malicious actions to user
- Compliance violations (GDPR, PCI-DSS)
- Inability to investigate security incidents

**Recommended Fix:**
```typescript
// Create helper to extract authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      role: string;
    };
  } catch {
    throw new Error('Invalid token');
  }
}

// In API routes:
export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { orderId } = params;
    const body = await request.json();
    const { newStatus, note } = body;

    // ... validation code ...

    // Now user.id is available for audit logging
    await db.insert(inventoryLogs).values({
      variantId: null,
      changeType: "ADJUSTMENT",
      reason: `Status changed from ${currentStatus} to ${newStatus}${note ? `: ${note}` : ""}`,
      performedBy: user.id, // Track actual user who made change
      orderId: parseInt(orderId),
      createdAt: now,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // ... error handling
  }
}
```

---

### 9. INSUFFICIENT CORS CONFIGURATION (MEDIUM)

**Severity:** Medium  
**File:** `/home/user/ml-allure/server/index.ts` (Lines 29-33)

**Vulnerability Type:** Improper CORS Configuration  

**Issue Description:**
The CORS configuration allows requests from a single hardcoded origin, but doesn't properly handle all scenarios. Additionally, there's no CSRF protection.

**Code Example:**
```typescript
// POTENTIALLY VULNERABLE - /server/index.ts (Lines 29-33)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

**Issues:**
1. In development, defaults to `http://localhost:3000`
2. `credentials: true` without proper CSRF protection
3. No explicit allowed methods or headers
4. No CSRF tokens on state-changing operations

**Recommended Fix:**
```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

// Add cookie parser (required for CSRF)
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.PRODUCTION_URL,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// CSRF protection middleware for state-changing operations
const csrfProtection = csrf({ cookie: false });

// Apply CSRF protection to POST, PUT, DELETE requests
app.post('/api/*', csrfProtection, (req, res, next) => next());
app.put('/api/*', csrfProtection, (req, res, next) => next());
app.delete('/api/*', csrfProtection, (req, res, next) => next());

// Endpoint to get CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

### 10. MISSING SECURITY HEADERS (MEDIUM)

**Severity:** Medium  
**File:** `/home/user/ml-allure/next.config.ts`

**Vulnerability Type:** Insufficient Security Headers  

**Issue Description:**
The application uses `helmet()` middleware but doesn't configure custom security headers like CSP, X-Frame-Options, etc. in Next.js config.

**Current Setup:**
```typescript
// /server/index.ts (Line 27)
app.use(helmet());
```

**Recommended Enhancement:**
```typescript
// next.config.ts - Add security headers
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        // Prevent clickjacking
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        // Prevent MIME type sniffing
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        // Enable XSS protection
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        // Referrer policy
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        // Content Security Policy
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';"
        },
        // Permissions policy
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()'
        }
      ],
    },
  ];
},

// server/index.ts - Enhanced helmet config
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));
```

---

## SUMMARY TABLE

| # | Category | Severity | Status | Endpoint(s) |
|---|----------|----------|--------|------------|
| 1 | JWT Decoding | CRITICAL | Unfixed | middleware.ts |
| 2 | Missing Auth | CRITICAL | Unfixed | Multiple API endpoints |
| 3 | IDOR | HIGH | Unfixed | Users, Customers, Orders, Products |
| 4 | Weak Passwords | HIGH | Unfixed | /api/users POST |
| 5 | XSS | HIGH | Unfixed | chart.tsx, Receipt.tsx |
| 6 | File Upload | MEDIUM | Unfixed | /api/upload/image |
| 7 | Error Disclosure | MEDIUM | Unfixed | All API routes |
| 8 | Session Tracking | HIGH | Unfixed | Inventory, Orders, Payments |
| 9 | CORS Config | MEDIUM | Unfixed | server/index.ts |
| 10 | Security Headers | MEDIUM | Unfixed | next.config.ts |

---

## DEPENDENCIES REVIEW

**Package.json Analysis:**
- Better-auth (v1.3.10) - Being used, check for updates
- jsonwebtoken (v9.0.2) - Current
- bcrypt (v6.0.0) + bcryptjs (v3.0.2) - Both present (redundant)
- express-rate-limit (v8.1.0) - Good, implemented
- helmet (v8.1.0) - Good, implemented
- express-fileupload (v1.5.2) - Present, needs security improvements

**Known Vulnerability Check:**
No major CVEs detected in primary dependencies as of knowledge cutoff, but ensure regular updates.

---

## PRIORITY REMEDIATION ROADMAP

### Phase 1 - CRITICAL (Fix Immediately, before any production use)
1. ✓ Add JWT verification in middleware.ts
2. ✓ Add authentication to all state-changing API endpoints
3. ✓ Implement authorization checks (role-based access control)
4. ✓ Fix IDOR vulnerabilities by adding ownership checks

### Phase 2 - HIGH (Fix within 1 week)
5. ✓ Standardize password requirements across all endpoints
6. ✓ Fix XSS vulnerabilities with sanitization
7. ✓ Implement proper session user tracking
8. ✓ Add comprehensive input validation

### Phase 3 - MEDIUM (Fix within 2 weeks)
9. ✓ Improve file upload security
10. ✓ Mask sensitive error information
11. ✓ Enhance CORS and add CSRF protection
12. ✓ Add missing security headers

### Phase 4 - ONGOING
13. Set up security scanning in CI/CD
14. Implement security monitoring and logging
15. Regular dependency updates
16. Penetration testing before production

---

## ADDITIONAL RECOMMENDATIONS

### 1. Implement Rate Limiting on All Sensitive Endpoints
```typescript
// Already partially implemented but needs expansion
const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later'
});

app.post('/api/auth/login', strictLimiter, ...)
app.post('/api/auth/register', strictLimiter, ...)
app.put('/api/payments/verify', strictLimiter, ...)
```

### 2. Database Query Monitoring
The application uses Drizzle ORM (safe from SQL injection) but should log slow queries:
```typescript
// In prisma config
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error', 'warn'],
});
```

### 3. Implement Security Event Logging
```typescript
async function logSecurityEvent(
  eventType: string,
  userId: number | null,
  details: Record<string, any>
) {
  await db.insert(securityLogs).values({
    eventType,
    userId,
    details: JSON.stringify(details),
    ipAddress: getClientIP(),
    timestamp: Date.now(),
  });
}
```

### 4. Add Account Lockout After Failed Attempts
```typescript
// Implement exponential backoff for failed login attempts
async function incrementFailedAttempts(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  
  if (user[0].failedLoginAttempts >= 5) {
    // Lock account for 30 minutes
    await db.update(users)
      .set({
        lockedUntil: Date.now() + 30 * 60 * 1000
      })
      .where(eq(users.email, email));
  }
}
```

### 5. Implement HTTPS Enforcement
```typescript
// In next.config.ts or server config
const redirects = async () => {
  return [
    {
      source: '/:path*',
      has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
      destination: 'https://:host/:path*',
      permanent: true,
    },
  ];
};
```

---

## COMPLIANCE NOTES

- **PCI-DSS:** Currently NOT compliant (missing authentication, audit logs)
- **GDPR:** Missing user data deletion, data export features
- **SOC 2:** Missing comprehensive logging and monitoring

---

## CONCLUSION

This application has **multiple critical vulnerabilities** that make it unsuitable for production use without significant security remediation. The most concerning issues are:

1. **No authentication on sensitive endpoints** - Allows complete data manipulation
2. **Unsafe JWT decoding** - Allows role spoofing and authorization bypass
3. **IDOR vulnerabilities** - Users can access/modify other users' data

**Estimated remediation time:** 2-3 weeks for Phase 1 & 2, 4-6 weeks total for all phases.

Recommend engaging a security consultant for post-remediation penetration testing before production deployment.

