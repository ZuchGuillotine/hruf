# Biomarker ETL Plan

## Current Status (May 2025)
- Extraction accuracy: 86% with current regex patterns
- Storage: Successfully storing in both biomarkerResults table and lab metadata
- Processing: Cron job verifying storage and functionality
- Components:
  - Biomarker Filter: Working correctly with data retrieval
  - Charting Component: Needs improvement for data visualization

## ETL Pipeline Overview

### 1. Extraction Process
- Primary method: Enhanced regex patterns with validation
- Secondary backup: LLM-based extraction for complex formats
- Current implementation achieves 86% accuracy
- Preprocessing steps:
  - Text normalization
  - Unit standardization
  - OCR error correction
  - Format standardization

### 2. Storage Architecture
- Dual storage strategy:
  - Primary: biomarkerResults table (for querying)
  - Cache: labResults.metadata.biomarkers (for UI)
- Atomic transactions ensure consistency
- Verification process:
  ```typescript
  // Storage verification cron job runs every 6 hours
  - Checks for unprocessed lab results
  - Verifies biomarker extraction completion
  - Validates data consistency between storage locations
  - Logs any discrepancies for manual review
  ```

### 3. Data Validation
- Reference range validation
- Unit consistency checks
- Numeric value boundaries
- Comprehensive metadata tracking
- Processing status monitoring

## Current Challenges & Improvements

### Immediate Priorities
1. Charting Component Enhancement
   - Implement better data aggregation
   - Add trend analysis
   - Improve visualization options

2. Regex Pattern Optimization
   - Current accuracy: 86%
   - Target accuracy: 90%+
   - Focus areas:
     - Complex unit conversions
     - Multi-line results
     - Variable formatting

3. Storage Verification
   - Enhance cron job monitoring
   - Add automated reconciliation
   - Implement failure recovery

### Future Enhancements
1. Advanced Pattern Recognition
   - Machine learning for pattern detection
   - Adaptive learning from corrections
   - Enhanced OCR integration

2. Performance Optimization
   - Batch processing improvements
   - Cache strategy refinement
   - Query optimization

3. Data Quality
   - Enhanced validation rules
   - Automated anomaly detection
   - Historical data verification

## Implementation Notes

### Biomarker Filter Component
- Currently functioning as expected
- Successfully retrieving data from both storage locations
- Implementing proper caching strategy
- Handling unit conversions correctly

### Charting Component Issues
- Current limitations:
  - Data aggregation needs improvement
  - Trend visualization incomplete
  - Scale adaptation issues
- Planned improvements:
  - Enhanced data normalization
  - Better date range handling
  - Improved trend visualization

### Cron Job Functionality
```typescript
// Verification cycle
1. Scan for unprocessed results
2. Verify extraction completion
3. Check storage consistency
4. Update processing status
5. Generate verification report
```

## Next Steps
1. Implement charting component improvements
2. Optimize regex patterns for better accuracy
3. Enhance storage verification process
4. Add comprehensive error recovery
5. Implement automated reconciliation
6. Improve performance monitoring

## Monitoring & Maintenance
- Regular accuracy assessments
- Performance metrics tracking
- Storage consistency checks
- Error pattern analysis
- Automated recovery procedures