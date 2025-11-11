import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Public order tracking (with email/phone validation)
router.get('/track/:orderNumber', orderController.trackOrderByNumber);

// Protected customer routes
router.get('/customer/:customerId', authenticate, orderController.getCustomerOrders);
router.get('/:orderId/status-history', authenticate, orderController.getOrderStatusHistory);

// Public/Protected routes
router.post('/', orderController.createOrder); // Can be used by guests or authenticated users
router.get('/', authenticate, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);

// Admin/Staff routes
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER), orderController.updateOrder);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), orderController.deleteOrder);

export default router;