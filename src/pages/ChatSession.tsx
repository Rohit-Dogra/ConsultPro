import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import { Send, PhoneOff, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  sender_name: string;
  sender_type: 'expert' | 'seeker';
}

const ChatSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [otherUser, setOtherUser] = useState<{ id: string; name: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get user data from localStorage
  const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
  let userId = null;
  let userName = 'User';
  let userType = 'seeker';
  let token = null;
  try {
    const parsedUserData = JSON.parse(userData);
    userId = parsedUserData.user_id || parsedUserData.id;
    userName = parsedUserData.name || 'User';
    userType = parsedUserData.user_type || 'seeker';
    token = parsedUserData.token || parsedUserData.accessToken;
    
    // If we have a token but no userId, try to extract it from the token
    if (!userId && token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        userId = payload.user_id || payload.id || null;
        if (!userType) {
          userType = payload.user_type || 'seeker';
        }
      } catch (e) {
        console.error('Failed to extract user data from token:', e);
      }
    }
  } catch (e) {
    console.error('Failed to parse user data:', e);
  }

  // Validate user data before proceeding
  useEffect(() => {
    if (!userId || !token) {
      setError('Authentication required. Please log in again.');
      toast.error('Authentication required. Please log in again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [userId, token, navigate]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSession = async () => {
    try {
      if (!userId || !token || !id) {
        throw new Error('Authentication required. Please log in again.');
      }

      setLoading(true);
      
      // Fetch session details first
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }

      const data = await response.json();
      
      // Set other user details
      const isExpert = userType === 'expert';
      setOtherUser({
        id: isExpert ? data.seeker_id : data.expert_id,
        name: isExpert ? data.seeker_name : data.expert_name
      });

      // Set loading to false after getting session details
      setLoading(false);

      // Try to connect to WebSocket
      connectWebSocket();

      // Fetch previous messages
      fetchPreviousMessages();

    } catch (err) {
      console.error('Error initializing session:', err);
      setError(err.message || 'Failed to initialize session');
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      // Use backend port 8080 for WebSocket
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname;
      const wsPort = '8080'; // Always use backend port
      const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/ws/chat/${id}`;

      // Prevent repeated connections
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket already connected or connecting');
        return;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        ws.send(JSON.stringify({
          type: 'auth',
          token: token,
          user_id: userId,
          user_type: userType
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'message') {
            setMessages(prev => [...prev, {
              id: message.id,
              sender_id: message.sender_id,
              content: message.content,
              timestamp: message.timestamp,
              sender_name: message.sender_name,
              sender_type: message.sender_type
            }]);
          } else if (message.type === 'error') {
            toast.error(message.content);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
    }
  };

  const fetchPreviousMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('Error fetching previous messages:', err);
    }
  };

  useEffect(() => {
    initializeSession();
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [id]);

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'message',
      content: newMessage.trim(),
      sender_id: userId,
      sender_name: userName,
      sender_type: userType,
      timestamp: new Date().toISOString()
    };

    try {
      wsRef.current.send(JSON.stringify(message));
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      if (wsRef.current) {
        wsRef.current.close(1000, 'Session ended by user');
      }

      navigate('/appointment-log');
    } catch (err) {
      toast.error('Failed to end session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="mb-4">{error}</p>
              <Button onClick={() => navigate('/appointment-log')}>
                Back to Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5]">
      {/* Header */}
      <div className="bg-[#008069] text-white p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 mr-2"
          onClick={() => navigate('/appointment-log')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 border-2 border-white">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${otherUser?.name}`} />
          <AvatarFallback className="bg-[#128C7E] text-white">
            {otherUser?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3 flex-1">
          <h2 className="font-semibold">{otherUser?.name}</h2>
          <p className="text-sm text-white/80">
            {isConnected ? 'online' : 'connecting...'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={endSession}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === userId
                    ? 'bg-[#d9fdd3] text-black'
                    : 'bg-white text-black'
                } shadow-sm`}
              >
                {message.sender_id !== userId && (
                  <span className="text-xs font-medium text-[#128C7E] block mb-1">
                    {message.sender_name}
                  </span>
                )}
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </p>
                <span className="text-[10px] text-gray-500 float-right mt-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-white p-3 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            className="flex-1 bg-[#f0f2f5] border-none focus-visible:ring-1"
            disabled={!isConnected}
          />
          <Button
            onClick={sendMessage}
            disabled={!isConnected || !newMessage.trim()}
            size="icon"
            className={`rounded-full h-10 w-10 ${
              isConnected 
                ? 'bg-[#008069] hover:bg-[#128C7E] text-white' 
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Connection Status Toast */}
      {!isConnected && !loading && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm">
          Reconnecting...
        </div>
      )}
    </div>
  );
};

export default ChatSession; 