# 🌱 NutriGuide – AI-Powered Personalized Diet & Nutrition Planner

**NutriGuide** is a smart AI-powered MERN stack web application that helps users eat better, live healthier, and reach their fitness goals through personalized nutrition planning. Whether you're aiming for **weight loss**, **muscle gain**, or just maintaining a **balanced lifestyle**, NutriGuide provides tailored meal plans, food suggestions, and insightful health analysis—all in one place.

🔗 **Live Now**: [https://neutri-guide.vercel.app/](https://neutri-guide.vercel.app/)

---

## 🚀 Key Features

- 🔐 **Secure Authentication**  
  User registration & login with personalized profiles.

- 🧠 **AI-Powered Meal Planner**  
  Generates **3–30 day meal plans** based on:
  - Age, gender, height, weight, BMI
  - Fitness goals: weight loss, weight gain, muscle gain
  - Diet type: veg / non-veg / vegan
  - Dietary restrictions & allergies
  - Number of meals per day

- 📊 **Macro Visualizations**  
  Interactive pie charts showing **calories**, **protein**, **carbs**, and **fats** for each meal/day.

- 🧾 **Mindful Eating Score**  
  Describe what you ate in a sentence and get:
  - Health score
  - Suggestions for improvement
  - Nutritional breakdown

- 🧑‍⚕️ **Food Doctor**  
  Input symptoms or food-related issues in natural language and receive:
  - Potential nutrient deficiencies
  - Food suggestions to resolve them

- 🍳 **Cooking Companion**  
  Input ingredients + your goal to get:
  - Step-by-step cooking instructions
  - Integrated timers & checkboxes
  - Total cooking time, difficulty level
  - Final nutrition breakdown & macro chart

- 📅 **Dynamic Meal Schedule**  
  Flexible plans generated for **3 to 30 days** with **2–6 meals/day**.

- 📈 **Progress Tracker**  
  Visual dashboards for monitoring BMI, calories, fitness progress, and diet adherence.

- 🌍 **Global + Indian Food Options**  
  Diverse food database (excludes beef) supporting regional dietary preferences.

- 🧠 **Dual Input System**  
  Choose between a **form-based** or **natural language** input for ease of use.

- 📸 **Image Analysis** *(Coming Soon)*  
  Upload food images for nutrition analysis and tracking.

---

## 🛠️ Tech Stack

### 🔷 Frontend
- React.js (Vite)
- Tailwind CSS
- Recharts (macro visualizations)

### 🔶 Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### 🤖 AI & ML
- **Gemini API** – Powers meal planning, suggestions, analysis & recipe generation

---

## 📦 Installation & Setup

### 1. **Clone the Repository**

git clone https://github.com/BhanuNama/Nutri-Guide.git
cd nutri-guide

2. Install Dependencies
Backend:
cd backend
npm install

Frontend:
cd ../frontend
npm install

3. Set Up Environment Variables
Create .env files in both backend and frontend directories with the necessary API keys and configuration (e.g., MongoDB URI, JWT secret, Gemini API key, etc.).

4. Run the Application
Start Backend:
npm start
Start Frontend:
npm run dev
