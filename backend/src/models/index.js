const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const DietPlan = require('./dietPlan');
const DietTracker = require('./dietTracker');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  age: {
    type: Number,
    required: function() { return this.profileCompleted; }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: function() { return this.profileCompleted; }
  },
  height: {
    type: Number,
    required: function() { return this.profileCompleted; }
  },
  weight: {
    type: Number,
    required: function() { return this.profileCompleted; }
  },
  bmi: {
    type: Number,
    required: function() { return this.profileCompleted; }
  },
  dietType: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan'],
    required: function() { return this.profileCompleted; }
  },
  fitnessGoal: {
    type: String,
    enum: ['weight-loss', 'weight-gain', 'muscle-building'],
    required: function() { return this.profileCompleted; }
  },
  restrictionsAndAllergies: {
    type: [String],
    default: []
  },
  mealsPerDay: {
    type: Number,
    min: 2,
    max: 6,
    required: function() { return this.profileCompleted; }
  },
  planDuration: {
    type: Number,
    min: 3,
    max: 60,
    required: function() { return this.profileCompleted; }
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash the password if it's modified or new
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = { User, DietPlan, DietTracker };