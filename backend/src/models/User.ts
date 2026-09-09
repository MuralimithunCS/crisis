import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['citizen', 'responder', 'admin'],
    default: 'citizen'
  },
  profile: {
    name: String,
    phone: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String
    }]
  },
  preferences: {
    notifications: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: true }
    },
    alertRadius: { type: Number, default: 50 } // km
  },
  fcmTokens: [String],
  lastActive: Date,
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.index({ 'profile.location': '2dsphere' });

userSchema.pre('save', async function(this: any, next: any) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(this: any, candidatePassword: any) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
