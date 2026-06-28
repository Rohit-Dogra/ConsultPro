// Global checkpoint management system for the free session flow
export interface FlowCheckpoint {
  step: 'google_signup' | 'additional_questions' | 'report_preview' | 'phone_capture' | 'experts_list' | 'subscription_plans' | 'profile_completion' | 'seeker_dashboard';
  timestamp: number;
  userInfo?: {
    email: string;
    name: string;
    id: string;
  };
  formData?: any;
  userFlowState?: string;
  [key: string]: any;
}

const CHECKPOINT_KEY = 'freeSessionCheckpoint';
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export class CheckpointManager {
  static saveCheckpoint(step: FlowCheckpoint['step'], additionalData: any = {}) {
    try {
      const checkpoint: FlowCheckpoint = {
        step,
        timestamp: Date.now(),
        ...additionalData
      };
      
      sessionStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));
      console.log('Checkpoint saved:', step);
    } catch (error) {
      console.error('Error saving checkpoint:', error);
    }
  }

  static getCheckpoint(): FlowCheckpoint | null {
    try {
      const savedCheckpoint = sessionStorage.getItem(CHECKPOINT_KEY);
      if (!savedCheckpoint) {
        return null;
      }

      const checkpoint = JSON.parse(savedCheckpoint);
      
      // Check if checkpoint is expired
      const checkpointAge = Date.now() - checkpoint.timestamp;
      if (checkpointAge > MAX_AGE) {
        console.log('Checkpoint expired, clearing');
        this.clearCheckpoint();
        return null;
      }

      return checkpoint;
    } catch (error) {
      console.error('Error getting checkpoint:', error);
      this.clearCheckpoint();
      return null;
    }
  }

  static clearCheckpoint() {
    sessionStorage.removeItem(CHECKPOINT_KEY);
    console.log('Checkpoint cleared');
  }

  static hasCheckpoint(): boolean {
    return this.getCheckpoint() !== null;
  }

  static updateCheckpoint(updates: Partial<FlowCheckpoint>) {
    const existing = this.getCheckpoint();
    if (existing) {
      this.saveCheckpoint(existing.step, { ...existing, ...updates });
    }
  }
}