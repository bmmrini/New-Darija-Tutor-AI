import React from 'react';
import { MessageSquarePlus, MessageSquare, X, Trash2 } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Darija Tutor AI
            </h1>
            <button onClick={onClose} className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <X size={24} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="w-full flex items-center gap-2 justify-center bg-primary hover:bg-teal-700 text-white py-3 px-4 rounded-xl transition-colors font-medium shadow-lg shadow-primary/20"
            >
              <MessageSquarePlus size={20} />
              New Chat
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 mt-10 px-4">
                <p className="text-sm">No chats yet.</p>
                <p className="text-xs mt-1">Start a new conversation to practice Darija!</p>
              </div>
            ) : (
              sessions.sort((a,b) => b.updatedAt - a.updatedAt).map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-gray-100 dark:bg-gray-800 text-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <MessageSquare size={18} className={currentSessionId === session.id ? 'text-primary' : 'text-gray-400 dark:text-gray-500'} />
                  <div className="flex-1 truncate">
                    <p className="font-medium text-sm truncate">{session.title}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-center text-gray-400 dark:text-gray-600">
            Powered by Gemini 3.0 Pro
          </div>
        </div>
      </aside>
    </>
  );
};