import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { TutorResponse, AudioInput } from "../types";

// Schema for the AI Tutor response
const tutorResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transcription: {
      type: Type.STRING,
      description: "The transcription of what the user said or wrote. If audio, write what was heard in Darija/Arabic script.",
    },
    translation: {
      type: Type.STRING,
      description: "A direct English translation of the transcription.",
    },
    explanation: {
      type: Type.STRING,
      description: "An English explanation of the meaning and grammar of the input.",
    },
    vocabulary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The Darija word/phrase in 'Arabic Script (Latin Script)' format." },
          meaning: { type: Type.STRING, description: "English meaning." },
          notes: { type: Type.STRING, description: "Grammar or usage notes." },
        },
        required: ["word", "meaning"],
      },
    },
  },
  required: ["transcription", "translation", "explanation", "vocabulary"],
};

const SYSTEM_INSTRUCTION = `
You are an expert Moroccan Darija (Moroccan Arabic) tutor. 
Your goal is to help the user practice by analyzing their input (text or audio).

1. **Analyze**: Understand the user's Darija input.
2. **Transcribe**: If input is audio, transcribe it accurately in Darija (Arabic script). If text, correct any typos.
3. **Translate**: Provide a direct, natural English translation of what was said.
4. **Explain**: Provide a clear, concise English explanation of the grammar, meaning, and cultural context.
5. **Extract Vocabulary**: Identify key words or phrases.
6. **Formatting Strictness**: 
   - ALWAYS provide Darija words in both Arabic Script and Latin Script in parentheses. 
   - Example: "كيف داير (Kif dayr)" or "لاباس (Labas)".
   - This applies to the 'transcription' (if mixing scripts helps, but prefer Arabic script mostly) and especially the 'vocabulary' fields.

If the user speaks English asking for a translation, provide the Darija translation in the transcription, translation, and vocabulary sections accordingly.
`;

export const generateTutorResponse = async (
  inputText: string | null,
  audioInput: AudioInput | null
): Promise<TutorResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const parts: any[] = [];

    if (audioInput) {
      parts.push({
        inlineData: {
          data: audioInput.base64Data,
          mimeType: audioInput.mimeType,
        },
      });
      parts.push({ text: "Analyze this audio." });
    } else if (inputText) {
      parts.push({ text: inputText });
    } else {
      throw new Error("No input provided");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        role: "user",
        parts: parts,
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: tutorResponseSchema,
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    const parsedResponse = JSON.parse(response.text) as TutorResponse;
    return parsedResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  
  if (!text || !text.trim()) {
    throw new Error("Text is required for speech generation.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          parts: [{ text: text }],
        }
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      console.warn("Gemini TTS response missing audio data.");
      throw new Error("No audio generated from Gemini.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};