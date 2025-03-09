
import OpenAI from "openai";

// Ensure API key is present
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * System prompt that defines the AI assistant's behavior and capabilities
 */
export const SYSTEM_PROMPT = `You are a friendly and insightful assistant designed to help users reflect on their supplement regimen and share qualitative feedback about their experiences. Your role is to engage the user with thoughtful follow-up questions and encourage detailed responses about how specific supplements are affecting their mood, energy, and overall well-being.`;

// Model configuration
export const MODELS = {
  QUALITATIVE_CHAT: "4o-mini", // For qualitative feedback chat
  QUERY_CHAT: "o3-mini-2025-01-31" // For general supplement queries
};

/**
 * Main function to interact with OpenAI's chat API
 * @param messages - Array of message objects containing role and content
 * @param modelOverride - Optional parameter to override the default model
 * @returns AsyncGenerator yielding streaming chunks of the AI's response
 */
export async function* chatWithAI(
  messages: Array<{ role: string; content: string }>, 
  modelOverride?: string
) {
  try {
    const model = modelOverride || MODELS.QUALITATIVE_CHAT;
    
    console.log('Starting chatWithAI:', {
      messageCount: messages.length,
      model: model,
      lastMessage: messages[messages.length - 1]?.content.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        }))
      ],
      max_completion_tokens: 500,
      stream: true
    });

    console.log('Stream created, starting to process chunks');

    let fullResponse = "";

    // Process each chunk from the stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";

      if (content) {
        console.log('Processing chunk:', {
          chunkLength: content.length,
          preview: content.substring(0, 30),
          timestamp: new Date().toISOString()
        });

        fullResponse += content;
        yield { response: content, streaming: true };
      }
    }

    console.log('Stream completed:', {
      totalLength: fullResponse.length,
      timestamp: new Date().toISOString()
    });

    // Send final confirmation
    yield { response: "", streaming: false };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}
