import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../errors/bad-request.js';
import NotFoundError from '../errors/not-found.js';
import cloudinary from '../configs/cloudinaryConfig.js';
import fs from 'fs';

export const createProduct = async (req, res) => {
  const { name, description, price, stockNumber, categoryId } = req.body;
  if (!name || !description || !price || !stockNumber || !categoryId) {
    throw new BadRequestError('Please provide all values');
  }

  // check for category availablity
  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(categoryId, 10),
    },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  let image = '/uploads/default.jpeg';
  if (req.files && req.files.image) {
    const result = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: 'lms-images',
      }
    );
    fs.unlinkSync(req.files.image.tempFilePath);
    image = result.secure_url;
  }

  const stockStatus = stockNumber > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      stockNumber: parseInt(stockNumber, 10),
      stockStatus,
      categoryId: parseInt(categoryId, 10),
      image,
    },
  });

  res.status(StatusCodes.CREATED).json({ product });
};

export const getAllProducts = async (req, res) => {
  const products = await prisma.product.findMany();
  res.status(StatusCodes.OK).json({ products });
};

export const getProductById = async (req, res) => {
  const { id: productId } = req.params;
  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(productId, 10),
    },
  });
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  res.status(StatusCodes.OK).json({ product });
};

export const updateProduct = async (req, res) => {
  const { id: productId } = req.params;
  const { name, description, price, stockNumber, categoryId } = req.body;

  const category = await prisma.category.findUnique({
    where: {
      id: parseInt(categoryId, 10),
    },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(productId, 10),
    },
  });

  console.log(product);

  let image = product.image;
  if (req.files && req.files.image) {
    const result = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: 'lms-images',
      }
    );
    fs.unlinkSync(req.files.image.tempFilePath);
    image = result.secure_url;
  }

  const updatedProduct = await prisma.product.update({
    where: {
      id: parseInt(productId, 10),
    },
    data: {
      name,
      description,
      price,
      stockNumber,
      categoryId: parseInt(categoryId, 10),
      image,
    },
  });

  // stock logic
  if (stockNumber < 1) {
    product.stockStatus = 'OUT_OF_STOCK';
  }

  res.status(StatusCodes.OK).json({ product: updatedProduct });
};

export const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(productId, 10),
    },
  });
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  const deletedProduct = await prisma.product.delete({
    where: {
      id: parseInt(productId, 10),
    },
  });
  res.status(StatusCodes.OK).json({ msg: 'Product deleted' });
};
