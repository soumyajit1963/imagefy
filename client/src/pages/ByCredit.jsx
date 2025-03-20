import React, { useContext } from 'react';
import { assets, plans } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const ByCredit = () => {
  const { user, backendUrl, loadCreditsData, token, setShowLogin } = useContext(AppContext);
  const navigate = useNavigate();

  // Initialize Razorpay Payment
  const initPay = async (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Razorpay Key ID from environment variables
      amount: order.amount,
      currency: order.currency,
      name: 'Credits Payment',
      description: 'Credits Payment',
      order_id: order.id,
      handler: async (response) => {
        try {
          console.log('Payment Response:', response); // Debugging: Log the response
          console.log('Order Details:', order); // Debugging: Log the order
  
          // Verify the payment on the backend
          const { data } = await axios.post(
            `${backendUrl}/api/user/verify-payment`,
            { response, order }, // Pass both response and order
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          if (data.success) {
            toast.success('Payment successful! Credits added to your account.');
            loadCreditsData(); // Reload user credits
            navigate('/'); // Redirect to the homepage
          } else {
            toast.error('Payment verification failed. Please contact support.');
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          toast.error('Payment verification failed. Please try again.');
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: {
        color: '#3399cc',
      },
    };
  
    const rzp = new window.Razorpay(options);
    rzp.open(); // Correctly call the open function
  };

  // Handle Razorpay Payment
  const paymentRazorpay = async (planId) => {
    try {
      if (!user) {
        setShowLogin(true); // Show login modal if the user is not logged in
        return;
      }

      // Create an order on the backend
      const { data } = await axios.post(
        `${backendUrl}/api/user/pay-razor`,
        { userId: user._id, planId }, // Send userId and planId
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        initPay(data.order); // Initialize Razorpay payment
      } else {
        toast.error(data.message || 'Failed to create Razorpay order.');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="min-h-[80vh] text-center pt-14 mv-10"
    >
      <button className="border border-gray-400 px-10 py-2 rounded-full mb-6">Our Plans</button>
      <h1 className="text-center text-3xl font-medium mb-6 sm:mb-10">Choose the plan</h1>

      <div className="flex flex-wrap justify-center gap-6 text-left">
        {plans.map((item, index) => (
          <div
            key={index}
            className="bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 hover:scale-105 transition-all duration-500"
          >
            <img width={40} src={assets.logo_icon} alt="" />
            <p className="mt-3 mb-1 font-semibold">{item.id}</p>
            <p className="text-sm">{item.desc}</p>
            <p className="mt-6">
              <span className="text-3xl font-medium">${item.price}</span>/{item.credits} credits
            </p>
            <button
              onClick={() => paymentRazorpay(item.id)}
              className="w-full bg-gray-800 text-white mt-8 text-sm rounded-md py-2.5 min-w-52"
            >
              {user ? 'Purchase' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ByCredit;