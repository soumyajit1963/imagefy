import { createContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [credit, setCredit] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const navigate = useNavigate();

  // Function to load user credits
  const loadCreditsData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/credits`, {
        headers: {
          Authorization: `Bearer ${token}`, // Correctly send the token
        },
      });

      if (data.success) {
        setCredit(data.credits); // Set the credit balance
        setUser(data.user); // Set the user data
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed to load credits');
    }
  };

  // Function to generate an image
  const generateImage = async (prompt) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/image/generate-image`,
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Correctly send the token
          },
        }
      );

      if (data.success) {
        loadCreditsData(); // Reload credits after generating the image
        return data.resultImage;
      } else {
        toast.error(data.message);
        loadCreditsData(); // Reload credits even if there's an error
        if (data.creditBalance === 0) {
          navigate('/buy'); // Redirect to buy credits page if balance is 0
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate image');
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  // Load credits when the token changes
  useEffect(() => {
    if (token) {
      loadCreditsData();
    }
  }, [token]);

  const value = {
    user,
    setUser,
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    credit,
    setCredit,
    loadCreditsData,
    logout,
    generateImage,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

export default AppContextProvider;