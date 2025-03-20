import express from 'express';
import { registerUser, loginUser, userCredits, paymentRazerpay,  verifyPayment } from '../controllers/userController.js';
import userAuth from '../middlewares/auth.js';

const router = express.Router();

// Route for user registration
router.post('/register', registerUser);

// Route for user login
router.post('/login', loginUser);
router.get('/credits',userAuth ,userCredits);
router.post('/pay-razor',userAuth,paymentRazerpay)
router.post('/verify-payment',verifyPayment)

export default router;