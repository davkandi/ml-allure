import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const VALID_ROLES = ['ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF', 'CUSTOMER'];

// Helper function to exclude password from user object
function excludePassword(user: any) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(excludePassword(user[0]));
    }

    // List users with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const isActiveParam = searchParams.get('isActive');

    let query = db.select().from(users);
    const conditions = [];

    // Search across email, firstName, lastName
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }

    // Filter by role
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, code: 'INVALID_ROLE' },
          { status: 400 }
        );
      }
      conditions.push(eq(users.role, role));
    }

    // Filter by isActive
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true' ? 1 : 0;
      conditions.push(eq(users.isActive, isActive));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination and ordering
    const results = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Exclude passwords from all results
    const sanitizedResults = results.map(excludePassword);

    return NextResponse.json(sanitizedResults);
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, firstName, lastName, phone, isActive } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters', code: 'PASSWORD_TOO_SHORT' },
        { status: 400 }
      );
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'EMAIL_EXISTS' },
        { status: 400 }
      );
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    const now = Date.now();
    const userData: any = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      phone: phone?.trim() || null,
      isActive: typeof isActive === 'boolean' ? (isActive ? 1 : 0) : 1,
      createdAt: now,
      updatedAt: now,
    };

    // Insert user
    const newUser = await db.insert(users).values(userData).returning();

    return NextResponse.json(excludePassword(newUser[0]), { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, password, role, firstName, lastName, phone, isActive } = body;

    // Prepare update data
    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Validate and update email if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL' },
          { status: 400 }
        );
      }

      // Check if email already exists (excluding current user)
      const emailCheck = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (emailCheck.length > 0 && emailCheck[0].id !== parseInt(id)) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'EMAIL_EXISTS' },
          { status: 400 }
        );
      }

      updateData.email = email.toLowerCase().trim();
    }

    // Validate and hash password if provided
    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters', code: 'PASSWORD_TOO_SHORT' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Validate and update role if provided
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, code: 'INVALID_ROLE' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    // Update other fields if provided
    if (firstName !== undefined) {
      updateData.firstName = firstName?.trim() || null;
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName?.trim() || null;
    }

    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive ? 1 : 0;
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(id)))
      .returning();

    return NextResponse.json(excludePassword(updatedUser[0]));
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'User deleted successfully',
      user: excludePassword(deletedUser[0]),
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}