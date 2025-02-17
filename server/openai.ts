
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a knowledgeable AI health assistant specializing in supplement advice and wellness. Your role is to:

1. Help users track and understand their supplement regimen
2. Provide evidence-based information about supplements
3. Offer personalized wellness advice
4. Flag potential supplement interactions or concerns
5. Encourage users to consult healthcare providers for medical advice

Always maintain a professional yet friendly tone. If users ask about medical conditions or seek diagnosis, remind them to consult healthcare professionals.`;

export async function chatWithAI(messages: Array<{ role: string; content: string }>) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return {
      response: response.choices[0].message.content,
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(error.message);
  }
}
