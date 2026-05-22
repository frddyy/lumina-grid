import { PromptTemplate } from '@langchain/core/prompts';
import { getKnowledgeCollection } from '../services/db.js';
import { ai, getLangChainLLM } from '../services/ai.js';

export const analyzeTelemetry = async (req, res) => {
  try {
    const { unitName, status, acPower, dcPower, ambientTemp, moduleTemp, irradiation } = req.body;
    
    const queryString = `Inverter ${unitName} is operating with AC Power ${acPower} and DC Power ${dcPower}. Module Temp is ${moduleTemp} and Ambient Temp is ${ambientTemp} under Irradiation ${irradiation}. Current Status: ${status || 'Unknown'}.`;
    console.log(`🧠 [AI] Formulated Query: "${queryString}"`);

    console.log("⏳ [AI] Generating embedding for query...");
    const embedResponse = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: queryString,
      config: { outputDimensionality: 768 }
    });
    const queryVector = embedResponse.embeddings[0].values;
    console.log("✅ [AI] Embedding generated.");

    console.log("🔍 [MongoDB] Performing vector search...");
    const knowledgeCollection = getKnowledgeCollection();
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 10,
          limit: 2
        }
      },
      {
        $project: {
          incidentText: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];

    const searchResults = await knowledgeCollection.aggregate(pipeline).toArray();
    console.log(`✅ [MongoDB] Retrieved ${searchResults.length} historical incidents.`);

    const contextText = searchResults.map(doc => `- ${doc.incidentText}`).join('\n');
    
    const prompt = `
You are a Senior Solar Panel Technician. Analyze the following live telemetry data and use the provided historical incidents (if relevant) to provide a concise, professional diagnosis and actionable recommendation.

CRITICAL OVERRIDE RULE: If the telemetry data explicitly indicates status: 'Critical', you MUST diagnose this as a catastrophic hardware or communication failure. You must recommend immediate ISOLATION. Do NOT attribute the zero power to low solar irradiation, nighttime, or weather conditions in this state. The Critical status supersedes all environmental logic.

Live Telemetry:
${queryString}

Historical Context (Similar past incidents):
${contextText}

Provide your diagnosis and recommendation in a brief, professional tone.
`;

    console.log("⏳ [AI] Generating diagnosis with gemini-2.5-flash...");
    const generateResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const aiText = generateResponse.text;
    console.log("✅ [AI] Diagnosis generated:\n" + aiText);

    res.json({ status: 'success', diagnosis: aiText });

  } catch (error) {
    console.error("❌ [AI Endpoint Error]:", error);
    res.status(500).json({ 
      status: 'error', 
      message: 'AI diagnostics are temporarily unavailable due to high network traffic. Please try again shortly.', 
      stack: error.stack 
    });
  }
};

export const chatWithAI = async (req, res) => {
  try {
    const { userMessage, gridContext } = req.body;
    console.log(`💬 [AI Chat] Received message: "${userMessage}"`);

    const llm = getLangChainLLM();

    const prompt = PromptTemplate.fromTemplate(`
You are a Senior Grid Manager for a Solar PV Farm. 
You act as an AI Assistant for the human operators.
Provide concise, professional responses. If the user asks for help with degraded units, you can suggest rerouting power or dispatching maintenance.

If the user asks to isolate or reroute a unit, you must include this exact string format in your response: [ACTION:ISOLATE:Unit 12] or [ACTION:REROUTE:Unit 15].

Current Grid Context (Telemetry summary):
{gridContext}

User Message: {userMessage}
`);

    const chain = prompt.pipe(llm);
    
    console.log("⏳ [AI Chat] Generating response via LangChain...");
    const serializedContext = typeof gridContext === 'string' ? gridContext : JSON.stringify(gridContext);
    
    const response = await chain.invoke({
      gridContext: serializedContext || "No telemetry available.",
      userMessage: userMessage
    });
    
    console.log("✅ [AI Chat] Response generated.");
    res.json({ status: 'success', reply: response.content });
  } catch (error) {
    console.error("❌ [AI Chat Error]:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
