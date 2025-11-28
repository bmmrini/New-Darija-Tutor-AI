import React from 'react';
import { BookMarked, X, Trash2, Volume2 } from 'lucide-react';
import { VocabItem } from '../types';

interface SavedWordsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedWords: VocabItem[];
  onRemoveWord: (word: string) => void;
}

export const SavedWordsPanel: React.FC<SavedWordsPanelProps> = ({
  isOpen,
  onClose,
  savedWords,
  onRemoveWord,
}) => {
  // Helper for Pronunciation
  const handlePronunciation = (text: string) => {
    if (!window.speechSynthesis) return;
    const arabicMatch = text.match(/^(.*?)\s*\(/); 
    const textToSpeak = arabicMatch ? arabicMatch[1] : text;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ar'; 
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-secondary">
              <BookMarked size={20} />
              <h2 className="font-bold">Vocabulary Bank</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
            {savedWords.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                <p>No words saved yet.</p>
                <p className="text-xs mt-2">Click the <span className="inline-block p-1 bg-primary/10 rounded-full text-primary">+</span> icon on chat cards to save words.</p>
              </div>
            ) : (
              savedWords.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm group transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <h3 className="font-bold text-gray-800 dark:text-gray-100">{item.word}</h3>
                       <button 
                          onClick={() => handlePronunciation(item.word)}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="Pronounce"
                        >
                          <Volume2 size={14} />
                        </button>
                    </div>
                    <button 
                      onClick={() => onRemoveWord(item.word)}
                      className="text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove word"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-primary font-medium mt-1">{item.meaning}</p>
                  {item.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic border-t border-gray-100 dark:border-gray-700 pt-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};