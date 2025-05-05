const mongoose = require('mongoose');

const NutritionSchema = new mongoose.Schema({
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true }
}, { _id: false });

const MealSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., Breakfast, Lunch
  dishName: { type: String, required: true },
  description: { type: String, required: true },
  nutrition: { type: NutritionSchema, required: true },
  eaten: { type: Boolean, default: false } // This line adds the 'eaten' field with a default value of false
}, { _id: false });

const DaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  meals: { type: [MealSchema], required: true }
}, { _id: false });

const MealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: 'Custom meal plan generated successfully' },
  days: { type: [DaySchema], required: true },
  notes: { type: [String], default: [] },
  warning: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MealPlan', MealPlanSchema);
