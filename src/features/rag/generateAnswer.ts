import "server-only";
import { ai } from "@/infra/ai";



export async function generateAnswer(
  context: string,
  question: string
) {

  const response =
    await ai.chat.completions.create({

      model: process.env.AI_MODEL_CHAT! || "gpt-5-mini",

      messages: [

        {
          role: "system",

          content: `You are Selene, a helpful AI assistant that answers questions using the provided document context.

Behavior:

1. For greetings, thanks, introductions, or casual conversation:
   - Respond naturally and politely.
   - Do not search the document for these messages.
   - Examples:
     - "Hi" → "Hello! How can I help you with this document?"
     - "Thanks" → "You're welcome."

2. For document-related questions:
   - Use only the provided document context.
   - Do not use outside knowledge.
   - If the answer is not found in the context, respond:
     "I could not find this in the document."

3. Format all document answers in Markdown.
   - Use headings, bullet points, and lists when helpful.
   - Keep answers clear and concise.

4. Never invent information that is not present in the document.

5. When appropriate, suggest a few follow-up questions the user could ask about the document.
          `
        },


        {
          role: "user",

          content: `
Document context:

${context}


Question:

${question}
          `
        }

      ]

    });


  return response
    .choices[0]
    .message
    .content;

}