import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, customers, products, productVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requireRoles, createAuthErrorResponse } from '@/lib/auth';

interface PackingSlipData {
  order: any;
  customer: any;
  items: Array<{
    productName: string;
    variantDetails: any;
    quantity: number;
    sku: string;
  }>;
  generatedAt: string;
}

function generatePackingSlipHTML(data: PackingSlipData): string {
  const { order, customer, items, generatedAt } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Packing Slip - ${order.orderNumber}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }

    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
    }

    .header p {
      margin: 5px 0;
      color: #666;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .info-box {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }

    .info-box p {
      margin: 5px 0;
    }

    .info-box strong {
      display: inline-block;
      width: 120px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th {
      background: #333;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }

    tr:hover {
      background: #f5f5f5;
    }

    .totals {
      margin-top: 20px;
      text-align: right;
    }

    .totals table {
      margin-left: auto;
      width: 300px;
    }

    .totals td {
      padding: 8px;
    }

    .totals .total-row {
      font-weight: bold;
      font-size: 18px;
      border-top: 2px solid #000;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .signature-box {
      margin-top: 40px;
      border: 1px solid #ccc;
      padding: 20px;
    }

    .signature-line {
      border-top: 1px solid #000;
      margin-top: 60px;
      padding-top: 5px;
      text-align: center;
    }

    .print-button {
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin: 20px auto;
      display: block;
    }

    .print-button:hover {
      background: #45a049;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print Packing Slip</button>

  <div class="header">
    <h1>PACKING SLIP</h1>
    <p><strong>ML Allure</strong></p>
    <p>E-commerce Platform</p>
  </div>

  <div class="section">
    <div class="info-grid">
      <div class="info-box">
        <div class="section-title">Order Information</div>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Order Status:</strong> ${order.status}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      </div>

      <div class="info-box">
        <div class="section-title">Customer Information</div>
        <p><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        ${customer.phone ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ''}
      </div>
    </div>
  </div>

  ${order.deliveryAddress ? `
  <div class="section">
    <div class="section-title">Shipping Address</div>
    <div class="info-box">
      ${typeof order.deliveryAddress === 'string'
        ? `<p>${order.deliveryAddress}</p>`
        : `
          <p>${order.deliveryAddress.street || ''}</p>
          <p>${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} ${order.deliveryAddress.zipCode || ''}</p>
          <p>${order.deliveryAddress.country || ''}</p>
        `
      }
      ${order.deliveryZone ? `<p><strong>Delivery Zone:</strong> ${order.deliveryZone}</p>` : ''}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Order Items</div>
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Product</th>
          <th>Variant</th>
          <th style="text-align: center;">Quantity</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.sku}</td>
            <td>${item.productName}</td>
            <td>
              ${item.variantDetails?.size ? `Size: ${item.variantDetails.size}` : ''}
              ${item.variantDetails?.color ? ` | Color: ${item.variantDetails.color}` : ''}
            </td>
            <td style="text-align: center;"><strong>${item.quantity}</strong></td>
            <td>
              <input type="checkbox" /> Picked<br/>
              <input type="checkbox" /> Packed
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td>$${order.subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Delivery Fee:</td>
        <td>$${order.deliveryFee.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td>Total:</td>
        <td>$${order.total.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  ${order.notes ? `
  <div class="section">
    <div class="section-title">Order Notes</div>
    <div class="info-box">
      <p>${order.notes}</p>
    </div>
  </div>
  ` : ''}

  <div class="signature-box">
    <p><strong>Packed by:</strong></p>
    <div class="signature-line">
      Signature & Date
    </div>
  </div>

  <div class="footer">
    <p>Generated: ${generatedAt}</p>
    <p>ML Allure - E-commerce Platform</p>
  </div>
</body>
</html>
  `;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // SECURITY: Require authentication
  const authCheck = requireAuth(request);

  if (!authCheck.success) {
    return createAuthErrorResponse(
      authCheck.authResult.error || 'Authentication required',
      401
    );
  }

  const user = authCheck.authResult.user!;
  const { orderId } = await params;

  // Only staff and admins can generate packing slips
  if (!['ADMIN', 'INVENTORY_MANAGER', 'SALES_STAFF'].includes(user.role)) {
    return createAuthErrorResponse(
      'Insufficient permissions to generate packing slips',
      403
    );
  }

  try {
    // Validate order ID
    if (!orderId || isNaN(parseInt(orderId))) {
      return NextResponse.json({
        error: 'Valid order ID is required',
        code: 'INVALID_ORDER_ID'
      }, { status: 400 });
    }

    // Fetch order
    const order = await db.select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, { status: 404 });
    }

    const currentOrder = order[0];

    // Fetch customer
    const customer = await db.select()
      .from(customers)
      .where(eq(customers.id, currentOrder.customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      }, { status: 404 });
    }

    // Fetch order items with product and variant details
    const items = await db.select()
      .from(orderItems)
      .where(eq(orderItems.orderId, currentOrder.id));

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const variant = await db.select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId))
          .limit(1);

        return {
          productName: item.productName,
          variantDetails: item.variantDetails,
          quantity: item.quantity,
          sku: variant.length > 0 ? variant[0].sku : 'N/A',
        };
      })
    );

    const packingSlipData: PackingSlipData = {
      order: currentOrder,
      customer: customer[0],
      items: enrichedItems,
      generatedAt: new Date().toLocaleString(),
    };

    const html = generatePackingSlipHTML(packingSlipData);

    // Return HTML response
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Packing slip generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate packing slip: ' + (error as Error).message,
      code: 'GENERATION_FAILED'
    }, { status: 500 });
  }
}
