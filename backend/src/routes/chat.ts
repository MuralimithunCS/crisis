import express from 'express';
import * as chatController from '../controllers/chatController.js';

export const chatRouter = express.Router();

chatRouter.post('/', chatController.handleChat);
