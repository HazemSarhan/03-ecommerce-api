import express from 'express';
import {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import {
  authenticatedUser,
  authorizePermissions,
} from '../middleware/authentication.js';
const router = express.Router();

router
  .route('/')
  .post(authenticatedUser, createReview)
  .get(authenticatedUser, getAllReviews);
router
  .route('/:id')
  .get(authenticatedUser, getReviewById)
  .patch(authenticatedUser, authorizePermissions('ADMIN'), updateReview)
  .delete(authenticatedUser, authorizePermissions('ADMIN'), deleteReview);

export default router;
