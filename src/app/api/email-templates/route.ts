import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emailTemplates } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, requireRoles, createAuthErrorResponse } from '@/lib/auth';

interface CreateTemplateRequest {
  name: string;
  code: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
}

export async function POST(request: NextRequest) {
  // SECURITY: Only admins can create email templates
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  if (user.role !== 'ADMIN') {
    return createAuthErrorResponse(
      'Only administrators can create email templates',
      403
    );
  }

  try {
    const body: CreateTemplateRequest = await request.json();

    // Validation
    if (!body.name || !body.code || !body.subject || !body.htmlContent) {
      return NextResponse.json({
        error: 'Name, code, subject, and htmlContent are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    // Check for duplicate code
    const existingTemplate = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.code, body.code.toUpperCase()))
      .limit(1);

    if (existingTemplate.length > 0) {
      return NextResponse.json({
        error: 'Email template code already exists',
        code: 'DUPLICATE_CODE'
      }, { status: 400 });
    }

    const now = Date.now();

    const newTemplate = await db.insert(emailTemplates)
      .values({
        name: body.name,
        code: body.code.toUpperCase(),
        subject: body.subject,
        htmlContent: body.htmlContent,
        textContent: body.textContent || null,
        variables: body.variables ? JSON.stringify(body.variables) : null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newTemplate[0], { status: 201 });
  } catch (error) {
    console.error('Create email template error:', error);
    return NextResponse.json({
      error: 'Failed to create email template: ' + (error as Error).message,
      code: 'CREATE_FAILED'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // SECURITY: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  // Only admins and staff can view email templates
  if (!['ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'].includes(user.role)) {
    return createAuthErrorResponse(
      'Insufficient permissions to view email templates',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const code = searchParams.get('code');
    const isActive = searchParams.get('isActive');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get specific template by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid template ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const template = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, parseInt(id)))
        .limit(1);

      if (template.length === 0) {
        return NextResponse.json({
          error: 'Email template not found',
          code: 'TEMPLATE_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(template[0]);
    }

    // Get template by code
    if (code) {
      const template = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.code, code.toUpperCase()))
        .limit(1);

      if (template.length === 0) {
        return NextResponse.json({
          error: 'Email template not found',
          code: 'TEMPLATE_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(template[0]);
    }

    // List templates
    let query = db.select().from(emailTemplates);
    const conditions = [];

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(emailTemplates.isActive, isActive === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(eq(emailTemplates.isActive, isActive === 'true'));
    }

    const results = await query
      .orderBy(desc(emailTemplates.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET email templates error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: Only admins can update email templates
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  if (user.role !== 'ADMIN') {
    return createAuthErrorResponse(
      'Only administrators can update email templates',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid template ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();

    // Fetch existing template
    const existingTemplate = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, parseInt(id)))
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json({
        error: 'Email template not found',
        code: 'TEMPLATE_NOT_FOUND'
      }, { status: 404 });
    }

    // Check for duplicate code if changing code
    if (body.code && body.code.toUpperCase() !== existingTemplate[0].code) {
      const duplicateCheck = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.code, body.code.toUpperCase()))
        .limit(1);

      if (duplicateCheck.length > 0) {
        return NextResponse.json({
          error: 'Email template code already exists',
          code: 'DUPLICATE_CODE'
        }, { status: 400 });
      }
    }

    const now = Date.now();
    const updateData: any = {
      ...body,
      updatedAt: now,
    };

    if (body.code) {
      updateData.code = body.code.toUpperCase();
    }

    if (body.variables) {
      updateData.variables = JSON.stringify(body.variables);
    }

    const updated = await db.update(emailTemplates)
      .set(updateData)
      .where(eq(emailTemplates.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT email templates error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // SECURITY: Only admins can delete email templates
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;

  if (user.role !== 'ADMIN') {
    return createAuthErrorResponse(
      'Only administrators can delete email templates',
      403
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid template ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Soft delete: just deactivate
    const updated = await db.update(emailTemplates)
      .set({
        isActive: false,
        updatedAt: Date.now(),
      })
      .where(eq(emailTemplates.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({
        error: 'Email template not found',
        code: 'TEMPLATE_NOT_FOUND'
      }, { status: 404 });
      }

    return NextResponse.json({
      success: true,
      message: 'Email template deactivated successfully'
    });
  } catch (error) {
    console.error('DELETE email templates error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}
