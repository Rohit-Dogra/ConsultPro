const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const axios = require('axios');
const { MarketExtractor } = require('../utils/marketExtraction');

// Test endpoint to verify API is working
router.get("/test", (req, res) => {
  res.json({ status: "ok", message: "Market Reports API is working" });
});



// Generate market report for a seeker and store in database
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      user_id, 
      industry_id, 
      product_category_id, 
      company, 
      region = "Global", 
      year = new Date().getFullYear().toString(),
      forecast_period = 5
    } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if user exists in users table
    const [userExists] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Fetch industry and product category info if needed
    let industryName = 'General';
    let categoryName = 'General';
    
    if (industry_id) {
      const [industryResult] = await pool.query(
        'SELECT name FROM industries WHERE id = ?',
        [industry_id]
      );
      if (industryResult.length > 0) {
        industryName = industryResult[0].name;
      }
    }
    
    if (product_category_id) {
      const [categoryResult] = await pool.query(
        'SELECT name FROM product_categories WHERE id = ?',
        [product_category_id]
      );
      if (categoryResult.length > 0) {
        categoryName = categoryResult[0].name;
      }
    }
    
    // Initialize market extractor
    const extractor = new MarketExtractor(process.env.OPENAI_API_KEY);
    let marketData = null;
    let allSnippets = "";
    
    try {
      // Multiple search queries to get comprehensive data
      const queries = [
        `${year} ${industryName} industry ${categoryName} market size ${region}`,
        `${industryName} ${categoryName} CAGR growth rate ${region} ${year}`,
        `${industryName} market value ${categoryName} ${region} forecast ${year}`,
        `${industryName} ${categoryName} market analysis ${region} statistics`
      ];
      
      let allSnippets = "";
      let allSources = [];
      
      // Only proceed with search if we have SERP API key
      if (process.env.SERP_API_KEY) {
        try {
          // Execute searches to get data
          const searchPromises = queries.map(async (query, index) => {
            try {
              console.log(`Searching for: ${query}`);
              const serpResults = await axios.get("https://serpapi.com/search", {
                params: {
                  q: query,
                  api_key: process.env.SERP_API_KEY,
                  engine: "google",
                  num: 8
                }
              });
              
              if (serpResults.data && serpResults.data.organic_results) {
                return {
                  query: query,
                  results: serpResults.data.organic_results
                };
              }
              return null;
            } catch (error) {
              console.error(`Search error for query ${index + 1}:`, error.message);
              return null;
            }
          });
          
          const searchResults = await Promise.all(searchPromises);
          const validResults = searchResults.filter(result => result !== null);
          
          if (validResults.length > 0) {
            // Combine all results and remove duplicates
            const allResults = [];
            const seenUrls = new Set();
            
            validResults.forEach((searchResult, searchIndex) => {
              searchResult.results.forEach(result => {
                if (result.link && !seenUrls.has(result.link)) {
                  seenUrls.add(result.link);
                  allResults.push({
                    ...result,
                    searchQuery: searchResult.query,
                    searchIndex: searchIndex + 1
                  });
                }
              });
            });
            
            // Extract sources for citation
            allSources = allResults
              .map((result, index) => `Source ${index + 1}: ${result.title || 'Untitled'} - ${result.link} (Query: ${result.searchQuery})`);
              
            // Create comprehensive snippets with search context
            allSnippets = allResults
              .map((result, index) => {
                return `Source ${index + 1} (Search Query: "${result.searchQuery}"):\nTitle: ${result.title || 'No title'}\nContent: ${result.snippet || 'No content'}\nURL: ${result.link || 'No URL'}`;
              })
              .join("\n\n");
              
            // Add sources summary at the end
            allSnippets += "\n\n=== COMPREHENSIVE SOURCES FOR ANALYSIS ===\n" + allSources.join("\n");
            
            console.log(`Successfully gathered ${allResults.length} unique sources from ${validResults.length} search queries`);
          } else {
            console.log("No search results found from any query");
            allSnippets = `No specific data found for ${industryName} ${categoryName} in ${region} from multiple search attempts.`;
          }
        } catch (searchError) {
          console.error("Search API error:", searchError.message);
          allSnippets = `Unable to fetch search results for ${industryName} ${categoryName} in ${region}.`;
        }
      } else {
        console.log("No SERP API key found. Skipping search phase.");
        allSnippets = `No search API key configured. Using AI generation only.`;
      }
      
      // Use new market extraction system
      console.log('Starting market data extraction...');
      marketData = await extractor.extractMarketData(allSnippets, {
        industry: industryName,
        category: categoryName,
        region,
        year: parseInt(year),
        forecastPeriod: parseInt(forecast_period)
      });
      
      // Log warnings if any
      if (marketData.warnings && marketData.warnings.length > 0) {
        console.warn('Market extraction warnings:', marketData.warnings);
      }
    } catch (error) {
      console.error('Error generating market data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate market data',
        error: error.message
      });
    }
    
    // Store the generated report in database
    try {
      await pool.query(
        `INSERT INTO market_reports 
         (seeker_id, current_market_size, growth_rate, forecasted_size) 
         VALUES (?, ?, ?, ?)`,
        [
          user_id, 
          marketData.currentMarketSize, 
          marketData.growthRate, 
          marketData.forecastedSize
        ]
      );
      console.log('Market report stored in database for user:', user_id);
    } catch (dbError) {
      console.error('Database storage error:', dbError.message);
    }
    
    // Return the generated data
    return res.status(200).json({
      success: true,
      marketData: {
        currentMarketSize: marketData.currentMarketSize,
        growthRate: marketData.growthRate,
        forecastedSize: marketData.forecastedSize
      },
      profile: {
        industry: industryName,
        product_category: categoryName
      },
      metadata: {
        warnings: marketData.warnings,
        forecastPeriod: marketData.forecastPeriod,
        confidence: marketData.metadata?.confidence,
        extractionMethod: marketData.metadata?.extractionMethod
      }
    });
    
  } catch (error) {
    console.error('Error generating market report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate market report',
      error: error.message
    });
  }
});

module.exports = router;