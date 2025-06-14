# Biomarker ETL Process Documentation

## Overview
This document describes the biomarker extraction, transformation, and loading (ETL) process for lab results in the HRUF application, including recent optimizations to address performance issues and HTTP proxy errors.

## Architecture

### Data Flow
1. **Lab Result Upload** → User uploads PDF/image files
2. **Text Extraction** → OCR/text extraction from documents
3. **Biomarker Extraction** → Regex and LLM-based extraction
4. **Data Storage** → PostgreSQL database
5. **API Layer** → Express endpoints serve biomarker data
6. **Frontend Display** → React components with Recharts visualization

### Key Components

#### Backend Services
- `biomarkerExtractionService.ts` - Core extraction logic
- `labChartData.ts` - API endpoints for chart data
- Database tables: `lab_results`, `biomarker_results`, `biomarker_processing_status`

#### Frontend Components
- `BiomarkerHistoryChart.tsx` - Recharts-based visualization
- `BiomarkerFilter.tsx` - Biomarker selection UI
- `useLabChartData.ts` - React Query hook for data fetching
- `labs.tsx` - Main lab results page

## Recent Changes (June 2025)

### 1. Performance Optimizations

#### Removed Excessive Logging
- **Problem**: Console.log statements on every render and data fetch were causing performance degradation
- **Solution**: Removed all debug logging from:
  - `useLabChartData` hook
  - `BiomarkerHistoryChart` component  
  - `labs.tsx` page

#### Optimized React Query Configuration
```typescript
{
  queryKey: ['labChartData'],
  retry: 2,
  retryDelay: 1000,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false, // Prevent unnecessary refetches
  refetchOnMount: false, // Don't refetch if data exists
}
```

#### Component Optimization
- Removed debug info card that caused frequent re-renders
- Removed mock data state and related UI
- Chart only renders when biomarkers are selected
- Simplified data transformation logic

### 2. Data Quality Improvements

#### Enhanced Biomarker Validation
Added reasonable range validation for common biomarkers:
```typescript
const BIOMARKER_RANGES = {
  glucose: { min: 20, max: 600 },
  cholesterol: { min: 50, max: 500 },
  hdl: { min: 10, max: 150 },
  ldl: { min: 10, max: 300 },
  // ... more ranges
};
```

#### Fixed Glucose Extraction Issue
- **Problem**: Regex was capturing "74106" from "Normal range: 74 - 106 mg/dL"
- **Solution**: Updated glucose regex pattern to better handle range text:
```typescript
pattern: /(?:Glucose|Blood Glucose|Fasting Glucose|FBG)\s*\n?(?:Normal range:?\s*\d+\s*-\s*\d+\s*(?:mg\/dL|mmol\/L))?\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:mg\/dL|mmol\/L)?\s*(?:High|Low|Normal|H|L|N)?/gi
```

#### Data Filtering in Frontend
Added validation in `useLabChartData` to skip invalid values:
```typescript
if (!biomarker.value || isNaN(biomarker.value) || biomarker.value > 10000) {
  return; // Skip invalid values
}
```

### 3. New API Endpoints

#### Debug Endpoint
`GET /api/labs/chart-data/debug?labId=97`
- Shows raw biomarker data
- Displays preprocessed text for specific lab results
- Useful for troubleshooting extraction issues

#### Reprocess Endpoint
`POST /api/labs/chart-data/reprocess/:labId`
- Deletes existing biomarkers for a lab result
- Re-runs extraction with updated logic
- Returns new biomarker data

## Current Issues & Solutions

### Issue: Chart Not Populating with Real Data
**Symptoms:**
- Mock data displays correctly
- Real biomarker data exists in database
- Chart remains empty when biomarkers selected

**Potential Causes:**
1. Invalid biomarker values (e.g., glucose = 74106)
2. Data transformation issues in the frontend
3. Mismatch between expected and actual data structure

**Recommended Actions:**
1. Use the reprocess endpoint to fix existing data:
   ```javascript
   fetch('/api/labs/chart-data/reprocess/97', { method: 'POST', credentials: 'include' })
   ```
2. Check debug endpoint to verify data structure
3. Ensure biomarker names match between filter and chart data

### Issue: HTTP Proxy Errors
**Symptoms:**
- Multiple "http proxy error: /api/user" messages
- ECONNREFUSED errors
- Potential server crash loop

**Root Causes:**
1. Excessive API calls due to missing query optimization
2. Console logging on every render
3. Debug components causing re-renders
4. Missing cache configuration

**Solutions Implemented:**
1. Added proper React Query caching (staleTime, gcTime)
2. Disabled automatic refetching (refetchOnWindowFocus, refetchOnMount)
3. Removed all debug logging
4. Simplified component structure
5. Conditional rendering of chart component

## Best Practices

### Frontend
1. Use React Query's caching capabilities
2. Minimize console logging in production
3. Implement proper error boundaries
4. Use memoization for expensive computations

### Backend
1. Validate biomarker values before storage
2. Use reasonable range checks
3. Log errors, not every operation
4. Implement proper error handling in extraction

### Data Quality
1. Test regex patterns with various lab report formats
2. Validate extracted values against known ranges
3. Provide reprocessing capabilities
4. Store extraction metadata for debugging

## Future Improvements

1. **Batch Processing**: Process multiple lab results in parallel
2. **Caching Layer**: Add Redis for frequently accessed data
3. **WebSocket Updates**: Real-time updates for processing status
4. **ML Model**: Train custom model for better extraction accuracy
5. **Data Normalization**: Standardize units across different lab formats
6. **Audit Trail**: Track all data modifications and reprocessing

## Monitoring

Key metrics to track:
- Extraction success rate
- Average processing time
- API response times
- Cache hit rates
- Error frequencies

## Troubleshooting Guide

### Chart Not Showing Data
1. Check browser console for errors
2. Verify API response: `/api/labs/chart-data`
3. Check if biomarkers have valid numeric values
4. Ensure dates are properly formatted
5. Verify biomarker names match between filter and data

### Extraction Failures
1. Check lab result text: `/api/labs/chart-data/debug?labId=X`
2. Review extraction logs in server console
3. Test regex patterns with sample text
4. Consider reprocessing with updated logic

### Performance Issues
1. Check React Query cache settings
2. Monitor API call frequency
3. Review component re-render patterns
4. Check for memory leaks in chart component
5. Verify database query performance 