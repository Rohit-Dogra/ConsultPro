import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings } from 'lucide-react';
import { useCurrencyTimezone } from '@/components/contexts/CurrencyTimezoneContext';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (currency: string, timezone: string) => Promise<void>;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const { currency, timezone, availableCurrencies } = useCurrencyTimezone();
  const [selectedCurrency, setSelectedCurrency] = useState(currency.code || 'INR');
  const [selectedTimezone, setSelectedTimezone] = useState(timezone || 'Asia/Kolkata');
  const [isLoading, setIsLoading] = useState(false);

  // Common timezones
  const timezones = [
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
  ];

  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(currency.code || 'INR');
      setSelectedTimezone(timezone || 'Asia/Kolkata');
    }
  }, [isOpen, currency.code, timezone]);

  const handleSave = async () => {
    if (!selectedCurrency || !selectedTimezone) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(selectedCurrency, selectedTimezone);
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Currency & Timezone Preferences
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Preferred Currency</Label>
            <Select
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">{curr.symbol}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{curr.code}</span>
                        <span className="text-sm text-muted-foreground">{curr.name}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This will be used to display all amounts throughout the application
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={selectedTimezone}
              onValueChange={setSelectedTimezone}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This will be used to display all dates and times
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These preferences will apply to all monetary amounts and timestamps 
              displayed in your dashboard, bookings, and earnings.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !selectedCurrency || !selectedTimezone}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreferencesModal;