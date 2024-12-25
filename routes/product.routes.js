import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import {
  authenticatedUser,
  authorizePermissions,
} from '../middleware/authentication.js';

const router = express.Router();

router
  .route('/')
  .post(authenticatedUser, authorizePermissions('ADMIN'), createProduct)
  .get(authenticatedUser, getAllProducts);
router
  .route('/:id')
  .get(authenticatedUser, getProductById)
  .patch(authenticatedUser, authorizePermissions('ADMIN'), updateProduct)
  .delete(authenticatedUser, authorizePermissions('ADMIN'), deleteProduct);

export default router;
