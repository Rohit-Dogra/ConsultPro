import { useEffect } from 'react';
import { useFlowCheckpoint } from '@/hooks/useFlowCheckpoint';

/**
 * CheckpointRestorer component that automatically restores users to their saved checkpoint
 * when they return to the application. This should be placed in the main App component.
 */
export const CheckpointRestorer = () => {
  const { checkAndRestore } = useFlowCheckpoint();

  useEffect(() => {
    // Only run checkpoint restoration on app initialization
    const hasRestoredOnce = sessionStorage.getItem('checkpointRestored');
    
    if (!hasRestoredOnce) {
      checkAndRestore();
      sessionStorage.setItem('checkpointRestored', 'true');
    }
  }, [checkAndRestore]);

  // This component doesn't render anything
  return null;
};