import React, { useState, useEffect } from 'react';
import { X, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrialExpiredPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

const TrialExpiredPopup: React.FC<TrialExpiredPopupProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            🎯 Trial Completed!
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Thank you for exploring our platform! Your trial period has ended. 
            <span className="font-semibold text-orange-600"> Choose a plan below to continue accessing all features.</span>
          </p>

          {/* Benefits */}
          <div className="bg-orange-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-orange-800 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span>Unlimited expert consultations</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span>Premium business tools</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span>24/7 support access</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg transition-all duration-300"
          >
            View Plans & Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredPopup;