import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['earthquake', 'flood', 'fire', 'cyclone', 'tsunami', 'landslide', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'monitoring', 'resolved'],
    default: 'active'
  },
  title: { type: String, required: true },
  description: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    address: String,
    region: String,
    country: String
  },
  affectedRadius: Number, // km
  source: {
    type: { type: String, enum: ['user', 'api', 'sensor', 'government'] },
    reference: String,
    confidence: Number
  },
  aiAnalysis: {
    riskScore: Number,
    impactPrediction: {
      estimatedAffected: Number,
      infrastructureRisk: String,
      economicImpact: String
    },
    recommendations: [String],
    evacuationRoutes: [{
      origin: { type: { type: String }, coordinates: [Number] },
      destination: { type: { type: String }, coordinates: [Number] },
      distance: Number,
      duration: Number,
      polyline: String
    }],
    resourceNeeds: {
      medical: Number,
      shelter: Number,
      food: Number,
      rescue: Number
    },
    processedAt: Date
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  updates: [{
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

alertSchema.index({ location: '2dsphere' });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ type: 1, status: 1 });

export const Alert = mongoose.model('Alert', alertSchema);
