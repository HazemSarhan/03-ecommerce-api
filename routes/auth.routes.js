import express from 'express';
import {
  register,
  verifyClientEmail,
  verifyWithPhone,
  verifyUserPhone,
  loginWithPhone,
  login,
  logout,
} from '../controllers/auth.controller.js';
import passport from 'passport';

const router = express.Router();

router.post('/register', register);
router.post('/verify', verifyClientEmail);
router.post('/verify/phone', verifyWithPhone);
router.post('/verify/user/phone', verifyUserPhone);
router.post('/login/phone', loginWithPhone);
router.post('/login', login);
router.get('/logout', logout);

// Gmail OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: '/',
  })
);
export default router;
