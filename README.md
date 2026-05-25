<div align="center">
  <h1>⚡️ LuminaGrid</h1>
  <p><b>Proactive AI-Driven Grid Management</b></p>
  
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
</div>

## The Vision
LuminaGrid represents the next generation of enterprise SCADA interfaces. We recognized that modern grid operators are paralyzed by data density, forced into reactive maintenance due to overwhelming sensor noise. Designed for the **#JuaraVibeCoding** competition, this application intercepts cognitive overload by fusing high-performance telemetry streaming with proactive AI reasoning.

Wrapped in a meticulously crafted, premium Apple Pro glassmorphism aesthetic, LuminaGrid transforms grid management from a passive monitoring task into an active, intelligent dialogue. It doesn't just show you that a unit is failing—it tells you why, factors in ambient weather data, proposes an optimal load-balancing strategy, and executes your approved commands directly to the database.

## 🚀 Key Features

*   📡 **Live Telemetry Engine**: Zero-latency Server-Sent Events (SSE) stream processing with built-in Last Known Good Value (LKGV) logic to eliminate UI flickering during IoT sensor dropouts.
*   ✨ **RAG AI Diagnose**: Click into any degraded Inverter Unit to launch a deep-dive analysis. The system uses LangChain and Gemini 2.5 Flash to synthesize the live data against historical knowledge, providing instant root-cause diagnostics.
*   🌦 **Proactive Weather Alert Co-Pilot**: An intelligent supervisor that monitors external conditions (like incoming rain) and proactively intercepts the dashboard. It proposes dynamic **Batch Mitigation and Split-Action** plans (automatically distinguishing between CRITICAL and DEGRADED units).
*   🛡 **Intentional Friction Confirmation Modals**: To prevent unsafe load balancing operations, all critical actions now trigger an explicit confirmation overlay, demanding human oversight before altering grid variables.
*   🔐 **State Override & Audit Trails**: Human-in-the-Loop execution. Isolating a unit visually locks it offline globally while writing an immutable compliance log to MongoDB.


## 🧪 Testing & Simulation
For evaluation and judging purposes, LuminaGrid includes built-in developer triggers to simulate real-world grid anomalies:
- **`Shift + W`**: Triggers a simulated Weather Alert (localized rain anomaly), forcing the AI Co-Pilot to calculate a dynamic Split-Action Mitigation plan based on current telemetry.
- **`Shift + C`**: Forcibly overrides Unit 12 to a `CRITICAL` state, simulating a catastrophic hardware failure (injecting FAULT/ERROR diagnostic codes and 0% efficiency). This proves the LKGV state persistence override and demonstrates how the AI strictly obeys the Critical Override Rule, explicitly forbidding "safe" environmental diagnoses (like low irradiation) during hardware emergencies.

## 🛠️ Data Attribution & Acknowledgements
The real-time IoT inverter telemetry simulation in LuminaGrid is driven by historical solar plant production metrics. Special thanks to the open-source data community for providing the foundational dataset:
- **Dataset Source**: [Solar Power Generation Data (Kaggle)](https://www.kaggle.com/datasets/anikannal/solar-power-generation-data)

## 📚 Deep Dive Architecture
Curious about the engineering behind the LKGV state logic or the LangChain streaming pipeline?
👉 **[Read the complete Engineering Documentation here](./ENGINEERING_DOCUMENTATION.md)**

---

## 🛠 Quick Start Guide

**1. Clone the Repository**
```bash
git clone https://github.com/yourusername/luminagrid.git
cd luminagrid
```

**2. Install Dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
Create a `.env` file in the root directory and add your keys:
```env
# MongoDB Atlas Connection String
MONGODB_URI="your_mongodb_atlas_connection_string"

# Google Gemini API Key
GEMINI_API_KEY="your_gemini_api_key"
```

**4. Launch the Application**
LuminaGrid requires the backend, frontend, and data streamer to run concurrently. We recommend opening three terminal tabs:

*Terminal 1: Start the Backend API*
```bash
node server/server.js
```

*Terminal 2: Start the Data Streamer*
```bash
node scripts/streamer.js
```

*Terminal 3: Start the Vite Frontend*
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser to command the grid.
