import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckpointManager, FlowCheckpoint } from '@/utils/checkpointManager';

export const useFlowCheckpoint = () => {
  const navigate = useNavigate();

  const saveCheckpoint = (step: FlowCheckpoint['step'], additionalData: any = {}) => {
    CheckpointManager.saveCheckpoint(step, additionalData);
  };

  const clearCheckpoint = () => {
    CheckpointManager.clearCheckpoint();
  };

  const restoreFromCheckpoint = () => {
    const checkpoint = CheckpointManager.getCheckpoint();
    if (!checkpoint) return false;

    console.log('Restoring from checkpoint:', checkpoint);

    // Only handle navigation for later flow steps
    // Early steps (google_signup, additional_questions, report_preview, phone_capture) are handled by HeroSection
    switch (checkpoint.step) {
      case 'experts_list':
        // Navigate to experts page with functionality filter if available
        const functionalityId = checkpoint.formData?.functionality || checkpoint.functionality;
        if (functionalityId) {
          navigate(`/experts?functionality_id=${functionalityId}`);
        } else {
          navigate('/experts');
        }
        break;
      case 'subscription_plans':
        navigate('/subscription-plans');
        break;
      case 'profile_completion':
        navigate('/auth/SeekerProfileForm');
        break;
      case 'seeker_dashboard':
        navigate('/seekerdashboard');
        break;
      case 'google_signup':
      case 'additional_questions':
      case 'report_preview':
      case 'phone_capture':
        // These are handled by HeroSection - navigate to home to trigger restoration
        navigate('/');
        break;
      default:
        return false;
    }
    
    return true;
  };

  const checkAndRestore = () => {
    // Check if we need to restore from checkpoint
    const checkpoint = CheckpointManager.getCheckpoint();
    if (!checkpoint) return;

    const currentPath = window.location.pathname;
    
    // If we're on the home page and have a later flow step checkpoint, navigate to it
    if (currentPath === '/' && ['experts_list', 'subscription_plans', 'profile_completion', 'seeker_dashboard'].includes(checkpoint.step)) {
      restoreFromCheckpoint();
    }
    // If we're on any other page and have an early flow step checkpoint, go to home to restore
    else if (currentPath !== '/' && ['google_signup', 'additional_questions', 'report_preview', 'phone_capture'].includes(checkpoint.step)) {
      navigate('/');
    }
  };

  return {
    saveCheckpoint,
    clearCheckpoint,
    restoreFromCheckpoint,
    checkAndRestore,
    hasCheckpoint: CheckpointManager.hasCheckpoint,
    getCheckpoint: CheckpointManager.getCheckpoint
  };
};