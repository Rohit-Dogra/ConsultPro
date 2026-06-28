const NodeCache = require('node-cache');

// Cache with 30-minute TTL
const searchCache = new NodeCache({ stdTTL: 1800 });

// Middleware to cache search results
const cacheSearchResults = (req, res, next) => {
  const cacheKey = JSON.stringify({
    type: 'linkedin_search',
    params: req.body
  });
  
  const cachedResult = searchCache.get(cacheKey);
  if (cachedResult) {
    console.log('Returning cached LinkedIn search results');
    return res.json(cachedResult);
  }
  
  // Store the original json method
  const originalJson = res.json;
  
  // Override json method
  res.json = function(data) {
    if (data.success && res.statusCode === 200) {
      // Only cache successful responses
      searchCache.set(cacheKey, data);
    }
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = { cacheSearchResults };