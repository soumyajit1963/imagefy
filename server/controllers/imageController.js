import axios from 'axios';
import userModel from '../models/userModel.js';
import FormData from 'form-data';

export const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Missing prompt' });
    }

    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.creditBalance <= 0) {
      return res.status(403).json({ success: false, message: 'No Credit Balance', creditBalance: user.creditBalance });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);

    const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
      headers: {
        'x-api-key': process.env.CLIPDROP_API,
        ...formData.getHeaders(),
      },
      responseType: 'arraybuffer',
    });

    const base64Image = Buffer.from(data, 'binary').toString('base64');
    const resultImage = `data:image/png;base64,${base64Image}`;

    user.creditBalance -= 1;
    await user.save();

    res.json({
      success: true,
      message: 'Image Generated',
      creditBalance: user.creditBalance,
      resultImage,
    });
  } catch (error) {
    console.error('Error in generating image:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};