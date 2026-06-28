import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft } from 'lucide-react';
import { useCurrencyTimezone } from '@/components/contexts/CurrencyTimezoneContext';

interface CurrencyDisplayProps {
  amount: number | string;
  currency?: string;
  showConversion?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCurrencyCode?: boolean;
  allowToggle?: boolean;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency: propCurrency,
  showConversion = true,
  className = '',
  size = 'md',
  showCurrencyCode = false,
  allowToggle = true
}) => {
  const { currency: userCurrency, formatCurrency, convertCurrency, availableCurrencies } = useCurrencyTimezone();
  const [showAlternate, setShowAlternate] = useState(false);
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const sourceCurrency = propCurrency || userCurrency.code || 'INR';
  
  // Determine alternate currency (USD if current is INR, INR if current is USD)
  const alternateCurrency = sourceCurrency === 'INR' ? 'USD' : 'INR';
  
  const displayCurrency = showAlternate ? alternateCurrency : sourceCurrency;
  const displayAmount = showAlternate 
    ? convertCurrency(numAmount, sourceCurrency, alternateCurrency)
    : numAmount;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };

  const currencySymbol = availableCurrencies.find(c => c.code === displayCurrency)?.symbol || displayCurrency;

  const handleToggle = () => {
    if (allowToggle && showConversion) {
      setShowAlternate(!showAlternate);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${sizeClasses[size]} font-medium`}>
        {currencySymbol}{displayAmount.toFixed(2)}
        {showCurrencyCode && (
          <span className="ml-1 text-xs text-muted-foreground">
            {displayCurrency}
          </span>
        )}
      </span>
      
      {showConversion && allowToggle && sourceCurrency !== alternateCurrency && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-6 w-6 p-0 hover:bg-muted"
          title={`Convert to ${showAlternate ? sourceCurrency : alternateCurrency}`}
        >
          <ArrowRightLeft className="h-3 w-3" />
        </Button>
      )}
      
      {showConversion && !allowToggle && sourceCurrency !== alternateCurrency && (
        <Badge variant="secondary" className="text-xs">
          {currencySymbol === '₹' ? '$' : '₹'}
          {showAlternate 
            ? convertCurrency(displayAmount, displayCurrency, sourceCurrency).toFixed(2)
            : convertCurrency(numAmount, sourceCurrency, alternateCurrency).toFixed(2)
          }
        </Badge>
      )}
    </div>
  );
};

export default CurrencyDisplay;