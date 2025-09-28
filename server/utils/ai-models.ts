import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { cohere } from "@ai-sdk/cohere";
import { groq } from "@ai-sdk/groq";
import { cerebras } from "@ai-sdk/cerebras";
import {
  generateObject,
  generateText,
  streamObject,
  streamText,
  type LanguageModel,
} from "ai";

const providers = {
  cerebras: {
    available: !!process.env.CEREBRAS_API_KEY,
    models: {
      "gpt-oss-120b": cerebras("gpt-oss-120b"),
      "llama-3.1-8b": cerebras("qwen-3-coder-480b"),
    }
  },
  openai: {
    available: !!process.env.OPENAI_API_KEY,
    models: {
      "gpt-4o": openai("gpt-4o"),
      "gpt-4o-mini": openai("gpt-4o-mini"),
      "gpt-4.1-mini": openai("gpt-4.1-mini"),
      "o1-mini": openai("o1-mini"),
    }
  },
  groq: {
    available: !!process.env.GROQ_API_KEY,
    models: {
      "llama-3.1-8b": groq("llama-3.1-8b-instant"),
      "mixtral-8x7b": groq("mixtral-8x7b-32768"),
      "gemma2-9b": groq("gemma2-9b-it"),
    }
  },
  google: {
    available: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    models: {
      "gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
      "gemini-2.5-pro": google("gemini-2.5-pro"),
      "gemini-2.5-flash": google("gemini-2.5-flash"),
    }
  },
  mistral: {
    available: !!process.env.MISTRAL_API_KEY,
    models: {
      "mistral-large": mistral("mistral-large-latest"),
      "mistral-small": mistral("mistral-small-latest"),
    }
  },
  cohere: {
    available: !!process.env.COHERE_API_KEY,
    models: {
      "command-a-03-2025": cohere("command-a-03-2025"),
      "command-r-plus": cohere("command-r-plus"),
    }
  }
};

export const getDefaultModel = (): LanguageModel => {
  if (providers.cerebras.available) return providers.cerebras.models["gpt-oss-120b"];
  if (providers.groq.available) return providers.groq.models["llama-3.1-8b"];
  if (providers.openai.available) return providers.openai.models["gpt-4o-mini"];
  if (providers.google.available) return providers.google.models["gemini-2.5-flash-lite"];

  throw new Error("No AI providers available");
};

export const generateTextWithModel = async (
  prompt: string,
  model?: LanguageModel,
  system?: string
) => {
  const selectedModel = model || getDefaultModel();

  const { text } = await generateText({
    model: selectedModel,
    prompt,
    system,
  });

  return text;
};

export const generateObjectWithModel = async <T>(
  prompt: string,
  schema: any,
  model?: LanguageModel,
  system?: string
): Promise<T> => {
  const selectedModel = model || getDefaultModel();

  const { object } = await generateObject({
    model: selectedModel,
    schema,
    prompt,
    system,
  });

  return object as T;
};

export const streamTextWithModel = async (
  prompt: string,
  model?: LanguageModel,
  system?: string
) => {
  const selectedModel = model || getDefaultModel();

  const { textStream } = streamText({
    model: selectedModel,
    prompt,
    system,
  });

  return textStream;
};

export const streamObjectWithModel = async (
  prompt: string,
  schema: any,
  model?: LanguageModel,
  system?: string
) => {
  const selectedModel = model || getDefaultModel();

  const result = streamObject({
    model: selectedModel,
    schema,
    prompt,
    system,
  });

  return result;
};

export const askWithModel = async (
  prompt: string,
  model: LanguageModel,
  system?: string
) => {
  const { text } = await generateText({
    model,
    prompt,
    system,
  });
  return text;
};

export const getProviderStatus = () => {
  return Object.entries(providers).map(([name, provider]) => ({
    name,
    available: provider.available,
    models: Object.keys(provider.models)
  }));
};

export const getAvailableModels = (): Record<string, LanguageModel> => {
  const availableModels: Record<string, LanguageModel> = {};

  Object.entries(providers).forEach(([providerName, provider]) => {
    if (provider.available) {
      Object.entries(provider.models).forEach(([modelName, model]) => {
        availableModels[`${providerName}:${modelName}`] = model;
      });
    }
  });

  return availableModels;
};

export const models = {
  gpt4o: providers.openai.available ? providers.openai.models["gpt-4o"] : null,
  gpt4omini: providers.openai.available ? providers.openai.models["gpt-4o-mini"] : null,
  gpt41mini: providers.openai.available ? providers.openai.models["gpt-4.1-mini"] : null,
  o1mini: providers.openai.available ? providers.openai.models["o1-mini"] : null,

  gemini25flashlite: providers.google.available ? providers.google.models["gemini-2.5-flash-lite"] : null,
  gemini25pro: providers.google.available ? providers.google.models["gemini-2.5-pro"] : null,
  gemini25flash: providers.google.available ? providers.google.models["gemini-2.5-flash"] : null,

  groqllama8b: providers.groq.available ? providers.groq.models["llama-3.1-8b"] : null,
  groqmixtral: providers.groq.available ? providers.groq.models["mixtral-8x7b"] : null,
  groqgemma: providers.groq.available ? providers.groq.models["gemma2-9b"] : null,

  cerebrasgptoss120b: providers.cerebras.available ? providers.cerebras.models["gpt-oss-120b"] : null,
  cerebrasllama8b: providers.cerebras.available ? providers.cerebras.models["llama-3.1-8b"] : null,

  mistrallarge: providers.mistral.available ? providers.mistral.models["mistral-large"] : null,
  mistralsmall: providers.mistral.available ? providers.mistral.models["mistral-small"] : null,

  commanda032025: providers.cohere.available ? providers.cohere.models["command-a-03-2025"] : null,
  commandrplus: providers.cohere.available ? providers.cohere.models["command-r-plus"] : null,
};