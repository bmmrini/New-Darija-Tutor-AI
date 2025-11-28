import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { playPCMAudio } from '../services/audioService';

interface PronunciationButtonProps {
  text: string;
  size?: number;
  className?: string;
}

export const PronunciationButton: React.FC<PronunciationButtonProps> = ({ 
  text, 
  size = 16, 
  className = "text-gray-400 hover:text-primary transition-colors"
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePronunciation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    // Extract Arabic text if format is "Arabic (Latin)"
    // Matches characters until the first open parenthesis, ignores trailing spaces
    const arabicMatch = text.match(/^([^\(]+)/);
    const textToSpeak = arabicMatch ? arabicMatch[1].trim() : text.trim();

    if (!textToSpeak) {
      console.warn("No text found to pronounce");
      return;
    }

    setIsLoading(true);
    try {
      const base64Audio = await generateSpeech(textToSpeak);
      await playPCMAudio(base64Audio);
    } catch (error) {
      console.error("Failed to pronounce:", error);
      alert("Could not generate audio. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePronunciation}
      className={`${className} disabled:opacity-50`}
      title="Listen to pronunciation (Gemini AI)"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 size={size} className="animate-spin text-secondary" />
      ) : (
        <Volume2 size={size} />
      )}
    </button>
  );
};