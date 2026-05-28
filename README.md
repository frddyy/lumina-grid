<div align="center">
  <h1>⚡️ LuminaGrid OS</h1>
  <p><b>Proactive AI-Driven Grid Management</b></p>
  
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
</div>

Designed explicitly for the **#JuaraVibeCoding** competition, LuminaGrid transforms grid management from a passive monitoring task into an active, intelligent dialogue.

## The Problem (30% - Target Audience & Impact)
Modern SCADA systems and solar grid management dashboards suffer from overwhelming information density. **Grid Operators** and **Maintenance Engineers** are paralyzed by raw, noisy telemetry streams, forcing them into a cycle of reactive maintenance. Critical anomalies such as sensor dropouts, hardware degradation, or weather-induced efficiency drops often go unnoticed until total failure. By intercepting cognitive overload and automating initial triage, LuminaGrid fixes this reactive cycle—a solution that scales exceptionally well across the global energy industry where operator fatigue is a primary operational risk.

## The Solution (40% - UX & Value Proposition)
LuminaGrid offers a premium, intuitive, and highly functional interface wrapped in a meticulously crafted Apple Pro glassmorphism aesthetic. It turns massive data ingestion into a delightful user experience.
*   **Zero-Latency Telemetry (LKGV)**: We engineered a highly performant Server-Sent Events (SSE) stream with built-in Last Known Good Value (LKGV) logic. This unconditionally eliminates jarring UI flickering during IoT sensor dropouts, guaranteeing a stable, professional, and trustworthy user experience under volatile network conditions.
*   **Immutable Audit Trails**: All human-approved grid interventions are instantly logged to MongoDB Atlas, ensuring rigorous enterprise compliance.

## The Uniqueness (30% - The Spark & AI Elegance)
Instead of treating AI as an afterthought chatbot, LuminaGrid integrates native, low-latency Generative AI models directly into the operational workflow:
*   **RAG AI Diagnose**: Click into any degraded Inverter Unit to launch a deep-dive analysis. The system uses LangChain and Gemini 2.5 Flash to synthesize the live data against historical knowledge, providing instant root-cause diagnostics.
*   **Proactive Weather Co-Pilot**: An intelligent supervisor that monitors external conditions and proactively interrupts the dashboard to propose dynamic **Batch Mitigation and Split-Action** plans.
*   **Autonomous Mitigation with HITL**: The AI formulates precise grid execution commands (Isolate, Reroute). However, via our strict Human-in-the-Loop (HITL) compliance modal, the AI is prevented from autonomous execution. It proposes the elegant JSON execution payload, but the human operator retains absolute control through intentional friction confirmation.

---

## 🚀 Testing & Simulation
For evaluation and judging purposes, LuminaGrid includes built-in developer triggers to simulate real-world grid anomalies:
- **`Shift + W`**: Triggers a simulated Weather Alert (localized rain anomaly), forcing the AI Co-Pilot to calculate a dynamic Split-Action Mitigation plan based on current telemetry.
- **`Shift + C`**: Forcibly overrides Unit 12 to a `CRITICAL` state, simulating a catastrophic hardware failure. This proves the LKGV state persistence override and demonstrates how the AI strictly obeys the Critical Override Rule.

## 📚 Deep Dive Architecture
Curious about the monolithic backend, LKGV state logic, or the LangChain streaming pipeline?
👉 **[Read the complete Engineering Documentation here](./ENGINEERING_DOCUMENTATION.md)**

---

## 🛠 Deployment & Quick Start Guide

LuminaGrid is architected as a Cloud-Native Monolith, serving both the React frontend and the Express API concurrently on a single port.

### Google Cloud Run Deployment
Deploying LuminaGrid to production takes exactly one command. Ensure you have the `gcloud` CLI installed and authenticated:

```bash
gcloud run deploy luminagrid --source . --region asia-southeast2 --allow-unauthenticated --quiet --set-env-vars="MONGODB_URI=<URI>,GEMINI_API_KEY=<KEY>"
```

### Local Execution
To run LuminaGrid on your local machine:

**1. Clone & Install**
```bash
git clone https://github.com/frddyy/lumina-grid.git
cd luminagrid
npm install
```

**2. Configure Environment Variables**
Create a `.env` file in the root directory:
```env
MONGODB_URI="your_mongodb_atlas_connection_string"
GEMINI_API_KEY="your_gemini_api_key"
```

**3. Build and Serve Monolith**
```bash
# Build the Vite React frontend into /dist
npm run build

# Start the Monolithic Express server and telemetry streamer concurrently on Port 8080
npm run serve-all
```
Visit `http://localhost:8080` in your browser to command the grid.
