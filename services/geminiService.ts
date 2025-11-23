import { GoogleGenAI } from "@google/genai";
import { CalculatedPlan, UserSelection } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIAdvice = async (
  query: string,
  calculatedPlans: CalculatedPlan[],
  userSelection: UserSelection,
  // Fix: Change parts type from tuple [{text: string}] to array {text: string}[] to match calling code inference
  chatHistory: { role: string, parts: { text: string }[] }[]
) => {
  try {
    const modelId = 'gemini-2.5-flash';

    // Serialize context
    const selectionSummary = Object.entries(userSelection)
      .filter(([_, count]) => count > 0)
      .map(([age, count]) => `${count}x pessoas (${age} anos)`)
      .join(', ');

    const topPlans = calculatedPlans.slice(0, 3).map(p => {
      const typeLabel = p.plan.type === 'Enfermaria' ? '' : `(${p.plan.type})`;
      return `- ${p.plan.operator} ${p.plan.name} ${typeLabel}: R$ ${p.totalPrice.toFixed(2)}`;
    }).join('\n');

    const systemInstruction = `
      Você é um consultor especialista em planos de saúde da "TEM Saúde", focado na região de Sorocaba - SP.
      
      Contexto atual do usuário:
      - Perfil Familiar/Empresarial: ${selectionSummary}
      - Planos disponíveis para o tipo de contratação selecionado (PF ou PJ) - Top 3 cotados:
      ${topPlans}

      Objetivo:
      Ajudar o usuário a escolher o melhor plano baseando-se em custo-benefício, rede credenciada (Unimed, Amil, GNDI, Hapvida, Fênix, Eva, Amhemed) e necessidades específicas.
      
      Regras de Negócio Importantes:
      1. Amhemed e Fênix costumam ser opções mais econômicas.
      2. Unimed Sorocaba é referência em rede credenciada, mas costuma ser mais caro.
      3. GNDI (Notredame) tem rede própria forte.
      4. Se for PJ (CNPJ/MEI), destaque que os preços costumam ser menores que Pessoa Física.
      5. Para grupos grandes (+30 vidas), mencione a possibilidade de negociação especial.

      Se o usuário perguntar "qual o melhor", pondere entre preço e qualidade.
      Seja conciso, amigável e profissional. Responda em Markdown simples.
    `;

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
      },
      history: chatHistory,
    });

    const result = await chat.sendMessage({
      message: query
    });

    return result.text;

  } catch (error) {
    console.error("Error querying Gemini:", error);
    return "Desculpe, estou com dificuldades para analisar os planos agora. Tente novamente em instantes.";
  }
};