import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, categories, productVariants } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    // Single product by ID or slug
    if (id || slug) {
      const whereCondition = id 
        ? eq(products.id, parseInt(id))
        : eq(products.slug, slug as string);

      if (id && isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const product = await db.select()
        .from(products)
        .where(whereCondition)
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json({ 
          error: 'Product not found',
          code: "PRODUCT_NOT_FOUND" 
        }, { status: 404 });
      }

      // Get category
      let category = null;
      if (product[0].categoryId) {
        const categoryResult = await db.select()
          .from(categories)
          .where(eq(categories.id, product[0].categoryId))
          .limit(1);
        category = categoryResult[0] || null;
      }

      // Get variants
      const variants = await db.select()
        .from(productVariants)
        .where(eq(productVariants.productId, product[0].id));

      return NextResponse.json({
        ...product[0],
        category,
        variants
      });
    }

    // List products with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortField = searchParams.get('sort') ?? 'createdAt';
    const sortOrder = searchParams.get('order') ?? 'desc';

    let query = db.select().from(products);
    const conditions = [];

    // Search by name
    if (search) {
      conditions.push(like(products.name, `%${search}%`));
    }

    // Filter by categoryId
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId);
      if (!isNaN(categoryIdNum)) {
        conditions.push(eq(products.categoryId, categoryIdNum));
      }
    }

    // Filter by isActive
    if (isActive !== null && isActive !== undefined) {
      const isActiveValue = isActive === 'true' ? 1 : 0;
      conditions.push(eq(products.isActive, isActiveValue));
    }

    // Filter by isFeatured
    if (isFeatured !== null && isFeatured !== undefined) {
      const isFeaturedValue = isFeatured === 'true' ? 1 : 0;
      conditions.push(eq(products.isFeatured, isFeaturedValue));
    }

    // Filter by price range
    if (minPrice) {
      const minPriceNum = parseFloat(minPrice);
      if (!isNaN(minPriceNum)) {
        conditions.push(gte(products.basePrice, minPriceNum));
      }
    }

    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      if (!isNaN(maxPriceNum)) {
        conditions.push(lte(products.basePrice, maxPriceNum));
      }
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderColumn = sortField === 'name' ? products.name :
                       sortField === 'basePrice' ? products.basePrice :
                       sortField === 'updatedAt' ? products.updatedAt :
                       products.createdAt;
    
    query = sortOrder === 'asc' 
      ? query.orderBy(asc(orderColumn))
      : query.orderBy(desc(orderColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    // Fetch category and variants for each product
    const productsWithDetails = await Promise.all(
      results.map(async (product) => {
        let category = null;
        if (product.categoryId) {
          const categoryResult = await db.select()
            .from(categories)
            .where(eq(categories.id, product.categoryId))
            .limit(1);
          category = categoryResult[0] || null;
        }

        const variants = await db.select()
          .from(productVariants)
          .where(eq(productVariants.productId, product.id));

        return {
          ...product,
          category,
          variants
        };
      })
    );

    return NextResponse.json({ products: productsWithDetails });
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
    const { 
      name, 
      slug, 
      description, 
      categoryId, 
      basePrice, 
      currency, 
      images, 
      isActive, 
      isFeatured, 
      tags,
      variants 
    } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!slug || slug.trim() === '') {
      return NextResponse.json({ 
        error: "Slug is required",
        code: "MISSING_SLUG" 
      }, { status: 400 });
    }

    if (basePrice === undefined || basePrice === null) {
      return NextResponse.json({ 
        error: "Base price is required",
        code: "MISSING_BASE_PRICE" 
      }, { status: 400 });
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json({ 
        error: "At least one variant is required",
        code: "MISSING_VARIANTS" 
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

    // Check slug uniqueness
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (existingProduct.length > 0) {
      return NextResponse.json({ 
        error: "Slug already exists",
        code: "DUPLICATE_SLUG" 
      }, { status: 400 });
    }

    // Validate basePrice is positive
    const basePriceNum = parseFloat(basePrice);
    if (isNaN(basePriceNum) || basePriceNum <= 0) {
      return NextResponse.json({ 
        error: "Base price must be a positive number",
        code: "INVALID_BASE_PRICE" 
      }, { status: 400 });
    }

    // Validate categoryId if provided
    if (categoryId !== undefined && categoryId !== null) {
      const categoryIdNum = parseInt(categoryId);
      if (isNaN(categoryIdNum)) {
        return NextResponse.json({ 
          error: "Category ID must be a valid integer",
          code: "INVALID_CATEGORY_ID" 
        }, { status: 400 });
      }

      // Check if category exists
      const category = await db.select()
        .from(categories)
        .where(eq(categories.id, categoryIdNum))
        .limit(1);

      if (category.length === 0) {
        return NextResponse.json({ 
          error: "Category not found",
          code: "CATEGORY_NOT_FOUND" 
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const now = Date.now();
    const insertData: any = {
      name: name.trim(),
      slug: slug.trim(),
      basePrice: basePriceNum,
      currency: currency?.trim() || 'USD',
      createdAt: now,
      updatedAt: now,
    };

    if (description !== undefined && description !== null) {
      insertData.description = description.trim();
    }

    if (categoryId !== undefined && categoryId !== null) {
      insertData.categoryId = parseInt(categoryId);
    }

    if (images !== undefined && images !== null) {
      insertData.images = JSON.stringify(images);
    }

    if (isActive !== undefined && isActive !== null) {
      insertData.isActive = isActive ? 1 : 0;
    } else {
      insertData.isActive = 1;
    }

    if (isFeatured !== undefined && isFeatured !== null) {
      insertData.isFeatured = isFeatured ? 1 : 0;
    } else {
      insertData.isFeatured = 0;
    }

    if (tags !== undefined && tags !== null) {
      insertData.tags = JSON.stringify(tags);
    }

    // Insert product
    const newProduct = await db.insert(products)
      .values(insertData)
      .returning();

    // Insert variants
    const productId = newProduct[0].id;
    const variantInserts = variants.map((variant: any, index: number) => ({
      productId,
      sku: `${slug.toUpperCase()}-${variant.size}-${variant.color.substring(0, 3).toUpperCase()}-${Date.now()}-${index}`,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      stockQuantity: parseInt(variant.stockQuantity) || 0,
      additionalPrice: parseFloat(variant.additionalPrice) || 0,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    }));

    await db.insert(productVariants).values(variantInserts);

    // Fetch created variants
    const createdVariants = await db.select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    return NextResponse.json({ 
      ...newProduct[0],
      variants: createdVariants
    }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const productId = parseInt(id);

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, 
      slug, 
      description, 
      categoryId, 
      basePrice, 
      currency, 
      images, 
      isActive, 
      isFeatured, 
      tags 
    } = body;

    const updates: any = {
      updatedAt: Date.now()
    };

    // Validate and update name
    if (name !== undefined) {
      if (name === null || name.trim() === '') {
        return NextResponse.json({ 
          error: "Name cannot be empty",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    // Validate and update slug
    if (slug !== undefined) {
      if (slug === null || slug.trim() === '') {
        return NextResponse.json({ 
          error: "Slug cannot be empty",
          code: "INVALID_SLUG" 
        }, { status: 400 });
      }

      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json({ 
          error: "Slug must contain only lowercase letters, numbers, and hyphens",
          code: "INVALID_SLUG_FORMAT" 
        }, { status: 400 });
      }

      // Check slug uniqueness (exclude current product)
      const existingSlug = await db.select()
        .from(products)
        .where(and(
          eq(products.slug, slug),
          sql`${products.id} != ${productId}`
        ))
        .limit(1);

      if (existingSlug.length > 0) {
        return NextResponse.json({ 
          error: "Slug already exists",
          code: "DUPLICATE_SLUG" 
        }, { status: 400 });
      }

      updates.slug = slug.trim();
    }

    // Update description
    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    // Validate and update categoryId
    if (categoryId !== undefined) {
      if (categoryId !== null) {
        const categoryIdNum = parseInt(categoryId);
        if (isNaN(categoryIdNum)) {
          return NextResponse.json({ 
            error: "Category ID must be a valid integer",
            code: "INVALID_CATEGORY_ID" 
          }, { status: 400 });
        }

        // Check if category exists
        const category = await db.select()
          .from(categories)
          .where(eq(categories.id, categoryIdNum))
          .limit(1);

        if (category.length === 0) {
          return NextResponse.json({ 
            error: "Category not found",
            code: "CATEGORY_NOT_FOUND" 
          }, { status: 400 });
        }

        updates.categoryId = categoryIdNum;
      } else {
        updates.categoryId = null;
      }
    }

    // Validate and update basePrice
    if (basePrice !== undefined) {
      const basePriceNum = parseFloat(basePrice);
      if (isNaN(basePriceNum) || basePriceNum <= 0) {
        return NextResponse.json({ 
          error: "Base price must be a positive number",
          code: "INVALID_BASE_PRICE" 
        }, { status: 400 });
      }
      updates.basePrice = basePriceNum;
    }

    // Update currency
    if (currency !== undefined) {
      updates.currency = currency ? currency.trim() : 'USD';
    }

    // Validate and update images
    if (images !== undefined) {
      if (images !== null) {
        if (!Array.isArray(images)) {
          return NextResponse.json({ 
            error: "Images must be a valid JSON array",
            code: "INVALID_IMAGES_FORMAT" 
          }, { status: 400 });
        }
        updates.images = JSON.stringify(images);
      } else {
        updates.images = null;
      }
    }

    // Update isActive
    if (isActive !== undefined) {
      updates.isActive = isActive ? 1 : 0;
    }

    // Update isFeatured
    if (isFeatured !== undefined) {
      updates.isFeatured = isFeatured ? 1 : 0;
    }

    // Validate and update tags
    if (tags !== undefined) {
      if (tags !== null) {
        if (!Array.isArray(tags)) {
          return NextResponse.json({ 
            error: "Tags must be a valid JSON array",
            code: "INVALID_TAGS_FORMAT" 
          }, { status: 400 });
        }
        updates.tags = JSON.stringify(tags);
      } else {
        updates.tags = null;
      }
    }

    // Update product
    const updatedProduct = await db.update(products)
      .set(updates)
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const productId = parseInt(id);

    // Check if product exists
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete product
    const deletedProduct = await db.delete(products)
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({
      message: 'Product deleted successfully',
      product: deletedProduct[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}