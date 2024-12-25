import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCateogry,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticatedUser } from '../middleware/authentication.js';

const router = express.Router();

router
  .route('/')
  .post(authenticatedUser, createCategory)
  .get(authenticatedUser, getAllCategories);
router
  .route('/:id')
  .get(authenticatedUser, getCategoryById)
  .patch(authenticatedUser, updateCateogry)
  .delete(authenticatedUser, deleteCategory);

export default router;
