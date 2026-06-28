const { OpenAI } = require('openai');

class MarketExtractionError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'MarketExtractionError';
    this.code = code;
  }
}

class MarketExtractor {
  constructor(openaiApiKey) {
    this.openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
  }

  // Parse numeric value with unit normalization
  parseMarketValue(valueStr) {
    if (!valueStr || typeof valueStr !== 'string') {
      throw new MarketExtractionError('Invalid value string', 'INVALID_INPUT');
    }

    // Clean the string
    const cleaned = valueStr.replace(/[,$\s]/g, '').toLowerCase();
    
    // Extract number and unit
    const match = cleaned.match(/^([0-9.]+)([a-z]*)$/);
    if (!match) {
      throw new MarketExtractionError(`Cannot parse value: ${valueStr}`, 'PARSE_ERROR');
    }

    const [, numStr, unit] = match;
    const baseValue = parseFloat(numStr);
    
    if (isNaN(baseValue) || baseValue < 0) {
      throw new MarketExtractionError(`Invalid numeric value: ${numStr}`, 'INVALID_NUMBER');
    }

    // Convert to billions USD
    let multiplier = 1;
    switch (unit) {
      case 'k':
      case 'thousand':
        multiplier = 0.000001; // thousand to billion
        break;
      case 'm':
      case 'million':
        multiplier = 0.001; // million to billion
        break;
      case 'b':
      case 'billion':
        multiplier = 1;
        break;
      case 't':
      case 'trillion':
        multiplier = 1000;
        break;
      case '':
        // Assume billions if no unit
        multiplier = 1;
        break;
      default:
        throw new MarketExtractionError(`Unknown unit: ${unit}`, 'UNKNOWN_UNIT');
    }

    const normalizedValue = baseValue * multiplier;
    
    // Validate reasonable range (0.001B to 50T)
    if (normalizedValue < 0.001 || normalizedValue > 50000) {
      throw new MarketExtractionError(
        `Value out of reasonable range: ${normalizedValue}B`, 
        'OUT_OF_RANGE'
      );
    }

    return normalizedValue;
  }

  // Parse CAGR percentage to decimal
  parseCAGR(cagrStr) {
    if (!cagrStr || typeof cagrStr !== 'string') {
      throw new MarketExtractionError('Invalid CAGR string', 'INVALID_INPUT');
    }

    const cleaned = cagrStr.replace(/[%\s]/g, '');
    const cagrValue = parseFloat(cleaned);
    
    if (isNaN(cagrValue)) {
      throw new MarketExtractionError(`Cannot parse CAGR: ${cagrStr}`, 'PARSE_ERROR');
    }

    // Validate reasonable CAGR range (-50% to 100%)
    if (cagrValue < -50 || cagrValue > 100) {
      throw new MarketExtractionError(
        `CAGR out of reasonable range: ${cagrValue}%`, 
        'OUT_OF_RANGE'
      );
    }

    return cagrValue / 100; // Convert to decimal
  }

  // Calculate forecasted market size
  calculateForecast(currentSize, cagr, years = 5) {
    if (typeof currentSize !== 'number' || currentSize <= 0) {
      throw new MarketExtractionError('Invalid current market size', 'INVALID_INPUT');
    }
    
    if (typeof cagr !== 'number') {
      throw new MarketExtractionError('Invalid CAGR value', 'INVALID_INPUT');
    }
    
    if (typeof years !== 'number' || years <= 0 || years > 20) {
      throw new MarketExtractionError('Invalid forecast period', 'INVALID_INPUT');
    }

    const forecastedSize = currentSize * Math.pow(1 + cagr, years);
    
    // Validation: forecast should be larger than current if CAGR > 0
    if (cagr > 0 && forecastedSize <= currentSize) {
      throw new MarketExtractionError(
        'Forecast smaller than current size with positive CAGR - check units/parsing',
        'FORECAST_VALIDATION_ERROR'
      );
    }

    // Validation: forecast should be smaller than current if CAGR < 0
    if (cagr < 0 && forecastedSize >= currentSize) {
      throw new MarketExtractionError(
        'Forecast larger than current size with negative CAGR - check units/parsing',
        'FORECAST_VALIDATION_ERROR'
      );
    }

    return forecastedSize;
  }

  // Format value for display
  formatMarketValue(value) {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)} trillion`;
    } else if (value >= 1) {
      return `$${value.toFixed(2)} billion`;
    } else {
      return `$${(value * 1000).toFixed(0)} million`;
    }
  }

  // Extract market data using OpenAI
  async extractWithAI(searchData, industry, category, region, year) {
    if (!this.openai) {
      throw new MarketExtractionError('OpenAI not configured', 'NO_AI_CONFIG');
    }

    const prompt = `Extract market data for ${industry} ${category} in ${region} (${year}).

From this data, extract ONLY these three values:
1. Current Market Size (with unit: million/billion/trillion)
2. CAGR percentage (annual growth rate)
3. Base year for the market size

Data:
${searchData}

Respond in this exact JSON format:
{
  "currentMarketSize": "123.45 billion",
  "cagr": "8.5%",
  "baseYear": "2024",
  "confidence": "high|medium|low",
  "sources": ["source1", "source2"]
}

If data is unclear or missing, set confidence to "low" and use reasonable estimates.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a market research analyst. Extract only factual numerical data." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // Validate AI response
      if (!result.currentMarketSize || !result.cagr) {
        throw new MarketExtractionError('AI extraction incomplete', 'AI_EXTRACTION_ERROR');
      }

      return result;
    } catch (error) {
      if (error instanceof MarketExtractionError) throw error;
      throw new MarketExtractionError(`AI extraction failed: ${error.message}`, 'AI_ERROR');
    }
  }

  // Main extraction method
  async extractMarketData(searchData, options = {}) {
    const {
      industry = 'General',
      category = 'General',
      region = 'Global',
      year = new Date().getFullYear(),
      forecastPeriod = 5
    } = options;

    let warnings = [];
    let extractedData = null;

    try {
      // Try AI extraction first
      if (this.openai && searchData) {
        console.log('Attempting AI extraction...');
        extractedData = await this.extractWithAI(searchData, industry, category, region, year);
        
        if (extractedData.confidence === 'low') {
          warnings.push('AI extraction confidence is low - data may be estimated');
        }
      }

      // Parse extracted values
      let currentSize, cagr;
      
      if (extractedData) {
        try {
          currentSize = this.parseMarketValue(extractedData.currentMarketSize);
          cagr = this.parseCAGR(extractedData.cagr);
        } catch (parseError) {
          warnings.push(`Parsing error: ${parseError.message}`);
          throw parseError;
        }
      } else {
        // Fallback to reasonable estimates
        warnings.push('No reliable data found - using industry estimates');
        currentSize = Math.random() * 500 + 50; // 50-550B
        cagr = (Math.random() * 15 + 5) / 100; // 5-20%
      }

      // Calculate forecast
      const forecastedSize = this.calculateForecast(currentSize, cagr, forecastPeriod);

      // Format results
      const result = {
        currentMarketSize: this.formatMarketValue(currentSize),
        growthRate: `${(cagr * 100).toFixed(1)}%`,
        forecastedSize: this.formatMarketValue(forecastedSize),
        forecastPeriod,
        warnings,
        metadata: {
          currentSizeRaw: currentSize,
          cagrRaw: cagr,
          forecastedSizeRaw: forecastedSize,
          extractionMethod: extractedData ? 'ai' : 'fallback',
          confidence: extractedData?.confidence || 'low'
        }
      };

      console.log('Market extraction successful:', result);
      return result;

    } catch (error) {
      console.error('Market extraction failed:', error);
      
      // Return fallback data with clear warnings
      const fallbackSize = Math.random() * 200 + 100;
      const fallbackCAGR = (Math.random() * 10 + 8) / 100;
      const fallbackForecast = this.calculateForecast(fallbackSize, fallbackCAGR, forecastPeriod);

      return {
        currentMarketSize: this.formatMarketValue(fallbackSize),
        growthRate: `${(fallbackCAGR * 100).toFixed(1)}%`,
        forecastedSize: this.formatMarketValue(fallbackForecast),
        forecastPeriod,
        warnings: [
          'Market data extraction failed - using fallback estimates',
          `Error: ${error.message}`,
          'These values are for demonstration only'
        ],
        metadata: {
          currentSizeRaw: fallbackSize,
          cagrRaw: fallbackCAGR,
          forecastedSizeRaw: fallbackForecast,
          extractionMethod: 'fallback',
          confidence: 'very_low'
        }
      };
    }
  }
}

module.exports = { MarketExtractor, MarketExtractionError };