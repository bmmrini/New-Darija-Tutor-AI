// Singleton AudioContext to reuse across the app
let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000, // Gemini TTS uses 24kHz
    });
  }
  return audioContext;
}

// Decode Base64 string to Uint8Array
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert PCM Int16 data to AudioBuffer
async function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 [-32768, 32767] to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function playPCMAudio(base64String: string) {
  try {
    const ctx = getAudioContext();
    
    // Ensure context is running (needed for some browsers' autoplay policies)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const bytes = base64ToBytes(base64String);
    const audioBuffer = await pcmToAudioBuffer(bytes, ctx);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);
    
    // Return a promise that resolves when playback ends
    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  } catch (error) {
    console.error("Error playing PCM audio:", error);
    throw error;
  }
}