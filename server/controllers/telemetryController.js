import { getCollection } from '../services/db.js';

export const streamTelemetry = async (req, res) => {
  console.log("🟢 [SSE] Frontend Client Connected");
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendData = async () => {
    try {
      const collection = getCollection();
      if (!collection) return;
      
      const query = {};
      const docs = await collection.find(query).sort({ timestamp: -1 }).limit(40).toArray();
      
      if (docs.length === 0) {
        res.write(`data: []\n\n`);
        return;
      }

      const mappedData = docs.map(doc => {
        let name = "PV-INV-000";
        if (doc.unitName) {
          const numMatch = doc.unitName.match(/\d+/);
          if (numMatch) {
             name = `PV-INV-${numMatch[0].padStart(3, '0')}`;
          }
        }
        
        const isDegraded = doc.unitName === 'Unit 12' || doc.unitName === 'Unit 15';

        return {
          id: doc.unitName || 'Unknown',
          name: name,
          current_power_kw: doc.dcPower || 0,
          status: isDegraded ? 'Degraded' : 'Normal',
          solar_irradiation: doc.irradiation || 0,
          last_updated: doc.timestamp ? new Date(doc.timestamp).toISOString() : new Date().toISOString()
        };
      });

      res.write(`data: ${JSON.stringify(mappedData)}\n\n`);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  await sendData(); 
  const intervalId = setInterval(sendData, 3000);

  req.on('close', () => {
    console.log("🔴 [SSE] Frontend Client Disconnected");
    clearInterval(intervalId);
  });
};
