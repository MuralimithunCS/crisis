import mongoose from 'mongoose';

const scenarioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  disasterType: {
    type: String,
    enum: ['earthquake', 'flood', 'fire', 'cyclone', 'tsunami', 'landslide', 'pandemic'],
    required: true
  },
  parameters: {
    magnitude: Number,        // For earthquakes
    waterLevel: Number,       // For floods (meters)
    windSpeed: Number,        // For cyclones (km/h)
    affectedArea: Number,     // sq km
    populationDensity: Number,
    infrastructure: {
      hospitals: Number,
      schools: Number,
      emergencyShelters: Number
    }
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    region: String
  },
  simulation: {
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'] },
    results: {
      survivalProbability: Number,
      estimatedCasualties: {
        min: Number,
        max: Number,
        expected: Number
      },
      displacedPopulation: Number,
      responseTimeEstimate: Number, // minutes
      resourceAllocation: mongoose.Schema.Types.Mixed,
      evacuationPlan: mongoose.Schema.Types.Mixed,
      timeline: [{
        hour: Number,
        event: String,
        recommendation: String
      }]
    },
    completedAt: Date
  },
  isPublic: { type: Boolean, default: false }
}, { timestamps: true });

export const Scenario = mongoose.model('Scenario', scenarioSchema);
