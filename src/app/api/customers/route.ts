import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { requireAuth, requireRoles, createAuthErrorResponse, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY FIX: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Authentication required to access customer data',
      401
    );
  }

  const authenticatedUser = authCheck.authResult.user!;
  const isStaff = hasRole(authenticatedUser, ['ADMIN', 'STAFF', 'SALES_STAFF']);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single customer by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, parseInt(id)))
        .limit(1);

      if (customer.length === 0) {
        return NextResponse.json(
          { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // IDOR Protection: Customers can only view their own data
      if (!isStaff && customer[0].userId !== authenticatedUser.id) {
        return createAuthErrorResponse(
          'You can only view your own customer profile',
          403
        );
      }

      return NextResponse.json(customer[0]);
    }

    // List customers with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isGuest = searchParams.get('isGuest');
    const userId = searchParams.get('userId');

    let query = db.select().from(customers);
    const conditions = [];

    // IDOR Protection: Customers can only list their own records
    if (!isStaff) {
      conditions.push(eq(customers.userId, authenticatedUser.id));
    }

    // Search by email, firstName, or lastName
    if (search) {
      conditions.push(
        or(
          like(customers.email, `%${search}%`),
          like(customers.firstName, `%${search}%`),
          like(customers.lastName, `%${search}%`)
        )
      );
    }

    // Filter by isGuest
    if (isGuest !== null) {
      if (isGuest === 'true') {
        conditions.push(eq(customers.isGuest, true));
      } else if (isGuest === 'false') {
        conditions.push(eq(customers.isGuest, false));
      }
    }

    // Filter by userId
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(customers.userId, parseInt(userId)));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // SECURITY FIX: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Authentication required to create customer',
      401
    );
  }

  const authenticatedUser = authCheck.authResult.user!;
  const isStaff = hasRole(authenticatedUser, ['ADMIN', 'STAFF', 'SALES_STAFF']);

  try {
    const body = await request.json();
    const { userId, email, firstName, lastName, phone, isGuest, addresses } = body;

    // Validate userId if provided
    if (userId !== undefined && userId !== null) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
    }

    // IDOR Protection: Customers can only create records for themselves
    if (!isStaff && userId !== undefined && userId !== null && parseInt(userId) !== authenticatedUser.id) {
      return createAuthErrorResponse(
        'You can only create customer records for yourself',
        403
      );
    }

    // Validate isGuest if provided
    if (isGuest !== undefined && isGuest !== null) {
      if (typeof isGuest !== 'boolean' && isGuest !== 0 && isGuest !== 1) {
        return NextResponse.json(
          { error: 'isGuest must be a boolean (true/false or 0/1)', code: 'INVALID_IS_GUEST' },
          { status: 400 }
        );
      }
    }

    // Validate addresses if provided
    if (addresses !== undefined && addresses !== null) {
      if (!Array.isArray(addresses)) {
        return NextResponse.json(
          { error: 'addresses must be a valid JSON array', code: 'INVALID_ADDRESSES_FORMAT' },
          { status: 400 }
        );
      }
      // Validate it's a valid JSON structure
      try {
        JSON.stringify(addresses);
      } catch {
        return NextResponse.json(
          { error: 'addresses must be a valid JSON array', code: 'INVALID_ADDRESSES_JSON' },
          { status: 400 }
        );
      }
    }

    const now = Date.now();

    const newCustomer = await db
      .insert(customers)
      .values({
        userId: userId !== undefined && userId !== null ? parseInt(userId) : null,
        email: email ?? null,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        phone: phone ?? null,
        isGuest: isGuest !== undefined ? (isGuest === true || isGuest === 1) : false,
        addresses: addresses ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newCustomer[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY FIX: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Authentication required to update customer',
      401
    );
  }

  const authenticatedUser = authCheck.authResult.user!;
  const isStaff = hasRole(authenticatedUser, ['ADMIN', 'STAFF', 'SALES_STAFF']);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, email, firstName, lastName, phone, isGuest, addresses } = body;

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // IDOR Protection: Customers can only update their own records
    if (!isStaff && existingCustomer[0].userId !== authenticatedUser.id) {
      return createAuthErrorResponse(
        'You can only update your own customer profile',
        403
      );
    }

    // Validate userId if provided
    if (userId !== undefined && userId !== null) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
    }

    // Validate isGuest if provided
    if (isGuest !== undefined && isGuest !== null) {
      if (typeof isGuest !== 'boolean' && isGuest !== 0 && isGuest !== 1) {
        return NextResponse.json(
          { error: 'isGuest must be a boolean (true/false or 0/1)', code: 'INVALID_IS_GUEST' },
          { status: 400 }
        );
      }
    }

    // Validate addresses if provided
    if (addresses !== undefined && addresses !== null) {
      if (!Array.isArray(addresses)) {
        return NextResponse.json(
          { error: 'addresses must be a valid JSON array', code: 'INVALID_ADDRESSES_FORMAT' },
          { status: 400 }
        );
      }
      // Validate it's a valid JSON structure
      try {
        JSON.stringify(addresses);
      } catch {
        return NextResponse.json(
          { error: 'addresses must be a valid JSON array', code: 'INVALID_ADDRESSES_JSON' },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (userId !== undefined) {
      updates.userId = userId !== null ? parseInt(userId) : null;
    }
    if (email !== undefined) {
      updates.email = email;
    }
    if (firstName !== undefined) {
      updates.firstName = firstName;
    }
    if (lastName !== undefined) {
      updates.lastName = lastName;
    }
    if (phone !== undefined) {
      updates.phone = phone;
    }
    if (isGuest !== undefined) {
      updates.isGuest = isGuest === true || isGuest === 1;
    }
    if (addresses !== undefined) {
      updates.addresses = addresses;
    }

    const updatedCustomer = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedCustomer[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // SECURITY FIX: Only ADMIN can delete customer records
  const authCheck = requireRoles(request, ['ADMIN']);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.error || 'Only administrators can delete customer records',
      403
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedCustomer = await db
      .delete(customers)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Customer deleted successfully',
      customer: deletedCustomer[0],
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}