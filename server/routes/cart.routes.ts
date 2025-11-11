import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, cartController.getCart);
router.post('/items', authenticate, cartController.addToCart);
router.put('/items/:id', authenticate, cartController.updateCartItem);
router.delete('/items/:id', authenticate, cartController.removeFromCart);
router.delete('/', authenticate, cartController.clearCart);

export default router;
