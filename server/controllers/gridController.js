import { getActionCollection } from '../services/db.js';

export const executeGridAction = async (req, res) => {
  try {
    const payload = req.body;
    const actionCollection = getActionCollection();
    
    let messages = [];
    
    if (Array.isArray(payload)) {
      console.log(`⚡ [Grid Action] Executing Batch Mitigation`);
      const docs = payload.map(item => {
        messages.push(`[AI Chat] Executed ${item.action.toUpperCase()} on ${item.unitId}`);
        return {
          actionName: item.action,
          unitTarget: item.unitId,
          status: 'executed',
          createdAt: new Date()
        };
      });
      await actionCollection.insertMany(docs);
    } else {
      const { actionName, unitTarget, status } = payload;
      console.log(`⚡ [Grid Action] Executing: ${actionName} on ${unitTarget}`);
      messages.push(`[AI Chat] Executed ${actionName.toUpperCase()} on ${unitTarget}`);
      
      await actionCollection.insertOne({
        actionName,
        unitTarget,
        status,
        createdAt: new Date()
      });
    }

    console.log("✅ [Grid Action] Logged successfully.");
    res.json({ status: 'success', messages });
  } catch (error) {
    console.error("❌ [Grid Action Error]:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
