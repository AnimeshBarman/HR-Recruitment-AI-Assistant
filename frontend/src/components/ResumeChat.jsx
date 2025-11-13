import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

const ResumeChat = ({ sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef();

  useEffect(() => {
    if (sessionId) {
      setMessages([
        { 
          text: "You can now ask questions about all uploaded resumes.", 
          sender: 'bot' 
        }
      ]);
    }
  }, [sessionId]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !sessionId) return;

    const userMessage = { text: userInput, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/chat", { 
        sessionId: sessionId, 
        question: userInput 
      });

      const botMessage = { text: response.data.answer, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Chat API error:", error);
      const errorMessage = { text: "Sorry, I ran into an error. Please try again.", sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex-shrink-0">
        <h3 className="text-xl flex justify-center content-center font-semibold">Chat With Resumes</h3>
      </div>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && <Avatar><AvatarFallback>AI</AvatarFallback></Avatar>}
              <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-900'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-3">
              <Avatar><AvatarFallback>AI</AvatarFallback></Avatar>
              <div className="bg-gray-100 p-3 rounded-lg">
                <span className="h-2 w-2 bg-gray-400 rounded-full inline-block animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full inline-block animate-bounce [animation-delay:-0.15s] mx-1"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full inline-block animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex items-center gap-2 flex-shrink-0">
        <Input 
          placeholder="Ask about all resumes..." 
          value={userInput} 
          onChange={e => setUserInput(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && !isLoading && handleSendMessage()} 
          disabled={isLoading} 
        />
        <Button onClick={handleSendMessage} disabled={isLoading}>
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ResumeChat;