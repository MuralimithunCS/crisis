import axios from 'axios';

export const handleChat = async (req, res) => {
  const { message } = req.body;
  if (!message) {
      return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    const response = await axios.post(`${aiEngineUrl}/chat`, { message });
    res.json(response.data);
  } catch (error) {
    console.error('Chat routing error:', (error as any).message);
    res.status(500).json({ error: 'Failed to communicate with AI Assistant' });
  }
};
