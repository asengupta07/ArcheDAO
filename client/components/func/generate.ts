import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from "@google/genai";
import wav from 'wav';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const generate = async (prompt: string) => {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error('Error generating response with Gemini:', error);
        throw error;
    }
}

export const generateWithImage = async (prompt: string, image?: File) => {
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const imagePart = image
      ? {
          inlineData: {
            mimeType: image.type,
            data: Buffer.from(await image.arrayBuffer()).toString("base64"),
          },
        }
      : null;

    const contents = [imagePart, { text: prompt }].filter(Boolean) as any[];

    const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents
    });
    if (result.text) {
        return result.text;
    }
    console.error(result);
    console.error("No text in the response");
    throw new Error("No text in the response");
}

export const generateImage = async (prompt: string): Promise<Blob> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const contents = prompt;

  // Set responseModalities to include "Image" so the model can generate an image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    // Based on the part type, either show the text or return the image as blob
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data || '';
      const buffer = Buffer.from(imageData, "base64");
      return new Blob([buffer], { type: 'image/png' });
    }
  }
  
  throw new Error("No image generated in the response");
}

async function saveWaveFile(
   filename: string,
   pcmData: Buffer,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
) {
   return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
   });
}

export async function generateAudio(prompt: string, characters: { name: string, voice: string }[]): Promise<string> {
   const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  // const fname= 'output.wav';
  // const audio=fs.readFileSync(fname);
  // return audio;
   const speakerVoiceConfigs = characters.map((character) => ({
      speaker: character.name,
      voiceConfig: {
         prebuiltVoiceConfig: { voiceName: character.voice }
      }
   }));


   const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      // @ts-ignore
      contents: [{ parts: [{ text: prompt }] }],
      config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
               multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: speakerVoiceConfigs,
               }
            }
      }
   });

   const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
   const audioBuffer = Buffer.from(data || '', 'base64');

   const id = crypto.randomUUID();

   const fileName = `output-${id}.wav`;
   await saveWaveFile(path.join(process.cwd(), "temp", fileName), audioBuffer);
   
   return id;
}