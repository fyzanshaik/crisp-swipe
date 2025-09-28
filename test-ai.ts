import { generateTextWithModel, getProviderStatus, models } from "./server/utils/ai-models.js";

const testPrompt = "Say 'Hello from' followed by your model name in exactly 5 words.";

async function testProviders() {
  console.log("🔍 Checking provider availability:");
  const status = getProviderStatus();
  status.forEach(provider => {
    console.log(`${provider.available ? '✅' : '❌'} ${provider.name}: ${provider.models.join(', ')}`);
  });

  console.log("\n🧪 Testing AI models:");

  const testModels = [
    { name: "Cerebras GPT-OSS-120B", model: models.cerebrasgptoss120b },
    { name: "Groq Llama 8B", model: models.groqllama8b },
    { name: "Google Gemini 2.5 Flash Lite", model: models.gemini25flashlite },
    { name: "Mistral Large", model: models.mistrallarge },
    { name: "OpenAI GPT-4o-mini", model: models.gpt4omini },
  ];

  for (const { name, model } of testModels) {
    if (!model) {
      console.log(`⏭️ Skipping ${name} - not available`);
      continue;
    }

    try {
      console.log(`🤖 Testing ${name}...`);
      const result = await generateTextWithModel(testPrompt, model);
      console.log(`✅ ${name}: "${result}"`);
    } catch (error) {
      console.log(`❌ ${name}: Error - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log("\n🎯 Testing question generation:");
  try {
    const { generateAllQuestions } = await import("./server/utils/ai-integration.js");
    const questions = await generateAllQuestions("Full Stack Developer", ["React", "Node.js"]);
    console.log(`✅ Generated ${questions.length} questions successfully`);
    console.log(`First question: ${questions[0]?.questionText?.substring(0, 50)}...`);
  } catch (error) {
    console.log(`❌ Question generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

testProviders().catch(console.error);