import { Router } from 'express';
import { streamTelemetry } from '../controllers/telemetryController.js';
import { analyzeTelemetry, chatWithAI } from '../controllers/aiController.js';
import { executeGridAction } from '../controllers/gridController.js';

const router = Router();

// Telemetry route
router.get('/telemetry/stream', streamTelemetry);

// AI routes
router.post('/ai/analyze', analyzeTelemetry);
router.post('/ai/chat', chatWithAI);

// Grid action route
router.post('/grid/execute', executeGridAction);

export default router;
