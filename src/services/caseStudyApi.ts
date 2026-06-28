const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface CaseStudy {
  id: string;
  title: string;
  headline: string;
  cover_image: string;
  challenges: string;
  failures: string;
  overview?: string;
  created_at: string;
}

export const caseStudyApi = {
  // Get all case studies
  getAllCaseStudies: async (): Promise<CaseStudy[]> => {
    const response = await fetch(`${API_BASE_URL}/api/case-studies`);
    if (!response.ok) throw new Error('Failed to fetch case studies');
    return response.json();
  },

  // Get case study by ID
  getCaseStudy: async (id: string): Promise<CaseStudy> => {
    const response = await fetch(`${API_BASE_URL}/api/case-studies/${id}`);
    if (!response.ok) throw new Error('Failed to fetch case study');
    return response.json();
  },

  // Seed database with sample data
  seedDatabase: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/case-studies/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to seed database');
    return response.json();
  }
};