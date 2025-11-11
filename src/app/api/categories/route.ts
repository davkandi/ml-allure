import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    // Single category by ID or slug
    if (id || slug) {
      if (id && isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const whereCondition = id 
        ? eq(categories.id, parseInt(id))
        : eq(categories.slug, slug!);

      const category = await db.select()
        .from(categories)
        .where(whereCondition)
        .limit(1);

      if (category.length === 0) {
        return NextResponse.json({ 
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(category[0]);
    }

    // List categories with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');
    const sortField = searchParams.get('sort') ?? 'displayOrder';
    const sortOrder = searchParams.get('order') ?? 'asc';

    let query = db.select().from(categories);
    const conditions = [];

    // Search by name
    if (search) {
      conditions.push(like(categories.name, `%${search}%`));
    }

    // Filter by isActive
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true' ? 1 : 0;
      conditions.push(eq(categories.isActive, isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sorting
    const sortColumn = sortField === 'displayOrder' ? categories.displayOrder : categories.createdAt;
    query = sortOrder === 'desc' 
      ? query.orderBy(desc(sortColumn))
      : query.orderBy(asc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, imageUrl, isActive, displayOrder } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ 
        error: "Slug is required",
        code: "MISSING_SLUG" 
      }, { status: 400 });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ 
        error: "Slug must contain only lowercase letters, numbers, and hyphens",
        code: "INVALID_SLUG_FORMAT" 
      }, { status: 400 });
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== 'boolean' && isActive !== 0 && isActive !== 1) {
      return NextResponse.json({ 
        error: "isActive must be a boolean value (true/false or 0/1)",
        code: "INVALID_IS_ACTIVE" 
      }, { status: 400 });
    }

    // Validate displayOrder if provided
    if (displayOrder !== undefined && displayOrder !== null) {
      if (typeof displayOrder !== 'number' || !Number.isInteger(displayOrder)) {
        return NextResponse.json({ 
          error: "displayOrder must be an integer",
          code: "INVALID_DISPLAY_ORDER" 
        }, { status: 400 });
      }
    }

    // Check if slug already exists
    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json({ 
        error: "A category with this slug already exists",
        code: "DUPLICATE_SLUG" 
      }, { status: 400 });
    }

    // Create new category
    const now = Date.now();
    const newCategory = await db.insert(categories)
      .values({
        name: name.trim(),
        slug: slug.trim(),
        description: description ? description.trim() : null,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        isActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
        displayOrder: displayOrder ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const categoryId = parseInt(id);
    const body = await request.json();
    const { name, slug, description, imageUrl, isActive, displayOrder } = body;

    // Check if category exists
    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ 
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate slug format if being changed
    if (slug !== undefined) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json({ 
          error: "Slug must contain only lowercase letters, numbers, and hyphens",
          code: "INVALID_SLUG_FORMAT" 
        }, { status: 400 });
      }

      // Check if new slug is already used by another category
      if (slug !== existingCategory[0].slug) {
        const duplicateSlug = await db.select()
          .from(categories)
          .where(and(
            eq(categories.slug, slug),
            eq(categories.id, categoryId) === false
          ))
          .limit(1);

        if (duplicateSlug.length > 0) {
          return NextResponse.json({ 
            error: "A category with this slug already exists",
            code: "DUPLICATE_SLUG" 
          }, { status: 400 });
        }
      }
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== 'boolean' && isActive !== 0 && isActive !== 1) {
      return NextResponse.json({ 
        error: "isActive must be a boolean value (true/false or 0/1)",
        code: "INVALID_IS_ACTIVE" 
      }, { status: 400 });
    }

    // Validate displayOrder if provided
    if (displayOrder !== undefined && displayOrder !== null) {
      if (typeof displayOrder !== 'number' || !Number.isInteger(displayOrder)) {
        return NextResponse.json({ 
          error: "displayOrder must be an integer",
          code: "INVALID_DISPLAY_ORDER" 
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;

    // Update category
    const updatedCategory = await db.update(categories)
      .set(updates)
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json(updatedCategory[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const categoryId = parseInt(id);

    // Check if category exists
    const existingCategory = await db.select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ 
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete category
    const deletedCategory = await db.delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json({
      message: 'Category deleted successfully',
      category: deletedCategory[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}