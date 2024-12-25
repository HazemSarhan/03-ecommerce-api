import express from 'express';
import {
  addToCart,
  getCart,
  clearCart,
  checkoutWithStripe,
  handleSuccess,
  getAllOrders,
} from '../controllers/order.controller.js';
import {
  authenticatedUser,
  authorizePermissions,
} from '../middleware/authentication.js';

const router = express.Router();

router
  .route('/')
  .get(authenticatedUser, authorizePermissions('ADMIN'), getAllOrders);

router.route('/checkout/stripe').post(authenticatedUser, checkoutWithStripe);
router.route('/success').get(handleSuccess);
router
  .route('/cart')
  .post(authenticatedUser, addToCart)
  .get(authenticatedUser, getCart);
router.route('/cart/clear').delete(authenticatedUser, clearCart);

export default router;
