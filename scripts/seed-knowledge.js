import { MongoClient } from 'mongodb';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is not set in .env");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY is not set in .env");
  process.exit(1);
}

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const incidents = [
  "Sudden drop in AC power while module temperature is above 45C indicates thermal throttling in the inverter.",
  "AC power is 0 but irradiation is high. This indicates a grid disconnection or tripped breaker.",
  "Gradual decline in daily yield over 3 weeks with normal irradiation suggests dust accumulation on panels. Cleaning required.",
  "DC power dropping to near zero during peak sunlight hours points to a blown string fuse or disconnected string.",
  "Inverter reporting 'Isolation Fault' in the morning usually means moisture ingress in the PV connectors overnight.",
  "Consistent 10-15% lower output compared to adjacent units suggests partial shading from newly grown vegetation or a nearby structure.",
  "High ambient temperature combined with low AC output but high DC input indicates a failing inverter cooling fan.",
  "Simultaneous drop in both DC and AC power with no change in irradiation typically means a localized grid overvoltage event caused the inverter to curtail power.",
  "Module temperature reading drastically lower than ambient temperature suggests a failed or disconnected temperature sensor.",
  "Irradiation sensor flatlining at max value while output is normal indicates a sensor calibration failure or physical damage to the pyranometer.",
  "Intermittent loss of telemetry data while inverter continues to produce power suggests unstable local network connection or faulty datalogger.",
  "Rapid fluctuation in AC power output on a clear day indicates MPPT tracking failure or instability in the inverter's control algorithm."
];

async function seedKnowledgeBase() {
  console.log("🚀 Starting Knowledge Base Seeding...");
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(); 
    const collection = db.collection('IncidentKnowledgeBase');
    
    console.log("🟢 Connected to MongoDB. Proceeding to generate embeddings...");

    const documentsToInsert = [];
    
    for (let i = 0; i < incidents.length; i++) {
      const text = incidents[i];
      console.log(`⏳ Generating embedding for incident ${i + 1}/${incidents.length}...`);
      
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: { outputDimensionality: 768 }
      });

      const embedding = response.embeddings[0].values;
      
      documentsToInsert.push({
        incidentText: text,
        embedding: embedding,
        createdAt: new Date()
      });
    }

    console.log(`✅ Successfully generated ${documentsToInsert.length} embeddings.`);
    console.log("⏳ Inserting into MongoDB 'IncidentKnowledgeBase' collection...");
    
    // Optional: Clear existing knowledge base to prevent duplicates on rerun
    await collection.deleteMany({});
    
    const insertResult = await collection.insertMany(documentsToInsert);
    console.log(`✅ Successfully inserted ${insertResult.insertedCount} records into MongoDB.`);

  } catch (error) {
    console.error("❌ An error occurred during seeding:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("🔌 Database connection closed gracefully.");
    }
  }
}

seedKnowledgeBase();
