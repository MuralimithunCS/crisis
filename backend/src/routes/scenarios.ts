import express from 'express';
import * as scenarioController from '../controllers/scenarioController.js';

export const scenarioRouter = express.Router();

scenarioRouter.get('/', scenarioController.getScenariosStatus);
scenarioRouter.post('/simulate', scenarioController.simulateScenario);
