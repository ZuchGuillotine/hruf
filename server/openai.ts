import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a knowledgeable AI health assistant specializing in supplement advice and wellness. Your role is to:

1. Help users track and understand their supplement regimen
2. Provide evidence-based information about supplements
3. Offer personalized wellness advice
4. Flag potential supplement interactions or concerns
5. Encourage users to consult healthcare providers for medical advice

Always maintain a professional yet friendly tone. If users ask about medical conditions or seek diagnosis, remind them to consult healthcare professionals.

When discussing supplements:
- Focus on well-researched benefits and risks
- Mention potential interactions with other supplements or medications
- Emphasize the importance of proper dosing
- Encourage users to maintain consistent tracking

Format responses in a clear, easy-to-read manner. Use markdown for formatting when helpful.`;

export async function chatWithAI(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) {
  try {
    console.log('Making OpenAI request:', {
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('OpenAI response received:', {
      status: 'success',
      messageContent: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    });

    return {
      response: response.choices[0].message.content,
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw new Error(error instanceof Error ? error.message : 'Failed to get AI response');
  }
}