import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.id) {
      req.body.userId = tokenDecode.id; // Attach userId to the request body
      next();
    } else {
      return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid Token. Login Again' });
  }
};

export default userAuth;