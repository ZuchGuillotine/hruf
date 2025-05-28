
// server/tests/openai.test.ts

import { chatWithAI, MODELS, estimateTokenCount } from '../openai';
import logger from '../utils/logger';

/**
 * Test suite for OpenAI integration
 * 
 * These tests verify the OpenAI API integration and streaming functionality
 * 
 * Run tests with: npm test -- --testPathPattern=openai
 */

describe('OpenAI Service Tests', () => {
  // Skip tests if API key is not available
  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY not available, skipping OpenAI tests');
      // Mark all tests to be skipped
      jest.setTimeout(0);
    }
  });
  
  // Set longer timeout for API calls
  jest.setTimeout(30000);

  test('Should generate response from OpenAI', async () => {
    // Skip if no API key
    if (!process.env.OPENAI_API_KEY) return;
    
    // Test messages
    const messages = [
      { role: 'user', content: 'What are the benefits of Vitamin C?' }
    ];
    
    // Get streaming response
    const stream = chatWithAI(messages);
    
    // Collect chunks
    let fullResponse = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      if (chunk.response) {
        fullResponse += chunk.response;
        chunkCount++;
      }
    }
    
    // Verify response
    expect(fullResponse.length).toBeGreaterThan(0);
    expect(chunkCount).toBeGreaterThan(0);
    
    // Should contain relevant information about Vitamin C
    expect(fullResponse.toLowerCase()).toContain('vitamin c');
    
    // Log statistics
    logger.info(`OpenAI response stats: ${chunkCount} chunks, ${fullResponse.length} chars`);
  });
  
  test('Should use different models for different use cases', async () => {
    // Check model configuration
    expect(MODELS.QUALITATIVE_CHAT).toBeDefined();
    expect(MODELS.QUERY_CHAT).toBeDefined();
    
    // Should be different models for different purposes
    expect(MODELS.QUALITATIVE_CHAT).not.toEqual(MODELS.QUERY_CHAT);
  });
  
  test('Should estimate token count correctly', () => {
    // Test texts of different lengths
    const shortText = "Brief supplement summary";
    const mediumText = "Vitamin D3 is essential for calcium absorption and bone health. It also plays a role in immune function and mood regulation.";
    const longText = "Magnesium is involved in over 300 enzymatic reactions in the body. It helps with muscle and nerve function, blood pressure regulation, and energy production. Common deficiency symptoms include muscle cramps, fatigue, and poor sleep. Magnesium supplements come in various forms including citrate, glycinate, and oxide, each with different absorption rates and effects.";
    
    // Estimate tokens
    const shortTokens = estimateTokenCount(shortText);
    const mediumTokens = estimateTokenCount(mediumText);
    const longTokens = estimateTokenCount(longText);
    
    // Check relative sizing
    expect(shortTokens).toBeLessThan(mediumTokens);
    expect(mediumTokens).toBeLessThan(longTokens);
    
    // Check specific values against expected ranges
    // Using rough estimation of 4 chars per token
    expect(shortTokens).toBeCloseTo(shortText.length / 4, 0);
    expect(mediumTokens).toBeCloseTo(mediumText.length / 4, 0);
    expect(longTokens).toBeCloseTo(longText.length / 4, 0);
  });
  
  test('Should handle model override parameter', async () => {
    // Skip if no API key
    if (!process.env.OPENAI_API_KEY) return;
    
    // Test messages
    const messages = [
      { role: 'user', content: 'What is a good supplement stack for energy?' }
    ];
    
    // Use model override parameter
    const stream = chatWithAI(messages, MODELS.QUERY_CHAT);
    
    // Collect chunks
    let fullResponse = '';
    
    for await (const chunk of stream) {
      if (chunk.response) {
        fullResponse += chunk.response;
      }
    }
    
    // Verify response exists
    expect(fullResponse.length).toBeGreaterThan(0);
    
    // Should contain relevant information about energy supplements
    expect(fullResponse.toLowerCase()).toMatch(/energy|supplements|vitamin|mineral/);
  });
});
import { chatWithAI, MODELS } from '../openai';

describe('OpenAI Integration', () => {
  test('chatWithAI should handle streaming responses', async () => {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' }
    ];
    
    const generator = chatWithAI(messages);
    let fullResponse = '';
    
    // Consume the generator
    for await (const chunk of generator) {
      expect(chunk).toHaveProperty('response');
      expect(chunk).toHaveProperty('streaming');
      
      if (chunk.response) {
        fullResponse += chunk.response;
      }
    }
    
    expect(fullResponse).toContain('mock');
  });
  
  test('chatWithAI should handle model override', async () => {
    const messages = [
      { role: 'user', content: 'Tell me about supplements' }
    ];
    
    const generator = chatWithAI(messages, MODELS.QUERY_CHAT);
    let received = false;
    
    // Just check if we get any response
    for await (const chunk of generator) {
      received = true;
      break;
    }
    
    expect(received).toBe(true);
  });
});
