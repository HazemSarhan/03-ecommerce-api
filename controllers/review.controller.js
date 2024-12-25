import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../errors/bad-request.js';
import NotFoundError from '../errors/not-found.js';

export const createReview = async (req, res) => {
  const { rating, comment, productId } = req.body;
  if (!rating || !comment || !productId) {
    throw new BadRequestError('Please provide all values');
  }
  const userId = req.user.userId;

  // check if the rating between 0 and 5
  if (rating < 0 || rating > 5) {
    throw new BadRequestError('Rating must be between 0 and 5');
  }

  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(productId, 10),
    },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // check if the user has already reviewed the product
  const reviewExists = await prisma.review.findFirst({
    where: {
      userId,
      productId: parseInt(productId, 10),
    },
  });
  if (reviewExists) {
    throw new BadRequestError('You have already reviewed this product');
  }

  const review = await prisma.review.create({
    data: {
      rating: parseInt(rating, 10),
      comment,
      userId,
      productId: parseInt(productId, 10),
    },
  });

  // Update `numberOfReviews` and `averageRating` for the product
  const reviews = await prisma.review.findMany({
    where: {
      productId: parseInt(productId, 10),
    },
    select: {
      rating: true,
    },
  });

  const numberOfReviews = reviews.length;
  const averageRating =
    reviews.reduce((total, review) => total + review.rating, 0) /
    numberOfReviews;

  await prisma.product.update({
    where: {
      id: parseInt(productId, 10),
    },
    data: {
      numberOfReviews,
      averageRating: Math.round(averageRating), // Round to nearest integer
    },
  });
  res.status(StatusCodes.CREATED).json({ review });
};

export const getAllReviews = async (req, res) => {
  const reviews = await prisma.review.findMany();
  res.status(StatusCodes.OK).json({ reviews });
};

export const getReviewById = async (req, res) => {
  const { id: reviewId } = req.params;
  const review = await prisma.review.findUnique({
    where: {
      id: parseInt(reviewId, 10),
    },
  });
  if (!review) {
    throw new NotFoundError('Review not found');
  }
  res.status(StatusCodes.OK).json({ review });
};

export const updateReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { rating, comment } = req.body;
  const review = await prisma.review.findUnique({
    where: {
      id: parseInt(reviewId, 10),
    },
  });
  if (!review) {
    throw new NotFoundError('Review not found');
  }
  const updatedReview = await prisma.review.update({
    where: {
      id: parseInt(reviewId, 10),
    },
    data: {
      rating: parseInt(rating, 10),
      comment,
    },
  });
  res.status(StatusCodes.OK).json({ updatedReview });
};

export const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params;

  const review = await prisma.review.findUnique({
    where: {
      id: parseInt(reviewId, 10),
    },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  await prisma.review.delete({
    where: {
      id: parseInt(reviewId, 10),
    },
  });

  const reviews = await prisma.review.findMany({
    where: {
      productId: review.productId,
    },
    select: {
      rating: true,
    },
  });

  const numberOfReviews = reviews.length;
  const averageRating =
    numberOfReviews > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        numberOfReviews
      : 0;

  await prisma.product.update({
    where: {
      id: review.productId,
    },
    data: {
      numberOfReviews,
      averageRating: Math.round(averageRating),
    },
  });

  res.status(StatusCodes.OK).json({ msg: 'Review deleted' });
};
