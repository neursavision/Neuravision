import { GoogleGenAI, Type, Modality } from "@google/genai";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper para limpar blocos de código Markdown de respostas JSON ou Texto
const cleanResponseText = (text: string) => {
  if (!text) return "";
  return text.replace(/^```(json|markdown)?\n/i, '').replace(/\n```$/i, '').trim();
};

// 1. Chat Rápido usando Flash-Lite
export const sendFastChatMessage = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  const ai = getClient();
  const chat = ai.chats.create({
    model: 'gemini-flash-lite-latest',
    history: history,
    config: {
      systemInstruction: "Você é um assistente de negócios ágil e estrategista do sistema Neuravision. Forneça respostas concisas e rápidas em Português do Brasil, focando em eficiência operacional e clareza.",
    }
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};

// 2. Diagnóstico Profundo (Thinking Mode - Pro)
export const generateDeepDiagnosis = async (businessData: string, filesData: string[]) => {
  const ai = getClient();
  const prompt = `
    Realize um diagnóstico preditivo profundo para esta empresa (Sistema Neuravision).
    Contexto do Negócio: ${businessData}
    Resumo dos Arquivos/Dados: ${filesData.join('\n')}
    
    INSTRUÇÃO CRÍTICA SOBRE TEXTO:
    O campo 'diagnosis' (Diagnóstico) deve ser EXTENSO, FUNDAMENTADO e TEXTUALMENTE RICO. Não use frases curtas. Escreva parágrafos detalhados explicando a causa raiz dos problemas, o contexto histórico inferido e a fundamentação teórica da análise. O cliente quer ler um relatório completo.
    O mesmo vale para o 'futureOutlook'.
    O campo 'actionPlan' deve ser estruturado em Markdown com títulos (###) e listas (-), detalhando passos táticos.

    Gere uma estrutura JSON VÁLIDA contendo:
    1. Resumo executivo/Diagnóstico (diagnosis) - MÍNIMO DE 500 PALAVRAS.
    2. Plano de ação em markdown (actionPlan) - Detalhado com fases de implementação.
    3. KPIs principais (kpis) - Com status (good, warning, critical).
    4. OKRs Sugeridos (okrs) - Objetivos e Resultados Chave.
    5. Visão de futuro (futureOutlook) - Duas gerações à frente.
    6. Projeção de crescimento financeiro (growthProjection).
    7. Dados para Gráfico Radar de Maturidade Operacional (operationalMaturity) - Compare 'Atual' vs 'Ideal' (0 a 100) em 5 eixos (ex: Tecnologia, Processos, Pessoas, Produto, Mercado).
    8. Dados para Gráfico de Pizza (resourceAllocation) - Sugestão de alocação de recursos/budget (ex: Mkt, P&D, Ops).
    9. Simulação de 3 cenários (simulations).

    Certifique-se de que todos os textos estejam em Português do Brasil.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            diagnosis: { type: Type.STRING, description: "Texto longo e detalhado sobre o diagnóstico da empresa." },
            actionPlan: { type: Type.STRING, description: "Markdown com títulos e bullets." },
            kpis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        value: { type: Type.STRING },
                        target: { type: Type.STRING },
                        status: { type: Type.STRING, enum: ["good", "warning", "critical"] }
                    }
                }
            },
            okrs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        objective: { type: Type.STRING },
                        keyResults: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            },
            operationalMaturity: {
                type: Type.ARRAY,
                description: "Dados para gráfico Radar (Teia de Aranha)",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        A: { type: Type.NUMBER, description: "Valor Atual (0-100)" },
                        B: { type: Type.NUMBER, description: "Valor Ideal/Target (0-100)" },
                        fullMark: { type: Type.NUMBER, description: "Sempre 100" }
                    }
                }
            },
            resourceAllocation: {
                type: Type.ARRAY,
                description: "Dados para gráfico Pizza",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        value: { type: Type.NUMBER }
                    }
                }
            },
            growthProjection: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        month: { type: Type.STRING, description: "Nome abreviado do mês (ex: Jan, Fev)" },
                        revenue: { type: Type.NUMBER, description: "Receita histórica/atual estimada" },
                        projected: { type: Type.NUMBER, description: "Receita futura projetada pela IA" }
                    }
                }
            },
            futureOutlook: { type: Type.STRING },
            simulations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  outcomes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        kpi: { type: Type.STRING },
                        baseline: { type: Type.NUMBER },
                        projected: { type: Type.NUMBER },
                        unit: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
        }
      }
    }
  });

  const rawText = response.text || "{}";
  try {
      return JSON.parse(cleanResponseText(rawText));
  } catch (error) {
      console.error("Erro ao fazer parse do JSON do Gemini:", error, rawText);
      return { 
          diagnosis: "Erro crítico ao processar os dados complexos da IA. Por favor, tente novamente.", 
          actionPlan: "### Erro na Geração\nNão foi possível gerar o plano de ação detalhado. Verifique os dados de entrada.", 
          kpis: [], 
          okrs: [],
          operationalMaturity: [],
          resourceAllocation: [],
          growthProjection: [], 
          futureOutlook: "Indisponível.", 
          simulations: [] 
      };
  }
};

// 3. Análise HBS (Harvard Business School Case Method)
export const generateHBSAnalysis = async (businessContext: string, currentDiagnosis: string) => {
  const ai = getClient();
  const prompt = `
    Atue como um Professor Sênior da Harvard Business School.
    Realize uma análise formal de "Case Study" para a empresa descrita abaixo.
    
    Dados da Empresa: ${businessContext}
    Diagnóstico Preliminar: ${currentDiagnosis}
    
    Estruture a resposta estritamente no formato de Estudo de Caso HBS em Markdown:
    1. **Executive Summary**: Breve resumo da situação.
    2. **Problem Definition**: Qual é o problema raiz central? (Não os sintomas).
    3. **Analysis of Alternatives**: Apresente 3 caminhos estratégicos distintos com Prós e Contras para cada um.
    4. **Recommendation**: Qual caminho seguir e por quê?
    5. **Implementation Plan**: Passos táticos imediatos.
    
    Use tom acadêmico, rigoroso e direto. Português do Brasil.
    NÃO use blocos de código (\`\`\`). Retorne o texto markdown puro.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 } // Deep thinking for case study
    }
  });

  return cleanResponseText(response.text || "");
};

// 4. Text to Speech
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
};

// 5. Video Generation (Veo)
export const generateScenarioVideo = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string | undefined> => {
  const ai = getClient();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio,
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  return operation.response?.generatedVideos?.[0]?.video?.uri;
};

// Helper para decodificação de áudio
export const decodeAudioData = async (
  base64Data: string, 
  ctx: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const channels = 1;
  const sampleRate = 24000;
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(channels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i=0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}