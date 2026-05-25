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
    You are a Senior Grid Manager for a Solar PV Farm acting as an AI Assistant.
    Your job is to analyze the Grid Context and recommend operational mitigations based strictly on the telemetry data.

    ABSOLUTE RULES (MUST FOLLOW):
    1. An "anomaly" is STRICTLY defined as a unit with status: 'Critical' or 'Degraded'.
    2. IGNORE ALL power fluctuations for units with status: 'Normal'. Do not report them as anomalies under any circumstances.
    3. If a unit is 'Critical', you MUST recommend isolation and include this exact tag: [ACTION:ISOLATE:Unit X]
    4. If a unit is 'Degraded', you MUST recommend rerouting and include this exact tag: [ACTION:REROUTE:Unit Y]
    5. If there are multiple anomalies, you must output multiple action tags in your response on separate lines.

    EXAMPLE OUTPUT FORMAT:
    Grid telemetry scan complete. I have identified the following anomalies:
    - Unit 1: Status is 'Critical'.
    - Unit 2: Status is 'Degraded'.
    Recommended Operational Mitigation Actions:
    [ACTION:ISOLATE:Unit 1]
    [ACTION:REROUTE:Unit 2]

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

    console.log("✅ [AI Chat] Response generated:\n", response.content);
    res.json({ status: 'success', reply: response.content });
  } catch (error) {
    console.error("❌ [AI Chat Error]:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
