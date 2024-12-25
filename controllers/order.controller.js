import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '..//errors/bad-request.js';
import NotFoundError from '../errors/not-found.js';
import stripe from '../configs/stripeConfig.js';
import { sendEmail } from '../configs/sendgridConfig.js';

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;
  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(productId, 10),
    },
  });
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const cartItem = await prisma.cart.upsert({
    where: {
      productId_userId: {
        productId: parseInt(productId, 10),
        userId,
      },
    },
    update: {
      quantity: {
        increment: parseInt(quantity, 10),
      },
    },
    create: {
      productId: parseInt(productId, 10),
      userId,
      quantity: parseInt(quantity, 10),
    },
  });

  res.status(StatusCodes.CREATED).json({ cartItem });
};

export const getCart = async (req, res) => {
  const userId = req.user.userId;
  const cartItems = await prisma.cart.findMany({
    where: {
      userId,
    },
  });
  res.status(StatusCodes.OK).json({ cartItems });
};

export const clearCart = async (req, res) => {
  const userId = req.user.userId;
  await prisma.cart.deleteMany({
    where: {
      userId,
    },
  });
  res.status(StatusCodes.OK).json({ msg: 'Cart cleared' });
};

export const checkoutWithStripe = async (req, res) => {
  const clientId = req.user.userId;

  const cartItems = await prisma.cart.findMany({
    where: { userId: clientId },
    include: { product: true },
  });

  if (!cartItems || cartItems.length === 0) {
    throw new BadRequestError('Cart is empty');
  }

  const lineItems = cartItems.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.product.name,
      },
      unit_amount: Math.round(item.product.price * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    payment_method_options: {
      card: {
        request_three_d_secure: 'any',
      },
    },
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`, // Ensure correct success URL
    cancel_url: `${process.env.CLIENT_URL}/order/cancel`,
    metadata: {
      clientId,
    },
  });

  res.status(StatusCodes.OK).json({ url: session.url });
};

export const handleSuccess = async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    throw new BadRequestError('Session ID is missing');
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);
  const userId = session.metadata.clientId;

  const cartItems = await prisma.cart.findMany({
    where: { userId },
    include: { product: true },
  });

  if (!cartItems || cartItems.length === 0) {
    throw new BadRequestError('Cart is empty');
  }

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  const order = await prisma.order.create({
    data: {
      userId,
      paymentId: session.payment_intent,
      totalPrice,
      status: 'COMPLETED',
      orderItems: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.product.price,
        })),
      },
    },
  });

  // Send confirmation mail
  const user = await prisma.user.findUnique({
    where: {
      id: order.userId,
    },
  });

  await sendEmail(
    user.email,
    'Order Completed',
    `Hi ${user.name}, <br><br> Your order has been completed with price of ${order.totalPrice}$`
  );

  await prisma.cart.deleteMany({
    where: { userId },
  });

  res.redirect(`${process.env.CLIENT_URL}/order/success?order_id=${order.id}`);
};

export const getAllOrders = async (req, res) => {
  const orders = await prisma.order.findMany({});

  res.status(StatusCodes.OK).json({ orders });
};
