**Revised Implementation Plan:**

1. **Data Flow Verification & Monitoring**
   - Implement comprehensive logging at each ETL stage:
     ```
     Upload → Initial Processing → Text Processing → Biomarker Extraction → Data Storage → API → UI
     ```
   - Add transaction tracking IDs to follow data through pipeline
   - Create monitoring dashboard for pipeline health
   - Implement discrepancy detection between storage locations (table vs metadata)

2. **Storage Layer Validation**
   - Verify both storage locations:
     - Primary: `biomarkerResults` table
     - Cache: `labResults.metadata.biomarkers`
   - Add atomic transaction logging
   - Implement chunked insert monitoring
   - Add validation checks for data consistency between locations
   - Create automated reconciliation process

3. **Text Processing Pipeline Enhancement**
   - Implemented proper fallback chain:
     ```
     PDF Extraction (Enhanced pdf-parse → Basic pdf-parse → OCR) → Text Normalization → Quality Metrics
     ```
   - Added quality metrics validation:
     - Confidence scoring per extraction method
     - Medical term detection
     - Unit consistency checking
     - Overall quality assessment
   - Implemented text preprocessing validation
   - Added confidence scoring for extracted text
   - Created text extraction status tracking
   - Enhanced logging and error reporting
   - Leveraged existing Google Vision OCR infrastructure
   - Added PDF-specific OCR options
   - Improved medical document processing

4. **Biomarker Extraction Optimization**
   - Implement parallel processing:
     ```
     Regex Extraction ─┐
                      ├─> Merge & Validate ─> Storage
     LLM Extraction  ─┘
     ```
   - Add extraction method tracking
   - Implement confidence scoring
   - Create extraction validation rules
   - Add biomarker normalization pipeline

5. **Data Quality & Validation**
   - Implement comprehensive validation at each stage:
     ```
     Raw Text → Preprocessed Text → Extracted Biomarkers → Stored Data
     ```
   - Add data quality metrics
   - Implement validation rules
   - Create quality score tracking
   - Add automated quality checks

6. **API Layer Enhancement**
   - Implement proper data transformation:
     ```
     Stored Data → API Response → React Query Cache → UI State
     ```
   - Add response validation
   - Implement proper error handling
   - Add caching strategy
   - Create API health monitoring

7. **UI Integration & State Management**
   - Implement proper data flow:
     ```
     API Response → React Query → Component State → UI Rendering
     ```
   - Add loading states
   - Implement error boundaries
   - Create data refresh strategy
   - Add user feedback system

8. **Monitoring & Debugging**
   - Implement comprehensive logging:
     ```
     Pipeline Stage → Status → Metrics → Alerts
     ```
   - Add performance metrics
   - Create debug endpoints
   - Implement automated testing
   - Add alert system

9. **Error Recovery & Resilience**
   - Implement retry strategies:
     ```
     Stage Failure → Retry Logic → Fallback → Error Reporting
     ```
   - Add circuit breakers
   - Implement graceful degradation
   - Create error recovery procedures
   - Add user notification system

10. **Performance Optimization**
    - Implement caching strategies:
      ```
      Database → API Cache → React Query → UI Cache
      ```
    - Add query optimization
    - Implement batch processing
    - Create performance monitoring
    - Add resource usage tracking

**Key Differences from Original Plan:**
1. Added explicit ETL pipeline stages
2. Included both storage locations (table and metadata)
3. Added comprehensive monitoring
4. Implemented proper data quality checks
5. Added resilience patterns
6. Included performance optimization
7. Added proper error recovery
8. Implemented proper caching strategies

**Implementation Priority:**
1. Data Flow Verification & Monitoring (Critical for debugging)
2. Storage Layer Validation (Core functionality)
3. Text Processing Pipeline Enhancement (Data quality)
4. Biomarker Extraction Optimization (Accuracy)
5. Data Quality & Validation (Reliability)
6. API Layer Enhancement (Performance)
7. UI Integration & State Management (User experience)
8. Monitoring & Debugging (Maintenance)
9. Error Recovery & Resilience (Stability)
10. Performance Optimization (Scalability)

Would you like me to proceed with implementing any of these steps? We should start with the Data Flow Verification & Monitoring to establish a baseline for the current pipeline state and identify where exactly the data flow is breaking down.

This revised plan better aligns with the ETL architecture documented in biomarkeretl_plan.md and provides a more comprehensive approach to restoring and improving the pipeline.
