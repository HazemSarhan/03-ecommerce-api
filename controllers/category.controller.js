import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../errors/bad-request.js';
import NotFoundError from '../errors/not-found.js';

export const createCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new BadRequestError('Please provide all values');
  }
  const category = await prisma.category.create({
    data: {
      name,
      description,
    },
  });
  res.status(StatusCodes.CREATED).json({ category });
};

export const getAllCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        select: {
          id: true,
          name: true,
          price: true,
          stockNumber: true,
          stockStatus: true,
        },
      },
    },
  });
  res.status(StatusCodes.OK).json({ categories });
};

export const getCategoryById = async (req, res) => {
  const { id: categoryId } = req.params;
  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(categoryId, 10),
    },
  });
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  res.status(StatusCodes.OK).json({ category });
};

export const updateCateogry = async (req, res) => {
  const { name, description } = req.body;
  const { id: categoryId } = req.params;
  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(categoryId, 10),
    },
  });
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  const updatedCategory = await prisma.category.update({
    where: {
      id: parseInt(categoryId, 10),
    },
    data: {
      name,
      description,
    },
  });
  res.status(StatusCodes.OK).json({ category: updatedCategory });
};

export const deleteCategory = async (req, res) => {
  const { id: categoryId } = req.params;
  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(categoryId, 10),
    },
  });
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  const deletedCategory = await prisma.category.delete({
    where: {
      id: parseInt(categoryId, 10),
    },
  });
  res.status(StatusCodes.OK).json({ msg: 'Category deleted' });
};
