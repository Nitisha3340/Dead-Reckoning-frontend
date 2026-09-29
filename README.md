# 🚗 Dead Reckoning Navigation System (Frontend)

Welcome to the frontend repository for the **Dead Reckoning Navigation System**. This project is an advanced, AI-powered navigation application designed to provide accurate positioning even when GPS is unavailable. 

> **Note to SIH Evaluators:** This repository contains the **latest React/Vite-based application architecture** which supersedes our earlier static HTML prototype. This new version includes the full UI/UX for both the Driver and Observer views, as well as the client-side ML inference pipeline.

## 🌟 Key Features

1. **Driver App View**: A mobile-optimized interface for drivers to see their live navigation, connection status, and real-time AI dead reckoning data.
2. **Observer Dashboard**: A command-center view for monitoring drift errors, live coordinates, and a visual radar map comparing GPS Ground Truth against AI-Corrected paths.
3. **Edge Inference Engine**: Simulates and manages local sensor data (accelerometer, gyroscope) passing through an AI model to calculate accurate positioning.
4. **Modern Tech Stack**: Built with React, Vite, and high-performance CSS animations for a smooth, premium experience.

## 🚀 How to Run the Project Locally

Follow these steps to start the application on your local machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/Nitisha3340/Dead-Reckoning-frontend.git
   cd Dead-Reckoning-frontend
   ```

2. **Install the dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **View the App**: Open your browser and navigate to the local server URL provided in the terminal (usually `http://localhost:5173`).

---

### Folder Structure

- `/src`: Contains all the React components (`App.jsx`, `DriverApp.jsx`, `ObserverDashboard.jsx`).
- `/src/assets`: Contains images and icons.
- `/ml_pipeline`: Contains the Python machine learning training scripts (`train_model.py`).
