import axios from 'axios';

interface LinkedInSearchParams {
  name?: string;
  company?: string;
  title?: string;
  location?: string;
  school?: string;
  keywords?: string[];
  limit?: number;
}

interface LinkedInProfile {
  name: string;
  headline: string | null;
  location: string | null;
  profileUrl: string;
  currentPosition: string | null;
  company: string | null;
  profileImageUrl: string | null;
}

export async function searchLinkedInProfiles(params: LinkedInSearchParams): Promise<LinkedInProfile[]> {
  try {
    const { name, company, title, location, school, keywords = [], limit = 5 } = params;
    
    // Build search query
    let query = "site:linkedin.com/in/";
    if (name) query += ` ${name}`;
    if (company) query += ` ${company}`;
    if (title) query += ` ${title}`;
    if (location) query += ` ${location}`;
    if (school) query += ` ${school}`;
    if (keywords.length > 0) query += ` ${keywords.join(' ')}`;
    
    // Make request to SERP API
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: process.env.SERP_API_KEY,
        engine: 'google',
        q: query,
        num: limit,
        gl: 'us',
      }
    });
    
    // Process search results
    const results = response.data.organic_results || [];
    
    return results.map(result => {
      // Extract relevant data
      const profileUrl = result.link;
      const name = result.title.split(' - ')[0] || '';
      const headline = result.title.split(' - ')[1] || null;
      const snippet = result.snippet || '';
      
      // Extract additional data from snippet
      const locationMatch = snippet.match(/(?:Location|Based in):\s*([^•]+)/i);
      const positionMatch = snippet.match(/(?:Current|Present):\s*([^•]+)/i);
      const companyMatch = snippet.match(/at\s+([^•]+)/i);
      
      return {
        name: name.trim(),
        headline: headline?.trim() || null,
        location: locationMatch ? locationMatch[1].trim() : null,
        profileUrl,
        currentPosition: positionMatch ? positionMatch[1].trim() : null,
        company: companyMatch ? companyMatch[1].trim() : null,
        profileImageUrl: result.thumbnail || null
      };
    });
  } catch (error) {
    console.error('LinkedIn search error:', error);
    throw new Error('Failed to search LinkedIn profiles');
  }
}