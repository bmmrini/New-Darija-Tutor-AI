import React from 'react';
import { User, Bot, Play, Volume2, BookOpen, Plus, Languages } from 'lucide-react';
import { ChatMessage, VocabItem } from '../types';
import { PronunciationButton } from './PronunciationButton';

interface ChatBubbleProps {
  message: ChatMessage;
  onSaveWord: (word: VocabItem) => void;
  savedWordMap: Record<string, boolean>; // To check if word is already saved
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onSaveWord, savedWordMap }) => {
  const isUser = message.role === 'user';

  // Helper to play base64 audio (user uploaded/recorded)
  const playAudio = (base64: string, mimeType?: string) => {
    // Default to webm if no mimeType provided (backward compatibility)
    const type = mimeType || 'audio/webm';
    const audio = new Audio(`data:${type};base64,${base64}`);
    audio.play().catch(e => console.error("Audio playback error:", e));
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? 'bg-primary text-white' : 'bg-secondary text-white'
        }`}>
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-2xl px-4 py-3 shadow-sm overflow-hidden ${
            isUser 
              ? 'bg-primary text-white rounded-tr-none' 
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-none text-gray-800 dark:text-gray-100'
          }`}>
            {/* User Content */}
            {isUser && (
              <>
                {message.type === 'text' ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => playAudio(message.content, (message as any).mimeType)} // Cast for now as mimeType is optional in some contexts
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <Play size={16} fill="currentColor" />
                      <span className="text-sm font-medium">Play Audio</span>
                    </button>
                    <Volume2 size={16} className="opacity-70" />
                  </div>
                )}
              </>
            )}

            {/* AI Response Card */}
            {!isUser && message.response && (
              <div className="flex flex-col gap-4 min-w-[280px] md:min-w-[400px]">
                {/* Transcription Section */}
                <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                  <h4 className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-1">Transcription</h4>
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-lg font-medium text-secondary" dir="auto">{message.response.transcription}</p>
                    <PronunciationButton 
                      text={message.response.transcription} 
                      className="p-1.5 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-full transition-colors"
                    />
                  </div>
                </div>

                {/* Translation Section */}
                {message.response.translation && (
                  <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Languages size={12} className="text-gray-400" />
                      <h4 className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Translation</h4>
                    </div>
                    <p className="text-md text-gray-800 dark:text-gray-200">{message.response.translation}</p>
                  </div>
                )}

                {/* Explanation Section */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-1">Explanation</h4>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{message.response.explanation}</p>
                </div>

                {/* Vocabulary Section */}
                {message.response.vocabulary.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 mt-1 border border-transparent dark:border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <BookOpen size={16} />
                      <h4 className="text-sm font-bold">Vocabulary</h4>
                    </div>
                    <div className="space-y-2">
                      {message.response.vocabulary.map((item, idx) => {
                        const isSaved = savedWordMap[item.word];
                        return (
                          <div key={idx} className="flex items-start justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{item.word}</p>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{item.meaning}</p>
                              {item.notes && <p className="text-[10px] text-gray-400 dark:text-gray-500 italic mt-0.5">{item.notes}</p>}
                            </div>
                            <button
                              onClick={() => !isSaved && onSaveWord(item)}
                              disabled={isSaved}
                              className={`p-1.5 rounded-full transition-colors flex-shrink-0 ml-2 ${
                                isSaved 
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default' 
                                  : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                              }`}
                              title={isSaved ? "Saved" : "Save Word"}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!isUser && !message.response && (
              <p className="text-red-500 italic">Error displaying response.</p>
            )}
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};