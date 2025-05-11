
import { describe, test, expect, beforeEach } from '@jest/globals';
import { BiomarkerExtractionService } from '../services/biomarkerExtractionService';
import { z } from 'zod';

jest.mock('openai', () => ({
  default: class MockOpenAI {
    constructor() {}
    chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              function_call: {
                arguments: JSON.stringify({
                  biomarkers: [{
                    name: 'cholesterol',
                    value: 180,
                    unit: 'mg/dL'
                  }]
                })
              }
            }
          }]
        })
      }
    }
  }
}));

describe('BiomarkerExtractionService', () => {
  let service: BiomarkerExtractionService;

  beforeEach(() => {
    service = new BiomarkerExtractionService();
  });

  describe('extractBiomarkers', () => {
    test('should extract biomarkers using regex patterns', async () => {
      const testText = `
        Cholesterol: 180 mg/dL
        HDL: 45 mg/dL
        Glucose: 95 mg/dL
      `;

      const result = await service.extractBiomarkers(testText);
      
      expect(result.parsedBiomarkers).toHaveLength(3);
      expect(result.parsingErrors).toHaveLength(0);
      expect(result.parsedBiomarkers[0]).toMatchObject({
        name: 'cholesterol',
        value: 180,
        unit: 'mg/dL'
      });
    });

    test('should handle invalid input gracefully', async () => {
      const testText = 'Invalid lab result text';
      
      const result = await service.extractBiomarkers(testText);
      
      expect(result.parsedBiomarkers).toHaveLength(0);
      expect(result.parsingErrors).toHaveLength(1);
    });
  });
});
