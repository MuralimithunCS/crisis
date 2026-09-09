import axios from 'axios';
import crypto from 'crypto';

export const getScenariosStatus = (req, res) => {
  res.json({ message: 'Scenarios API ready' });
};

export const simulateScenario = async (req, res) => {
  try {
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';

    const {
      name,
      disasterType,
      magnitude,
      waterLevel,
      windSpeed,
      populationDensity,
      location
    } = req.body || {};

    if (!disasterType || !location?.lat || !location?.lng) {
      return res.status(400).json({ error: 'Missing disasterType or location' });
    }

    const scenario_id = crypto.randomUUID();

    const parameters: any = {};
    if (disasterType === 'earthquake') parameters.magnitude = magnitude ?? 6.0;
    if (disasterType === 'flood') parameters.water_level = waterLevel ?? 2.0;
    if (disasterType === 'cyclone') parameters.wind_speed = windSpeed ?? 80;
    parameters.population_density = populationDensity ?? 5000;

    const aiRequest = {
      scenario_id,
      disaster_type: disasterType,
      parameters,
      location: {
        region: location.region || name || 'Selected area',
        coordinates: [location.lng, location.lat]
      }
    };

    const response = await axios.post(
      `${aiEngineUrl}/simulate/scenario`,
      aiRequest,
      { timeout: 30000 }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Scenario simulation error:', (err as any)?.message || err);
    res.status(502).json({ error: 'Failed to simulate scenario' });
  }
};
