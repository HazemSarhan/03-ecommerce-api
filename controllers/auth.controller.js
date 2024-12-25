import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../errors/bad-request.js';
import UnauthenticatedError from '../errors/unauthenticated.js';
import { attachCookiesToResponse } from '../utils/jwt.js';
import createTokenUser from '../utils/createTokenUser.js';
import cloudinary from '../configs/cloudinaryConfig.js';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail, sendVerificationCode } from '../configs/sendgridConfig.js';
import twilio from 'twilio';
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const register = async (req, res) => {
  const { name, email, password, phoneNumber, bio } = req.body;
  if (!name || !email || !password) {
    throw new BadRequestError('Please provide all values');
  }

  // Check if the email already exists
  const isEmailExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (isEmailExists) {
    throw new BadRequestError('Email already exists');
  }

  // Check if the phone number already exists
  const isPhoneNumberExists = await prisma.user.findFirst({
    where: {
      phoneNumber: phoneNumber,
    },
  });
  if (isPhoneNumberExists) {
    throw new BadRequestError('Phone number already exists');
  }

  // Set the first registered user as admin
  const isFirstAccount = await prisma.user.count();
  const role = isFirstAccount === 0 ? 'ADMIN' : 'CUSTOMER';

  // Uploading image to the cloud
  let profilePicture = '/uploads/default.jpeg';
  if (req.files && req.files.profilePicture) {
    const result = await cloudinary.uploader.upload(
      req.files.profilePicture.tempFilePath,
      {
        use_filename: true,
        folder: 'lms-images',
      }
    );
    fs.unlinkSync(req.files.profilePicture.tempFilePath);
    profilePicture = result.secure_url;
  }

  // Hashing password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate tokens
  const emailVerificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const hashedEmailToken = crypto
    .createHash('sha256')
    .update(emailVerificationCode)
    .digest('hex');
  const emailTokenExpiration = new Date(Date.now() + 15 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      emailVerificationToken: hashedEmailToken,
      emailTokenExpiration,
      bio,
      profilePicture,
      role,
    },
  });

  // Send verification email
  const emailSubject = 'Your Verification Code';
  const emailBody = `
     <p>Hi ${name},</p>
     <p>Thank you for registering. Please verify your account using the following code:</p>
     <h1>${emailVerificationCode}</h1>
     <p>If you did not register, please ignore this email.</p>
   `;
  await sendEmail(user.email, emailSubject, emailBody);

  res.status(StatusCodes.CREATED).json({
    message: 'Verification codes sent to your email and phone number.',
  });
};

export const verifyWithPhone = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    throw new BadRequestError('Phone number is required');
  }

  const verification = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({
      to: phoneNumber,
      channel: 'sms', // Use 'sms' for text message
    });

  res
    .status(StatusCodes.OK)
    .json({ message: 'Verification code sent via SMS.' });
};

export const verifyUserPhone = async (req, res) => {
  const { phoneNumber, token } = req.body;

  if (!phoneNumber || !token) {
    throw new BadRequestError(
      'Phone number and verification token are required'
    );
  }

  const verificationCheck = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({
      to: phoneNumber,
      code: token,
    });
  if (verificationCheck.status !== 'approved') {
    console.error('Verification failed:', verificationCheck.status);
    throw new BadRequestError('Invalid or expired token');
  }

  const userData = await prisma.user.findFirst({
    where: { phoneNumber },
  });
  if (!userData) {
    throw new BadRequestError('User not found');
  }

  await prisma.user.update({
    where: { id: userData.id },
    data: {
      isPhoneVerified: true,
    },
  });

  res
    .status(StatusCodes.OK)
    .json({ message: 'Phone number verified successfully.' });
};

export const verifyClientEmail = async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    throw new BadRequestError('Email and verification token are required');
  }
  const normalizedEmail = email.toLowerCase();
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      emailVerificationToken: hashedToken,
      emailTokenExpiration: {
        gt: new Date(),
      },
    },
  });
  if (!user) {
    throw new BadRequestError('Invalid or expired token');
  }

  await prisma.user.update({
    where: { email },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailTokenExpiration: null,
    },
  });
  res.status(StatusCodes.OK).json({ message: 'Email verified successfully.' });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError('Please provide all values');
  }

  // Check if the user already exists
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  // Check if the email verified
  if (!user.isEmailVerified && !user.isPhoneVerified) {
    throw new UnauthenticatedError('Please verify your email or phone number');
  }

  // Comparing password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

export const loginWithPhone = async (req, res) => {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber || !password) {
    throw new BadRequestError('Please provide all values');
  }

  // Check if the user already exists
  const user = await prisma.user.findFirst({
    where: {
      phoneNumber,
    },
  });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  // Comparing password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

export const logout = async (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now() + 1 * 1000),
  });
  res.status(StatusCodes.OK).json({ msg: 'User logged out!' });
};
