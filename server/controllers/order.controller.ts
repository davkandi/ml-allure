import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { 
  createOrderSchema, 
  updateOrderStatusSchema,
  CreateOrderInput 
} from '../schemas/orderSchemas';
import { 
  trackOrderByNumberSchema,
  customerOrdersQuerySchema,
} from '../schemas/orderTrackingSchemas';
import { calculateDeliveryFee } from '../utils/calculateDeliveryFee';
import { DeliveryMethod, PaymentMethod, InventoryChangeType, TransactionStatus, OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generate unique order number
 * Format: MLA-YYYYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `MLA-${year}${month}${day}-${random}`;
}

/**
 * Track order by order number (Public with validation)
 * GET /api/orders/:orderNumber
 * Requires email or phone for guest order security
 */
export const trackOrderByNumber = async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const validation = trackOrderByNumberSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation échouée',
        errors: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { email, phone } = validation.data;

    // Find order with all related data
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isGuest: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
            variant: {
              select: {
                size: true,
                color: true,
                colorHex: true,
                sku: true,
              },
            },
          },
        },
        statusHistory: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
            // Don't expose sensitive payment details
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ 
        message: 'Commande introuvable',
        orderNumber,
      });
    }

    // Security validation: verify email or phone matches
    const emailMatches = email && order.customer.email.toLowerCase() === email.toLowerCase();
    const phoneMatches = phone && order.customer.phone === phone;

    if (!emailMatches && !phoneMatches) {
      return res.status(403).json({ 
        message: 'Email ou numéro de téléphone ne correspond pas',
      });
    }

    // Format response (remove sensitive data)
    const response = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryMethod: order.deliveryMethod,
      deliveryAddress: order.deliveryAddress,
      deliveryZone: order.deliveryZone,
      deliveryFee: Number(order.deliveryFee),
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      customer: {
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        email: order.customer.email,
        phone: order.customer.phone,
      },
      items: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        priceAtPurchase: Number(item.priceAtPurchase),
        variant: {
          size: item.variant.size,
          color: item.variant.color,
          colorHex: item.variant.colorHex,
          sku: item.variant.sku,
        },
        product: {
          name: item.product.name,
          slug: item.product.slug,
          images: item.product.images,
        },
      })),
      statusHistory: order.statusHistory.map(history => ({
        id: history.id,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        notes: history.notes,
        createdAt: history.createdAt,
        changedBy: history.user ? {
          name: `${history.user.firstName} ${history.user.lastName}`,
        } : null,
      })),
      paymentInfo: {
        method: order.paymentMethod,
        status: order.paymentStatus,
        // Don't expose payment references or sensitive details
      },
    };

    res.json({ order: response });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Échec du suivi de la commande' });
  }
};

/**
 * Get all orders for a specific customer (Protected)
 * GET /api/orders/customer/:customerId
 * Supports filtering by status, date range, and pagination
 */
export const getCustomerOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    
    // Validate query parameters
    const validation = customerOrdersQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Paramètres de requête invalides',
        errors: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { status, startDate, endDate, page, limit } = validation.data;

    // Build where clause
    const where: any = {
      customerId,
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: true,
              },
            },
            variant: {
              select: {
                size: true,
                color: true,
                colorHex: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Format response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      deliveryMethod: order.deliveryMethod,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      itemCount: order._count.orderItems,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      items: order.orderItems.map(item => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        priceAtPurchase: Number(item.priceAtPurchase),
        variant: {
          size: item.variant.size,
          color: item.variant.color,
          colorHex: item.variant.colorHex,
        },
        product: {
          name: item.product.name,
          slug: item.product.slug,
          images: item.product.images,
        },
      })),
    }));

    res.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ message: 'Échec de la récupération des commandes' });
  }
};

/**
 * Get order status history (Protected)
 * GET /api/orders/:orderId/status-history
 * Returns timeline of status changes with timestamps and who made changes
 */
export const getOrderStatusHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        status: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    // Get status history
    const statusHistory = await prisma.orderStatusHistory.findMany({
      where: {
        orderId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format for timeline component
    const timeline = statusHistory.map(history => ({
      id: history.id,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      timestamp: history.createdAt,
      notes: history.notes,
      changedBy: history.user ? {
        name: `${history.user.firstName} ${history.user.lastName}`,
        email: history.user.email,
        role: history.user.role,
      } : {
        name: 'Système',
        email: null,
        role: null,
      },
    }));

    res.json({
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      timeline,
      totalChanges: timeline.length,
    });
  } catch (error) {
    console.error('Get status history error:', error);
    res.status(500).json({ message: 'Échec de la récupération de l\'historique' });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};

    // If not admin, only show user's own orders
    if (req.user!.role === 'CUSTOMER') {
      where.userId = req.user!.id;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.userId !== req.user!.id && req.user!.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validation = createOrderSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const orderData: CreateOrderInput = validation.data;

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Handle customer (authenticated or guest)
      let customerId: string;

      if (orderData.customerId) {
        // Verify customer exists
        const customer = await tx.customer.findUnique({
          where: { id: orderData.customerId },
        });

        if (!customer) {
          throw new Error('Client introuvable');
        }

        customerId = orderData.customerId;

        // Update customer info if saveCustomerInfo is true
        if (orderData.saveCustomerInfo && orderData.guestInfo) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              firstName: orderData.guestInfo.firstName,
              lastName: orderData.guestInfo.lastName,
              email: orderData.guestInfo.email,
              phone: orderData.guestInfo.phone,
            },
          });
        }
      } else if (orderData.guestInfo) {
        // Create guest customer
        const guestCustomer = await tx.customer.create({
          data: {
            email: orderData.guestInfo.email,
            firstName: orderData.guestInfo.firstName,
            lastName: orderData.guestInfo.lastName,
            phone: orderData.guestInfo.phone,
            isGuest: true,
            userId: req.user?.id ? String(req.user.id) : undefined,
          },
        });

        customerId = guestCustomer.id;
      } else {
        throw new Error('Informations client requises');
      }

      // Step 2: Validate stock availability for all items
      const unavailableItems: string[] = [];
      const itemsWithDetails = [];

      for (const item of orderData.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
              },
            },
          },
        });

        if (!variant) {
          throw new Error(`Variante introuvable: ${item.variantId}`);
        }

        if (!variant.isActive || !variant.product) {
          throw new Error(`Produit non disponible: ${variant.product?.name || item.variantId}`);
        }

        // Check stock
        if (variant.stockQuantity < item.quantity) {
          unavailableItems.push(
            `${variant.product.name} (${variant.size}, ${variant.color}) - Stock disponible: ${variant.stockQuantity}`
          );
        }

        itemsWithDetails.push({
          ...item,
          variant,
          product: variant.product,
          priceAtPurchase: Number(variant.product.basePrice) + Number(variant.additionalPrice),
        });
      }

      // If any items are out of stock, return error
      if (unavailableItems.length > 0) {
        throw new Error(
          `Articles non disponibles en stock:\n${unavailableItems.join('\n')}`
        );
      }

      // Step 3: Calculate subtotal
      const subtotal = itemsWithDetails.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      // Step 4: Calculate delivery fee
      const deliveryZone = orderData.deliveryAddress?.zone;
      const deliveryFeeResult = orderData.deliveryMethod === DeliveryMethod.HOME_DELIVERY
        ? calculateDeliveryFee(deliveryZone, subtotal)
        : { fee: 0, zone: 'N/A', currency: 'USD', isFree: true, freeDeliveryThreshold: 0 };

      const deliveryFee = deliveryFeeResult.fee;
      const total = subtotal + deliveryFee;

      // Step 5: Generate unique order number
      let orderNumber = generateOrderNumber();
      
      // Ensure uniqueness
      let existingOrder = await tx.order.findUnique({
        where: { orderNumber },
      });

      while (existingOrder) {
        orderNumber = generateOrderNumber();
        existingOrder = await tx.order.findUnique({
          where: { orderNumber },
        });
      }

      // Step 6: Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: 'PENDING',
          paymentMethod: orderData.paymentMethod,
          paymentStatus: 'PENDING',
          paymentReference: orderData.paymentReference,
          deliveryMethod: orderData.deliveryMethod,
          deliveryAddress: orderData.deliveryAddress
            ? (orderData.deliveryAddress as any)
            : null,
          deliveryZone: deliveryZone || null,
          deliveryFee: new Decimal(deliveryFee),
          subtotal: new Decimal(subtotal),
          total: new Decimal(total),
          source: 'ONLINE',
          notes: orderData.notes,
        },
      });

      // Step 6.1: Create initial status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING,
          changedBy: req.user?.id ? String(req.user.id) : null,
          notes: 'Commande créée',
        },
      });

      // Step 7: Create order items and deduct stock
      const orderItems = [];
      
      for (const item of itemsWithDetails) {
        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            variantId: item.variant.id,
            quantity: item.quantity,
            priceAtPurchase: new Decimal(item.priceAtPurchase),
            productName: item.product.name,
            variantDetails: {
              size: item.variant.size,
              color: item.variant.color,
              colorHex: item.variant.colorHex,
              sku: item.variant.sku,
            },
          },
        });

        orderItems.push(orderItem);

        // Deduct stock from variant
        const previousQuantity = item.variant.stockQuantity;
        const newQuantity = previousQuantity - item.quantity;

        await tx.productVariant.update({
          where: { id: item.variant.id },
          data: { stockQuantity: newQuantity },
        });

        // Create inventory log
        if (req.user?.id) {
          await tx.inventoryLog.create({
            data: {
              variantId: item.variant.id,
              changeType: InventoryChangeType.SALE,
              quantityChange: -item.quantity,
              previousQuantity,
              newQuantity,
              reason: `Vente - Commande ${orderNumber}`,
              performedBy: String(req.user.id),
              orderId: order.id,
            },
          });
        }
      }

      // Step 8: Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          amount: new Decimal(total),
          method: orderData.paymentMethod === PaymentMethod.MOBILE_MONEY 
            ? 'MOBILE_MONEY' 
            : 'CASH',
          provider: orderData.paymentMethod === PaymentMethod.MOBILE_MONEY 
            ? 'M-Pesa/Airtel/Orange' 
            : null,
          reference: orderData.paymentReference,
          status: TransactionStatus.PENDING,
        },
      });

      // Return complete order with relations
      return {
        order: {
          ...order,
          subtotal: Number(order.subtotal),
          deliveryFee: Number(order.deliveryFee),
          total: Number(order.total),
        },
        orderItems: orderItems.map(item => ({
          ...item,
          priceAtPurchase: Number(item.priceAtPurchase),
        })),
        transaction: {
          ...transaction,
          amount: Number(transaction.amount),
        },
        deliveryFeeDetails: deliveryFeeResult,
      };
    });

    // Success response
    return res.status(201).json({
      message: 'Commande créée avec succès',
      orderNumber: result.order.orderNumber,
      order: result.order,
      items: result.orderItems,
      transaction: result.transaction,
      deliveryFeeDetails: result.deliveryFeeDetails,
      paymentInstructions: result.order.paymentMethod === PaymentMethod.MOBILE_MONEY
        ? {
            message: 'Veuillez effectuer le paiement via Mobile Money',
            providers: ['M-Pesa: +243 XXX XXX XXX', 'Airtel Money: +243 XXX XXX XXX', 'Orange Money: +243 XXX XXX XXX'],
            reference: result.order.orderNumber,
          }
        : {
            message: 'Paiement à la livraison',
            note: 'Veuillez préparer le montant exact',
          },
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    
    // Handle specific errors
    if (error.message.includes('Articles non disponibles')) {
      return res.status(400).json({ 
        message: error.message,
        type: 'STOCK_ERROR' 
      });
    }

    if (error.message.includes('Client introuvable')) {
      return res.status(404).json({ message: error.message });
    }

    if (error.message.includes('Informations client requises')) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ 
      message: 'Échec de la création de la commande',
      error: error.message 
    });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validation = updateOrderStatusSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { status, paymentStatus, notes } = validation.data;

    // Use transaction to update order and create status history
    const result = await prisma.$transaction(async (tx) => {
      // Get current order status
      const currentOrder = await tx.order.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!currentOrder) {
        throw new Error('Commande introuvable');
      }

      // Update order
      const order = await tx.order.update({
        where: { id },
        data: {
          status,
          paymentStatus,
          notes,
          completedAt: status === 'DELIVERED' ? new Date() : undefined,
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Create status history entry if status changed
      if (status && status !== currentOrder.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: currentOrder.status,
            toStatus: status,
            changedBy: req.user?.id ? String(req.user.id) : null,
            notes: notes || `Statut changé de ${currentOrder.status} à ${status}`,
          },
        });
      }

      return order;
    });

    res.json({ message: 'Commande mise à jour avec succès', order: result });
  } catch (error: any) {
    console.error('Update order error:', error);
    
    if (error.message === 'Commande introuvable') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Échec de la mise à jour de la commande' });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.order.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Failed to delete order' });
  }
};