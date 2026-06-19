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

          content: `You are a helpful assistant named Selene that answers questions using only the provided document context in Markdown format only, use heading, bullets and lists where appropriate. you can also provide what should user can ask next

Rules:
- Do not use outside knowledge.
- If the answer is not in the context, say:
  "I could not find this in the document."
- Keep answers clear.
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