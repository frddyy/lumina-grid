import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not set in .env");
  process.exit(1);
}

let client;
let collection;
let knowledgeCollection;
let actionCollection;

export const connectDB = async () => {
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  collection = db.collection('InverterTelemetries');
  knowledgeCollection = db.collection('IncidentKnowledgeBase');
  actionCollection = db.collection('ActionLogs');
  console.log("Connected to MongoDB, database:", db.databaseName);
};

export const getCollection = () => collection;
export const getKnowledgeCollection = () => knowledgeCollection;
export const getActionCollection = () => actionCollection;
