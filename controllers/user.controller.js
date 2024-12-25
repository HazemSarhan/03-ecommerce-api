import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../errors/bad-request.js';

export const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      reviews: true,
      cart: true,
      orders: true,
    },
  });
  res.status(StatusCodes.OK).json({ users });
};

export const getUserById = async (req, res) => {
  const { id: userId } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      reviews: true,
      cart: true,
      orders: true,
    },
  });
  if (!user) {
    throw new BadRequestError('User not found');
  }
  res.status(StatusCodes.OK).json({ user });
};

export const updateUser = async (req, res) => {
  const { id: userId } = req.params;
  const { name, email, password, bio } = req.body;
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
      email,
      password,
      bio,
    },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      reviews: true,
      cart: true,
      orders: true,
    },
  });
  res.status(StatusCodes.OK).json({ user });
};

export const deleteUser = async (req, res) => {
  const { id: userId } = req.params;
  const user = await prisma.user.delete({
    where: {
      id: userId,
    },
  });
  res.status(StatusCodes.OK).json({ msg: 'User deleted' });
};
