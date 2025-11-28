import React, { useState, useRef } from 'react';
import { Send, Mic, Square, Loader2, FileAudio } from 'lucide-react';
import { AudioInput } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string | null, audio: AudioInput | null) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text, null);
    setText('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove "data:audio/webm;base64," prefix
          const base64Data = base64String.split(',')[1];
          onSendMessage(null, { base64Data, mimeType: 'audio/webm' });
        };
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple validation
    if (!file.type.startsWith('audio/')) {
      alert("Please select a valid audio file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      alert("File is too large. Please select a file under 20MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Extract base64 data
      const base64Data = base64String.split(',')[1];
      onSendMessage(null, { base64Data, mimeType: file.type });
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Failed to read file.");
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex items-end gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isRecording}
          className="p-3 mb-[1px] rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          title="Upload Audio File"
        >
          <FileAudio size={20} />
        </button>

        <div className="relative flex-1">
          <textarea
            className="w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent max-h-32 min-h-[50px] placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            placeholder="Type in Darija or English..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isRecording}
            rows={1}
          />
        </div>

        {text.trim() ? (
          <button
            onClick={() => handleTextSubmit()}
            disabled={isLoading}
            className="p-3 mb-[1px] bg-primary hover:bg-teal-700 text-white rounded-full transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`p-3 mb-[1px] rounded-full transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isRecording ? (
              <Square size={20} fill="currentColor" />
            ) : (
              <Mic size={20} />
            )}
          </button>
        )}
      </div>
      {isRecording && (
        <p className="text-center text-xs text-red-500 mt-2 font-medium">Recording... Tap square to send.</p>
      )}
    </div>
  );
};