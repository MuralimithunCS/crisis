import express from 'express';
import { validateRegistration, validateLogin } from '../validators/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refresh);

export { router as authRouter };
