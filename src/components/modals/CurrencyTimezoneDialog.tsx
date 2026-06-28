import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/config/api';
import { Settings } from 'lucide-react';

// List of currencies (limiting to USD and INR as requested)
const currencies = [
  // { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
];

// List of common timezones
const timezones = [
  { code: 'UTC', name: 'UTC (Coordinated Universal Time)' },
  { code: 'America/New_York', name: 'Eastern Time (ET)' },
  { code: 'America/Chicago', name: 'Central Time (CT)' },
  { code: 'America/Denver', name: 'Mountain Time (MT)' },
  { code: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
  { code: 'Europe/London', name: 'London (GMT)' },
  { code: 'Europe/Paris', name: 'Central European Time (CET)' },
  { code: 'Asia/Kolkata', name: 'India (IST)' },
  { code: 'Asia/Tokyo', name: 'Japan (JST)' },
  { code: 'Australia/Sydney', name: 'Sydney (AEST)' },
];

interface CurrencyTimezoneDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: string;
  currentTimezone: string;
  onSave: (currency: string, timezone: string) => void;
}

// Update the component to require explicit selection
const CurrencyTimezoneDialog: React.FC<CurrencyTimezoneDialogProps> = ({
  isOpen,
  onClose,
  currentCurrency,
  currentTimezone,
  onSave,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency || '');
  const [selectedTimezone, setSelectedTimezone] = useState(currentTimezone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCurrency(currentCurrency || '');
    setSelectedTimezone(currentTimezone || '');
    setError(null);
  }, [currentCurrency, currentTimezone, isOpen]);

  const handleSave = async () => {
    // Validate that user has made selections
    if (!selectedCurrency) {
      setError("Please select a currency");
      return;
    }
    
    if (!selectedTimezone) {
      setError("Please select a timezone");
      return;
    }
    
    setIsLoading(true);
    try {
      await onSave(selectedCurrency, selectedTimezone);
      toast({
        title: "Preferences saved",
        description: "Your currency and timezone preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "There was an error saving your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Currency & Timezone Preferences</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 text-sm">
              {error}
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency <span className="text-red-500">*</span></Label>
            <Select 
              value={selectedCurrency} 
              onValueChange={setSelectedCurrency}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Please select a currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center">
                      {currency.symbol} - {currency.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone <span className="text-red-500">*</span></Label>
            <Select 
              value={selectedTimezone} 
              onValueChange={setSelectedTimezone}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Please select a timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {timezones.map((timezone) => (
                  <SelectItem key={timezone.code} value={timezone.code}>
                    {timezone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save preferences"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CurrencyTimezoneDialog;