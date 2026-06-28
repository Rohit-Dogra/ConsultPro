import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PricingCardProps {
  videoPricing?: number | string;
  audioPricing?: number | string;
  chatPricing?: number | string;
  expertId?: string | null;
  onPricingUpdated?: () => void; // Add callback prop
}

const PricingCard: React.FC<PricingCardProps> = ({
  videoPricing = 0,
  audioPricing = 0,
  chatPricing = 0,
  expertId,
  onPricingUpdated, // Receive the callback
}) => {
  // Convert incoming prices to numbers and store in local state
  const [video, setVideo] = useState<number>(Number(videoPricing) || 0);
  const [audio, setAudio] = useState<number>(Number(audioPricing) || 0);
  const [chat, setChat] = useState<number>(Number(chatPricing) || 0);
  const [editing, setEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Update local state when props change
  useEffect(() => {
    setVideo(Number(videoPricing) || 0);
    setAudio(Number(audioPricing) || 0);
    setChat(Number(chatPricing) || 0);
  }, [videoPricing, audioPricing, chatPricing]);

  const updatePricing = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      // Use the prop directly, fallback to localStorage if needed
      let id = expertId;
      if (!id) {
        id = localStorage.getItem('expertId');
      }
      
      if (!id) {
        throw new Error('Expert id not found.');
      }
      
      // Get authentication token
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found. Please log in again.');
      }
      
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      
      // Try updating through the profile endpoint instead
      // Many APIs use a pattern where you update part of a profile
      const res = await fetch(`${API_BASE_URL}/api/experts/profile/${id}`, {
        method: 'PUT',  // or try 'PATCH' if PUT doesn't work
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        },
        body: JSON.stringify({
          section: 'pricing',  // Specify which section we're updating
          video_pricing: video,
          audio_pricing: audio,
          chat_pricing: chat,
        })
      });
      
      console.log("Update pricing response:", res);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update pricing: ${errorText}`);
      }
      
      const result = await res.json();
      console.log("Price update response data:", result);
      
      toast({
        title: "Success",
        description: "Pricing updated successfully",
      });
      
      // Notify parent component that pricing was updated
      if (onPricingUpdated) {
        onPricingUpdated();
      }
      
      setEditing(false);
    } catch (error) {
      console.error("Error updating pricing:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update pricing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-bold">Pricing</CardTitle>
        {/* {!editing && (
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )} */}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Video Call</span>
            {editing ? (
              <Input
                type="number"
                value={video}
                onChange={(e) => setVideo(Number(e.target.value))}
                className="w-20"
              />
            ) : (
              <span>${video.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span>Audio Call</span>
            {editing ? (
              <Input
                type="number"
                value={audio}
                onChange={(e) => setAudio(Number(e.target.value))}
                className="w-20"
              />
            ) : (
              <span>${audio.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span>Chat</span>
            {editing ? (
              <Input
                type="number"
                value={chat}
                onChange={(e) => setChat(Number(e.target.value))}
                className="w-20"
              />
            ) : (
              <span>${chat.toFixed(2)}</span>
            )}
          </div>
          {editing ? (
            <div className="flex space-x-2 mt-4">
              <Button size="sm" onClick={updatePricing} disabled={loading}>
                {loading ? "Saving..." : (
                  <>
                    <Check className="mr-1 h-4 w-4" /> Save
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" className="w-full mt-4" onClick={() => setEditing(true)}>
              Edit Pricing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingCard;