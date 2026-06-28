import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ChatSession from '@/components/session/ChatSession';

const TestChat: React.FC = () => {
  const [channelName, setChannelName] = useState('test-channel');
  const [userId, setUserId] = useState('123');
  const [userName, setUserName] = useState('Test User');
  const [otherUserId, setOtherUserId] = useState('456');
  const [otherUserName, setOtherUserName] = useState('Other User');
  const [showChat, setShowChat] = useState(false);

  const startChat = () => {
    setShowChat(true);
  };

  const endChat = () => {
    setShowChat(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto py-8 px-4 pt-20">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Test Chat Session</h1>
        
        {!showChat ? (
          <Card>
            <CardHeader>
              <CardTitle>Chat Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channelName">Channel Name</Label>
                <Input 
                  id="channelName" 
                  value={channelName} 
                  onChange={(e) => setChannelName(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userId">Your User ID</Label>
                <Input 
                  id="userId" 
                  value={userId} 
                  onChange={(e) => setUserId(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name</Label>
                <Input 
                  id="userName" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otherUserId">Other User ID</Label>
                <Input 
                  id="otherUserId" 
                  value={otherUserId} 
                  onChange={(e) => setOtherUserId(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otherUserName">Other User Name</Label>
                <Input 
                  id="otherUserName" 
                  value={otherUserName} 
                  onChange={(e) => setOtherUserName(e.target.value)} 
                />
              </div>
              
              <Button className="w-full" onClick={startChat}>
                Start Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden h-[600px]">
            <ChatSession
              channelName={channelName}
              userId={userId}
              userName={userName}
              otherUserId={otherUserId}
              otherUserName={otherUserName}
              onEndChat={endChat}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TestChat;