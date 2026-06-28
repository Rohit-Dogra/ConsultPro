import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrencyTimezone } from '@/components/contexts/CurrencyTimezoneContext';

interface CurrencySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showSymbol?: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
  className = '',
  placeholder = 'Select currency',
  showSymbol = true
}) => {
  const { currency, availableCurrencies, setCurrencyAndTimezone, timezone } = useCurrencyTimezone();

  const handleValueChange = async (newCurrency: string) => {
    if (onValueChange) {
      onValueChange(newCurrency);
    } else {
      // Update global currency preference
      try {
        await setCurrencyAndTimezone(newCurrency, timezone);
      } catch (error) {
        console.error('Failed to update currency:', error);
      }
    }
  };

  const currentValue = value || currency.code;

  return (
    <Select
      value={currentValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder={placeholder}>
          {currentValue && (
            <div className="flex items-center gap-2">
              {showSymbol && (
                <span className="font-medium">
                  {availableCurrencies.find(c => c.code === currentValue)?.symbol || currentValue}
                </span>
              )}
              <span>
                {currentValue} - {availableCurrencies.find(c => c.code === currentValue)?.name || currentValue}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableCurrencies.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            <div className="flex items-center gap-2">
              {showSymbol && (
                <span className="font-medium text-lg">{curr.symbol}</span>
              )}
              <div className="flex flex-col">
                <span className="font-medium">{curr.code}</span>
                <span className="text-sm text-muted-foreground">{curr.name}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;