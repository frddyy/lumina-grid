import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("⚡ [Streamer] Error: MONGODB_URI is not set in .env");
  process.exit(1);
}

// Unified date parser
function parseDate(dateStr) {
  if (!dateStr) return 0;
  // Handle DD-MM-YYYY HH:mm or DD-MM-YYYY HH:mm:ss
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
    const [datePart, timePart] = dateStr.split(' ');
    const [dd, mm, yyyy] = datePart.split('-');
    const time = timePart.length === 5 ? timePart + ':00' : timePart;
    return new Date(`${yyyy}-${mm}-${dd}T${time}Z`).getTime();
  }
  // Handle YYYY-MM-DD HH:mm:ss
  return new Date(dateStr.replace(' ', 'T') + 'Z').getTime();
}

function readCSV(filename) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path.join(dataDir, filename))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function main() {
  console.log('⚡ [Streamer] Loading and parsing CSV files...');
  const [p1Gen, p1Wea, p2Gen, p2Wea] = await Promise.all([
    readCSV('Plant_1_Generation_Data.csv'),
    readCSV('Plant_1_Weather_Sensor_Data.csv'),
    readCSV('Plant_2_Generation_Data.csv'),
    readCSV('Plant_2_Weather_Sensor_Data.csv')
  ]);

  console.log('⚡ [Streamer] Extracting unique SOURCE_KEYs and mapping to units...');
  const uniqueKeys = new Set();
  p1Gen.forEach(r => { if (r.SOURCE_KEY) uniqueKeys.add(r.SOURCE_KEY); });
  p2Gen.forEach(r => { if (r.SOURCE_KEY) uniqueKeys.add(r.SOURCE_KEY); });
  
  const unitKeys = Array.from(uniqueKeys).slice(0, 40);
  const keyToUnitName = {};
  unitKeys.forEach((key, index) => {
    const unitNumber = (index + 1).toString().padStart(2, '0');
    keyToUnitName[key] = `Unit ${unitNumber}`;
  });

  console.log('⚡ [Streamer] Joining and formatting data...');
  const p1WeaMap = new Map();
  p1Wea.forEach(r => {
    if (r.DATE_TIME) p1WeaMap.set(parseDate(r.DATE_TIME), r);
  });
  
  const p2WeaMap = new Map();
  p2Wea.forEach(r => {
    if (r.DATE_TIME) p2WeaMap.set(parseDate(r.DATE_TIME), r);
  });

  const combinedData = [];

  function processGenerationData(genData, weaMap) {
    genData.forEach(r => {
      if (!r.SOURCE_KEY || !r.DATE_TIME) return;
      const unitName = keyToUnitName[r.SOURCE_KEY];
      if (!unitName) return; // Only process the top 40 mapped keys
      
      const ts = parseDate(r.DATE_TIME);
      const wea = weaMap.get(ts);
      
      if (wea) {
        combinedData.push({
          unitName,
          timestamp: new Date(ts),
          dcPower: parseFloat(r.DC_POWER || 0),
          acPower: parseFloat(r.AC_POWER || 0),
          dailyYield: parseFloat(r.DAILY_YIELD || 0),
          ambientTemp: parseFloat(wea.AMBIENT_TEMPERATURE || 0),
          moduleTemp: parseFloat(wea.MODULE_TEMPERATURE || 0),
          irradiation: parseFloat(wea.IRRADIATION || 0)
        });
      }
    });
  }

  processGenerationData(p1Gen, p1WeaMap);
  processGenerationData(p2Gen, p2WeaMap);

  console.log(`⚡ [Streamer] Combined data points: ${combinedData.length}. Sorting...`);
  combinedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Group by timestamp to stream in batches
  const batches = [];
  let currentBatch = [];
  let currentTs = combinedData.length > 0 ? combinedData[0].timestamp.getTime() : 0;

  for (const record of combinedData) {
    if (record.timestamp.getTime() === currentTs) {
      currentBatch.push(record);
    } else {
      batches.push(currentBatch);
      currentBatch = [record];
      currentTs = record.timestamp.getTime();
    }
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  console.log(`⚡ [Streamer] Sorted into ${batches.length} chronological batches.`);

  console.log('⚡ [Streamer] Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('InverterTelemetries');
  console.log('🧹 [Streamer] Flushing old telemetry data to prevent storage overflow...');
  await collection.deleteMany({});
  console.log('⚡ [Streamer] Connected! Starting endless stream...');

  let batchIndex = 0;
  let isFlushing = false;

  setInterval(async () => {
    if (isFlushing) return;
    const batch = batches[batchIndex];
    if (!batch || batch.length === 0) return;

    try {
      await collection.insertMany(batch);
      console.log(`⚡ [Streamer] Inserted batch for ${batch[0].timestamp.toISOString()} - ${batch.length} units`);
    } catch (err) {
      console.error('⚡ [Streamer] Error inserting batch:', err);
    }

    batchIndex++;
    if (batchIndex >= batches.length) {
      isFlushing = true;
      try {
        console.log('🧹 [Streamer] Flushing old telemetry data to prevent storage overflow...');
        await collection.deleteMany({});
        batchIndex = 0;
        console.log('⚡ [Streamer] Reached end of data. Restarting stream from the beginning...');
      } catch (err) {
        console.error('⚡ [Streamer] Error flushing data:', err);
      } finally {
        isFlushing = false;
      }
    }
  }, 3000);
}

main().catch(console.error);
