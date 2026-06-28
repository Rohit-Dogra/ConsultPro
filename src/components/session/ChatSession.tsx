import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send } from 'lucide-react';

interface ChatSessionProps {
  channelName: string;
  userId: string;
  userName: string;
  otherUserName: string;
  otherUserId: string;
  onEndChat: () => void;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

const ChatSession: React.FC<ChatSessionProps> = ({
  channelName,
  userId,
  userName,
  otherUserName,
  otherUserId,
  onEndChat
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    // For demo purposes, we'll use a simple array for messages
    // In production, you would connect to a real WebSocket server
    
    // Add a welcome message
    setMessages([
      {
        id: 'system-1',
        senderId: 'system',
        senderName: 'System',
        text: `Chat session started. You are now connected with ${otherUserName}.`,
        timestamp: new Date()
      }
    ]);
    
    setIsConnected(true);
    
    // In a real implementation, you would connect to WebSocket here
    // const ws = new WebSocket(`wss://your-websocket-server.com/chat/${channelName}`);
    // setSocket(ws);
    
    // ws.onopen = () => {
    //   setIsConnected(true);
    // };
    
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'message') {
    //     addMessage(data.senderId, data.senderName, data.text);
    //   }
    // };
    
    // ws.onclose = () => {
    //   setIsConnected(false);
    // };
    
    // return () => {
    //   ws.close();
    // };
    
    // For demo, we'll simulate the other user joining after 2 seconds
    const timer = setTimeout(() => {
      addMessage(otherUserId, otherUserName, 'Hello, I just joined the chat!');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [channelName, otherUserName, otherUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (senderId: string, senderName: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId,
      senderName,
      text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // Add message to local state
    addMessage(userId, userName, inputText);
    
    // In a real implementation, you would send to WebSocket here
    // if (socket && socket.readyState === WebSocket.OPEN) {
    //   socket.send(JSON.stringify({
    //     type: 'message',
    //     channelName,
    //     senderId: userId,
    //     senderName: userName,
    //     text: inputText
    //   }));
    // }
    
    setInputText('');
    
    // For demo, simulate a response after 1-3 seconds
    if (Math.random() > 0.3) { // 70% chance of response
      const responseTime = 1000 + Math.random() * 2000;
      setTimeout(() => {
        const responses = [
          "That's interesting, tell me more.",
          "I understand your point.",
          "Let me think about that for a moment.",
          "Could you elaborate on that?",
          "That's a good question!",
          "I appreciate your perspective.",
          "Let's discuss this further."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(otherUserId, otherUserName, randomResponse);
      }, responseTime);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{otherUserName}</h3>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={onEndChat}>
          End Chat
        </Button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div 
            key={message.id}
            className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
          >
            {message.senderId !== userId && message.senderId !== 'system' && (
              <Avatar className="h-8 w-8 mr-2 mt-1">
                <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
              </Avatar>
            )}
            
            <div 
              className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === 'system' 
                  ? 'bg-gray-200 text-center mx-auto text-sm' 
                  : message.senderId === userId 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-200'
              }`}
            >
              {message.senderId !== 'system' && message.senderId !== userId && (
                <p className="text-xs font-medium mb-1">{message.senderName}</p>
              )}
              <p>{message.text}</p>
              <p className="text-xs opacity-70 text-right mt-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSession;