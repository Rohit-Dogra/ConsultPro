// Utility to batch expert requests and reduce database load
export class ExpertBatchFetcher {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async fetchExperts(functionalityIds, options = {}) {
    const { 
      status = 'approved', 
      require_complete = 'true',
      token 
    } = options;

    // Convert single ID to array
    const ids = Array.isArray(functionalityIds) ? functionalityIds : [functionalityIds];
    
    // Create cache key
    const cacheKey = `${ids.sort().join(',')}_${status}_${require_complete}`;
    
    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Return pending request if already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request
    const request = this._fetchFromAPI(ids, { status, require_complete, token });
    this.pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchFromAPI(functionalityIds, options) {
    const { status, require_complete, token } = options;
    
    const url = new URL(`${import.meta.env.VITE_API_URL}/api/experts/profiles/public`);
    
    if (functionalityIds.length === 1) {
      url.searchParams.append('functionality_id', functionalityIds[0].toString());
    } else if (functionalityIds.length > 1) {
      url.searchParams.append('functionality_ids', functionalityIds.join(','));
    }
    
    url.searchParams.append('status', status);
    url.searchParams.append('require_complete', require_complete);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch experts`);
    }

    return response.json();
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const expertBatchFetcher = new ExpertBatchFetcher();