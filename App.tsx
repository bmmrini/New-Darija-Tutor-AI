import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatBubble } from './components/ChatBubble';
import { InputArea } from './components/InputArea';
import { SavedWordsPanel } from './components/SavedWordsPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { Menu, BookMarked, MessageSquare } from 'lucide-react';
import { generateTutorResponse } from './services/geminiService';
import { ChatMessage, ChatSession, VocabItem, AudioInput } from './types';

// Simple ID generator since we can't ensure uuid package availability
const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  // --- State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<VocabItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSavedPanelOpen, setIsSavedPanelOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Load from LocalStorage on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem('darija_sessions');
    if (storedSessions) setSessions(JSON.parse(storedSessions));

    const storedWords = localStorage.getItem('darija_saved_words');
    if (storedWords) setSavedWords(JSON.parse(storedWords));

    const storedTheme = localStorage.getItem('darija_theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('darija_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('darija_saved_words', JSON.stringify(savedWords));
  }, [savedWords]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darija_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darija_theme', 'light');
    }
  }, [isDarkMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isLoading]);

  // --- Helpers ---

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const updateCurrentSession = (updatedSession: ChatSession) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  // --- Handlers ---

  const handleSendMessage = async (text: string | null, audio: AudioInput | null) => {
    if (!currentSessionId) {
      // Should ideally not happen if UI handles initial state, but safe guard
      createNewSession();
      // We need to wait for state update or use temp var, logic below handles existing session ID
      return; 
    }
    
    // Check if session exists (react state async issue safeguard)
    let activeSession = sessions.find(s => s.id === currentSessionId);
    if (!activeSession) {
      const newSession: ChatSession = {
        id: generateId(),
        title: 'New Conversation',
        messages: [],
        updatedAt: Date.now(),
      };
      activeSession = newSession;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      type: audio ? 'audio' : 'text',
      content: audio ? audio.base64Data : (text || ''),
      timestamp: Date.now(),
    };

    // Optimistic Update
    const updatedWithUser = {
      ...activeSession,
      messages: [...activeSession.messages, userMessage],
      updatedAt: Date.now(),
      // Update title if it's the first message and it's text
      title: activeSession.messages.length === 0 && text 
        ? (text.length > 20 ? text.substring(0, 20) + '...' : text) 
        : activeSession.title
    };
    updateCurrentSession(updatedWithUser);
    setIsLoading(true);

    try {
      const response = await generateTutorResponse(text, audio);
      
      const botMessage: ChatMessage = {
        id: generateId(),
        role: 'model',
        type: 'text',
        content: JSON.stringify(response), // Store raw JSON just in case
        response: response,
        timestamp: Date.now(),
      };

      const finalSession = {
        ...updatedWithUser,
        messages: [...updatedWithUser.messages, botMessage],
        updatedAt: Date.now(),
         // Update title if it was audio initial message based on transcription
        title: updatedWithUser.messages.length === 1 && updatedWithUser.messages[0].type === 'audio'
          ? (response.transcription.length > 20 ? response.transcription.substring(0, 20) + '...' : response.transcription)
          : updatedWithUser.title
      };
      
      updateCurrentSession(finalSession);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'model',
        type: 'text',
        content: "Sorry, I encountered an error connecting to the Tutor. Please check your API Key or try again.",
        timestamp: Date.now(),
      };
      updateCurrentSession({
        ...updatedWithUser,
        messages: [...updatedWithUser.messages, errorMessage],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWord = (word: VocabItem) => {
    if (!savedWords.some(w => w.word === word.word)) {
      setSavedWords(prev => [...prev, word]);
      setIsSavedPanelOpen(true);
    }
  };

  const handleRemoveWord = (wordText: string) => {
    setSavedWords(prev => prev.filter(w => w.word !== wordText));
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
    }
  };

  // Saved words lookup map for quick access
  const savedWordMap = savedWords.reduce((acc, curr) => {
    acc[curr.word] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const activeSession = getCurrentSession();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-10 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate max-w-[150px] sm:max-w-md">
                {activeSession ? activeSession.title : 'Darija Tutor AI'}
              </h2>
              {activeSession && <span className="text-xs text-green-500 flex items-center gap-1">● Active Session</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
            <button
              onClick={() => setIsSavedPanelOpen(!isSavedPanelOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-secondary relative"
            >
              <BookMarked size={24} />
              {savedWords.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {savedWords.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          {!activeSession ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-80">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary animate-bounce-slow">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Welcome to Darija Tutor</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                Start a conversation to practice Moroccan Arabic. Speak or type to get instant feedback, grammar explanations, and vocabulary.
              </p>
              <button
                onClick={createNewSession}
                className="bg-primary hover:bg-teal-700 text-white px-8 py-3 rounded-full font-semibold transition-transform hover:scale-105 shadow-lg"
              >
                Start Learning
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {activeSession.messages.map((msg) => (
                <ChatBubble 
                  key={msg.id} 
                  message={msg} 
                  onSaveWord={handleSaveWord}
                  savedWordMap={savedWordMap}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm ml-2 animate-pulse">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>

      <SavedWordsPanel
        isOpen={isSavedPanelOpen}
        onClose={() => setIsSavedPanelOpen(false)}
        savedWords={savedWords}
        onRemoveWord={handleRemoveWord}
      />
    </div>
  );
};

export default App;