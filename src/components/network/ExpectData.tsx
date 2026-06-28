import { useState, useEffect } from "react";

export interface Expert {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  expertise: string;
  workExperience: string;
  currentOrganization: string;
  location: string;
  areasOfHelp: string;
  bio: string;
  image: string;
  achievements: string[];
  education: string[];
  contact: {
    email: string;
    linkedin: string;
  };
}

const useExpertData = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/experts/profiles");
        if (!response.ok) throw new Error("Failed to fetch expert profiles");
        const result = await response.json();
        if (result.success) setExperts(result.data);
        else throw new Error(result.message || "Failed to load expert profiles");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, []);

  return { experts, loading, error };
};

export default useExpertData;
