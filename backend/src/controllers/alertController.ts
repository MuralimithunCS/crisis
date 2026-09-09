import { alertStore } from '../config/memoryStore.js';

export const getAlerts = async (req: any, res: any) => {
  try {
    const { status, limit } = req.query;
    const query = status ? { status } : {};
    const parsedLimit = Math.min(Number(limit) || 50, 200);

    const alerts = await (await alertStore.find(query))
      .limit(parsedLimit);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

export const getActiveAlerts = async (req: any, res: any) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const alerts = await (await alertStore.find({ status: 'active' }))
      .limit(limit);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
};
