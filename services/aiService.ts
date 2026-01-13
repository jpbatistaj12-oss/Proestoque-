
import { GoogleGenAI } from "@google/genai";

// Fix: Strictly follow the guideline for initializing GoogleGenAI with process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Você é o "Marmobot", o assistente inteligente oficial do sistema Marmoraria Control.
Seu objetivo é ajudar proprietários e colaboradores de marmorarias a usar o software.
Tópicos que você domina:
1. Cadastro de chapas e fotos.
2. Registro de sobras e desenho de geometria (polígonos).
3. Rastreabilidade por QR Code.
4. Gestão de equipe e permissões.
5. Gestão de faturamento para o Super Admin.

Instruções de Estilo:
- Seja profissional, mas amigável e direto.
- Se o usuário perguntar algo fora do contexto de marmoraria ou do software, tente gentilmente trazer o assunto de volta.
- Use emojis relacionados (🏗️, 📐, 💎, 📱) ocasionalmente.
- Responda sempre em Português do Brasil.
`;

export const getBotResponse = async (userMessage: string, history: { role: string, parts: string }[] = []) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Desculpe, tive um problema ao processar sua resposta. Pode repetir?";
  } catch (error) {
    console.error("Erro no Marmobot:", error);
    return "Estou passando por uma manutenção momentânea, mas posso tentar te ajudar com as funções básicas do menu!";
  }
};
