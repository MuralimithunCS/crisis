import express from 'express';
import * as alertController from '../controllers/alertController.js';

export const alertRouter = express.Router();

alertRouter.get('/', alertController.getAlerts);
alertRouter.get('/active', alertController.getActiveAlerts);
alertRouter.get('/public', alertController.getActiveAlerts);
