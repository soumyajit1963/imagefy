import userModel from "../models/userModel.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import razorpay from 'razorpay'
import transactionModel from "../models/transactionModel.js";

const registerUser = async (req, res) => {
  try {
    console.log('Register Request Body:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing Details' });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = { name, email, password: hashedPassword };
    const newUser = new userModel(userData);
    const user = await newUser.save();

    console.log('New User Created:', user);

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ success: true, token, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error('Error in Register User:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    console.log('Login Request Body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Missing Email or Password' });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User does not exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({ success: true, token, user: { name: user.name } });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (error) {
    console.error('Error in Login User:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const userCredits = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      credits: user.creditBalance || 0, // Default to 0 if creditBalance is undefined
      user: { name: user.name },
    });
  } catch (error) {
    console.error('Error in fetching user credits:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentRazerpay = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ success: false, message: 'Missing Details' });
    }

    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let credits, plan, amount;

    switch (planId) {
      case 'Basic':
        plan = 'Basic';
        credits = 100;
        amount = 10;
        break;

      case 'Advanced':
        plan = 'Advanced';
        credits = 500;
        amount = 50;
        break;

      case 'Business':
        plan = 'Business';
        credits = 5000;
        amount = 250;
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid Plan ID' });
    }

    const transactionData = {
      userId,
      plan,
      amount,
      credits,
      date: Date.now(),
    };

    const newTransaction = await transactionModel.create(transactionData);

    const options = {
      amount: amount * 100, // Convert to paise
      currency: process.env.CURRENCY || 'INR',
      receipt: newTransaction._id.toString(),
    };

    razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.error('Error creating Razorpay order:', error.message);
        return res.status(500).json({ success: false, message: error.message });
      }
      res.json({ success: true, order });
    });
  } catch (error) {
    console.error('Error in paymentRazerpay:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const verifyPayment = async (req, res) => {
  try {
    const { response, order } = req.body;

    console.log('Payment Response:', response); // Debugging: Log the response
    console.log('Order Details:', order); // Debugging: Log the order

    const body = `${response.razorpay_order_id}|${response.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('Expected Signature:', expectedSignature); // Debugging: Log the expected signature
    console.log('Received Signature:', response.razorpay_signature); // Debugging: Log the received signature

    if (expectedSignature !== response.razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const transaction = await transactionModel.findOneAndUpdate(
      { _id: order.receipt, payment: false },
      { payment: true },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const user = await userModel.findById(transaction.userId);

    if (user) {
      user.creditBalance += transaction.credits;
      await user.save();
    }

    res.json({ success: true, message: 'Payment verified and credits added' });
  } catch (error) {
    console.error('Error in verifyPayment:', error.message);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

export {registerUser,loginUser,userCredits,paymentRazerpay,verifyPayment}