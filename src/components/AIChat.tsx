import React, { useReducer, useRef, useEffect } from 'react';
import { Send, User, Bot, X, ChevronRight, Trash, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { botRules } from '@/data/botRules';

// State & Reducer
type ChatState = {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  isLoading: boolean;
  isOpen: boolean;
  input: string;
};

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: { role: 'user' | 'assistant'; content: string } }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'CLEAR_CHAT' }
  | { type: 'SET_MESSAGES'; payload: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }> };

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  isOpen: false,
  input: ''
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          { ...action.payload, timestamp: new Date() }
        ]
      };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'TOGGLE_CHAT':
      return { ...state, isOpen: !state.isOpen };
    case 'CLEAR_CHAT':
      return { ...state, messages: [] };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    default:
      return state;
  }
};

// Suggested questions
const suggestedQuestions = [
  "What is ExpertiseStation?",
  "What services do you offer?",
  "What are the key features?",
  "How do I sign up as an expert?",
  "Where can I complete my expert profile?",
  "Show me the expert dashboard."
];

const AIChat: React.FC = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { messages, isLoading, isOpen, input } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('ai-chat-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string timestamps back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg, 
          timestamp: new Date(msg.timestamp)
        }));
        dispatch({ type: 'SET_MESSAGES', payload: messagesWithDates });
      } catch (err) {
        console.error('Error parsing saved messages:', err);
      }
    }
  }, []);
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle chat with Alt+C
      if (e.key === 'c' && e.altKey) {
        dispatch({ type: 'TOGGLE_CHAT' });
      }
      
      // Focus input when chat is open with Alt+I
      if (e.key === 'i' && e.altKey && isOpen) {
        e.preventDefault();
        document.getElementById('chat-input')?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Enhanced matching algorithm
  const findBestMatch = (userInput: string): string => {
    const userInputLower = userInput.toLowerCase().trim();
    const userInputWords = userInputLower.split(/\s+/).filter(word => word.length > 2);
    
    // Create a scoring system
    const scores = Object.keys(botRules).map(key => {
      const keyLower = key.toLowerCase();
      const keyWords = keyLower.split(/\s+/).filter(word => word.length > 2);
      
      let score = 0;
      
      // Direct match
      if (userInputLower === keyLower) {
        score += 100;
      }
      
      // Substring match
      if (userInputLower.includes(keyLower)) {
        score += keyLower.length * 2;
      }
      
      // Word matching
      const matchingWords = userInputWords.filter(word => keyWords.includes(word));
      score += matchingWords.length * 10;
      
      // Partial word matching
      for (const userWord of userInputWords) {
        for (const keyWord of keyWords) {
          if (keyWord.includes(userWord) || userWord.includes(keyWord)) {
            score += Math.min(userWord.length, keyWord.length);
          }
        }
      }
      
      return { key, score };
    });
    
    // Sort by score and get the highest
    scores.sort((a, b) => b.score - a.score);
    
    // Return the appropriate response or default
    if (scores.length > 0 && scores[0].score > 15) {
      return botRules[scores[0].key];
    }
    
    return "I apologize, but I don't have specific information about that. Please ask about ExpertiseStation's services, features, or how we can help your business.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      // Add user message
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { role: 'user', content: input } 
      });
      dispatch({ type: 'SET_INPUT', payload: '' });
      dispatch({ type: 'SET_LOADING', payload: true });

      // Process input against bot rules
      const response = findBestMatch(input);

      // Add bot response after a delay
      setTimeout(() => {
        dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: { role: 'assistant', content: response } 
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        toast.success("New AI insight generated!");
      }, 1000);
    } catch (error) {
      console.error('Chat processing error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error('Sorry, something went wrong processing your request.');
      
      // Add error message to chat
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again.' 
        } 
      });
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    dispatch({ type: 'SET_INPUT', payload: question });
  };

  const toggleChat = () => {
    dispatch({ type: 'TOGGLE_CHAT' });
  };
  
  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear chat history?')) {
      dispatch({ type: 'CLEAR_CHAT' });
      localStorage.removeItem('ai-chat-messages');
      toast.success('Chat history cleared');
    }
  };
  
  const copyChat = () => {
    const historyText = messages
      .map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(historyText);
    toast.success('Chat copied to clipboard');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8"
        aria-label="Open AI chat assistant"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className="
        fixed bottom-4 right-4 z-50
        w-[95vw] max-w-xs
        md:w-96 md:max-w-md
        rounded-t-xl md:rounded-xl
        overflow-hidden shadow-xl border border-gray-200 bg-white animate-scale-in
        flex flex-col
      "
      style={{ minHeight: '400px', maxHeight: '80vh' }}
      role="dialog"
      aria-labelledby="chat-heading"
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-blue-50">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-2">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <h3 id="chat-heading" className="font-display font-semibold text-base md:text-lg">Business Insights AI</h3>
        </div>
        <div className="flex items-center space-x-1">
          {messages.length > 0 && (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={clearChat}
                aria-label="Clear chat history"
                title="Clear chat history"
              >
                <Trash className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={copyChat}
                aria-label="Copy chat to clipboard"
                title="Copy chat to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleChat}
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-2 md:p-4 bg-gray-50"
        role="region"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-2 md:px-4">
            <Bot className="h-10 w-10 text-blue-500 mb-2" />
            <h3 className="font-display font-semibold text-base md:text-lg mb-1">AI Business Insights</h3>
            <p className="text-gray-600 mb-4 text-xs md:text-sm">Ask me anything about business strategy, market trends, or operational improvements.</p>
            <div className="w-full grid gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  className="text-left text-xs md:text-sm bg-white p-2 md:p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors flex items-center justify-between group"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  <span>{question}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-gray-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4 mr-1 text-blue-500" />
                    ) : (
                      <User className="h-4 w-4 mr-1 text-white" />
                    )}
                    <span className={`text-[10px] md:text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.role === 'user' ? 'You' : 'AI Assistant'} • {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-3 py-2 md:px-4 md:py-3 max-w-[80%]">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-2 md:p-3 border-t border-gray-100">
        <div className="relative">
          <Textarea
            id="chat-input"
            value={input}
            onChange={(e) => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
            placeholder="Ask for business insights..."
            className="resize-none pr-10 min-h-[40px] max-h-[90px] text-xs md:text-sm"
            aria-label="Type your message"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 bottom-1 md:right-2 md:bottom-2"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Keyboard shortcuts help */}
        <div className="mt-1 text-[10px] text-gray-400 text-center">
          <span title="Toggle chat">Alt+C: Toggle chat</span> • 
          <span title="Focus input"> Alt+I: Focus input</span>
        </div>
      </form>
    </div>
  );
};

export default AIChat;