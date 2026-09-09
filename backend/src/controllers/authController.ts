import jwt from 'jsonwebtoken';
import { userStore } from '../config/memoryStore.js';

export const register = async (req: any, res: any, next: any) => {
  try {
    const { email, password, name, phone, role } = req.body;
    
    const existingUser = await userStore.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const user = await userStore.create({
      email,
      password,
      role: role === 'responder' ? 'citizen' : role,
      profile: { name, phone }
    });
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: any, res: any, next: any) => {
  try {
    const { email, password } = req.body;
    
    let user = await userStore.findOne({ email });
    
    // Auto-create demo user if it doesn't exist
    if (!user && email === 'demo@crisisiq.ai') {
        user = await userStore.create({
            email: 'demo@crisisiq.ai',
            role: 'admin',
            profile: { name: 'Demo Admin' }
        });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: any, res: any, next: any) => {
  try {
    const { refreshToken } = req.body;
    
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET || 'refresh_dev_secret_67890') as any;
    const user = await userStore.findById(payload.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const newAccessToken = generateAccessToken(user);
    
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

function generateAccessToken(user: any) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'jwt_dev_secret_12345',
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user: any) {
  return jwt.sign(
    { userId: user._id },
    process.env.REFRESH_SECRET || 'refresh_dev_secret_67890',
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user: any) {
  const { password, ...userObj } = user;
  return userObj;
}
