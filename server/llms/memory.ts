import { supermemoryTools } from "@supermemory/ai-sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
const result = await generateText({
  model: openai("gpt-5"),
  messages: [
    { role: "user", content: "What do you remember about my preferences?" },
  ],
  tools: {
    ...supermemoryTools(
      "sm_UZH92SYmHiqraNwYSFaKnL_GbpZeSBlUaGXfOnIgiYzkOsCllYwMCjZeAAQjlFaFABGzBFcDNkqDNYfIJJItDUL",
      {
        containerTags: ["user_id_life"],
      },
    ),
  },
});

console.log(result);
