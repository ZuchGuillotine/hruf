
import OpenAI from "openai";

// Ensure API key is present
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * System prompt that defines the AI assistant's behavior and capabilities
 * This prompt instructs the AI to act as a supplement advisor and feedback collector
 */
export const SYSTEM_PROMPT = `You are a friendly and insightful assistant designed to help users reflect on their supplement regimen and share qualitative feedback about their experiences. Your role is to engage the user with thoughtful follow-up questions and encourage detailed responses about how specific supplements are affecting their mood, energy, and overall well-being. Your tone should be supportive but authoritative as you are an expert on the subject matter.

Context:
- You will receive two types of context data:
  1. Quantitative supplementation logs (e.g., supplement names, dosages, frequencies, dates).
  2. Summaries or recent qualitative logs from previous conversations.
- Please integrate this context intelligently into your reply without directly listing all raw data.

Instructions:
1. Review the provided context and ask the user follow-up questions that are tailored to their supplement regimen.
2. Encourage the user to provide detailed qualitative feedback about their experiences.
3. Remind the user to save the conversation by using the visible "Save" button if they find the discussion helpful.
4. Do not include any diagnostic or treatment advice or warnings.
5. Do include high level information about the supplements the user is taking.
6. Keep your tone supportive, engaging, and focused on helping the user reflect on their supplementation experience.`;

/**
 * Main function to interact with OpenAI's chat API
 * @param messages - Array of message objects containing role and content
 * @returns Promise containing the AI's response
 */
export async function chatWithAI(messages: Array<{ role: string; content: string }>) {
  try {
    // Send request to OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using optimized GPT-4 model
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7, // Balanced between creativity and consistency
      max_tokens: 500, // Limit response length for conciseness
    });

    return {
      response: response.choices[0].message.content,
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(error.message);
  }
}
