# Biomarker ETL Plan

## Overview
This document outlines the comprehensive plan for extracting, transforming, and loading (ETL) biomarker data from lab results into our system. The plan incorporates both regex-based and LLM-based extraction methods, with robust validation and error handling.

## Database Schema

### Core Tables
1. `biomarker_results`
   - Primary storage for extracted biomarker data
   - Key fields: id, labResultId, name, value, unit, category, referenceRange, testDate, status, extractionMethod, confidence
   - Includes metadata for tracking extraction source and validation status
   - Performance optimized with indexes on:
     - lab_result_id (for efficient lookups)
     - name (for biomarker searches)
     - test_date (for temporal queries)
     - Composite index on (name, test_date) for trend analysis
   - Enforces data integrity with unique constraint on (lab_result_id, name, test_date)
   - Tracks creation and modification timestamps

2. `biomarker_processing_status`
   - Tracks the processing state of each lab result
   - Key fields: labResultId (PK), status, extractionMethod, biomarkerCount, errorMessage
   - Comprehensive metadata tracking:
     - regexMatches: Count of regex-based extractions
     - llmExtractions: Count of LLM-based extractions
     - processingTime: Total processing duration
     - retryCount: Number of processing attempts
     - textLength: Length of processed text
     - errorDetails: Detailed error information
     - biomarkerCount: Total biomarkers found
     - source: Data source identification
   - Temporal tracking with started_at and completed_at timestamps
   - Built-in backup and rollback support for schema updates

3. `biomarker_reference`
   - Reference data for biomarker definitions and ranges
   - Key fields: name (unique), category, defaultUnit, description
   - Rich metadata structure:
     - commonNames: Array of alternative names
     - normalRanges: Detailed ranges with:
       - gender-specific ranges
       - age range specifications
       - range values and units
     - importance: Numerical scoring for biomarker significance
   - Includes initial reference data for common biomarkers:
     - glucose (metabolic)
     - cholesterol (lipid)

4. `labResults` (Related Table)
   - Enhanced metadata for biomarker processing:
     - preprocessedText:
       - rawText: Original extracted text
       - normalizedText: Cleaned and standardized text
       - processingMetadata:
         - originalFormat: Source file format
         - processingSteps: Array of applied transformations
         - confidence: Processing confidence score
         - ocrEngine: OCR engine used (if applicable)
         - processingTimestamp: When processing occurred
         - textLength: Length of processed text
         - lineCount: Number of text lines
         - hasHeaders: Header detection
         - hasFooters: Footer detection
         - qualityMetrics:
           - whitespaceRatio: Text formatting quality
           - specialCharRatio: Special character presence
           - numericRatio: Numerical content ratio
           - potentialOcrErrors: Estimated OCR issues
     - biomarkers: Cached biomarker data
       - parsedBiomarkers: Array of extracted biomarkers
       - parsingErrors: Array of extraction errors
       - extractedAt: Timestamp of extraction

## Schema Features

### Performance Optimizations
1. Indexing Strategy
   - Optimized indexes for common query patterns
   - Composite indexes for efficient trend analysis
   - Foreign key constraints with proper cascade behavior

2. Data Integrity
   - Unique constraints prevent duplicate entries
   - Foreign key relationships ensure referential integrity
   - Timestamp tracking for all operations
   - Proper cascade deletion rules

3. Metadata Management
   - Comprehensive tracking of processing steps
   - Quality metrics for text processing
   - Detailed error tracking and recovery
   - Support for multiple extraction methods

4. Backup and Recovery
   - Built-in backup tables for schema updates
   - Automatic rollback support
   - Data preservation during migrations
   - Verification steps for schema changes

5. Reference Data
   - Pre-populated common biomarkers
   - Structured normal ranges
   - Support for demographic variations
   - Importance scoring system

## ETL Process Flow

### 1. Lab Result Upload & Initial Processing
1. File upload and validation
   - Accept PDF and image files
   - Validate file type and size
   - Generate unique lab result ID
   - Store file metadata in `labResults` table

2. Text Extraction
   - For PDFs: Use pdf-parse library
   - For images: Use Google Vision OCR
   - Store extracted text in lab result metadata
   - Track extraction confidence and method

### 2. Text Preprocessing
1. Normalization
   - Remove special characters and normalize whitespace
   - Convert units to standard format
   - Handle common OCR errors
   - Preserve original text for reference

2. Section Detection
   - Identify biomarker sections in lab reports
   - Handle different report formats and layouts
   - Extract headers and footers
   - Track section boundaries

### 3. Biomarker Extraction

#### A. Regex-Based Extraction
1. Pattern Matching
   - Use predefined patterns for common biomarkers
   - Match biomarker names, values, and units
   - Extract reference ranges
   - Handle variations in formatting

2. Validation
   - Verify numeric values
   - Check units against reference data
   - Validate date formats
   - Flag potential errors

#### B. LLM-Based Extraction
1. Context Analysis
   - Process text in chunks
   - Identify biomarker context
   - Extract relationships between values
   - Handle complex formatting

2. Confidence Scoring
   - Calculate extraction confidence
   - Compare with reference ranges
   - Flag uncertain extractions
   - Log confidence scores

### 4. Data Transformation

1. Value Standardization
   - Convert units to standard format
   - Normalize biomarker names
   - Calculate derived values
   - Apply reference ranges

2. Validation Rules
   - Check against reference data
   - Validate numeric ranges
   - Verify unit compatibility
   - Flag anomalies

3. Status Determination
   - Compare with reference ranges
   - Set High/Low/Normal status
   - Calculate trends
   - Flag critical values

### 5. Data Loading

1. Transaction Management
   - Use atomic transactions
   - Handle rollbacks
   - Maintain data consistency
   - Track processing status

2. Biomarker Storage
   - Insert into biomarker_results
   - Update processing status
   - Store extraction metadata
   - Handle duplicates

3. Error Handling
   - Log extraction errors
   - Track processing failures
   - Implement retry logic
   - Maintain error history

## Implementation Details

### Service Architecture

1. `BiomarkerExtractionService`
   ```typescript
   class BiomarkerExtractionService {
     async processLabResult(labResultId: number): Promise<void>
     private async extractWithRegex(text: string): Promise<Biomarker[]>
     private async extractWithLLM(text: string): Promise<Biomarker[]>
     async storeBiomarkers(labResultId: number, biomarkers: Biomarker[]): Promise<void>
   }
   ```

2. `LabTextPreprocessingService`
   ```typescript
   class LabTextPreprocessingService {
     async preprocessLabText(buffer: Buffer): Promise<PreprocessedText>
     private preprocessPdfText(text: string): string
     private normalizeUnits(text: string): string
   }
   ```

### Error Handling

1. Processing Errors
   - Log detailed error information
   - Update processing status
   - Implement retry mechanism
   - Notify monitoring system

2. Validation Errors
   - Flag invalid biomarkers
   - Store error details
   - Track error patterns
   - Update reference data

### Monitoring & Logging

1. Processing Metrics
   - Track extraction success rates
   - Monitor processing times
   - Log confidence scores
   - Track error rates

2. Quality Metrics
   - Measure extraction accuracy
   - Track validation results
   - Monitor data consistency
   - Report on trends

## Best Practices

1. Data Quality
   - Validate all inputs
   - Use reference data
   - Track confidence scores
   - Maintain audit trails

2. Performance
   - Process in chunks
   - Use efficient patterns
   - Implement caching
   - Monitor resource usage

3. Security
   - Validate file types
   - Sanitize inputs
   - Control access
   - Encrypt sensitive data

4. Maintenance
   - Update patterns regularly
   - Monitor error rates
   - Review reference data
   - Optimize performance

## Testing Strategy

1. Unit Tests
   - Test extraction patterns
   - Validate transformations
   - Check error handling
   - Verify data loading

2. Integration Tests
   - Test full ETL flow
   - Verify database operations
   - Check service interactions
   - Validate error recovery

3. Performance Tests
   - Measure processing times
   - Test concurrent operations
   - Verify resource usage
   - Check scalability

## Deployment & Operations

1. Configuration
   - Environment variables
   - Service settings
   - Pattern updates
   - Reference data

2. Monitoring
   - Track processing status
   - Monitor error rates
   - Check performance
   - Alert on issues

3. Maintenance
   - Update patterns
   - Refresh reference data
   - Optimize performance
   - Handle errors

## Future Improvements

1. Enhanced Extraction
   - Improve pattern matching
   - Add more biomarkers
   - Enhance LLM integration
   - Support more formats

2. Better Validation
   - Add more validation rules
   - Improve error detection
   - Enhance confidence scoring
   - Better trend analysis

3. Performance
   - Optimize processing
   - Improve caching
   - Better concurrency
   - Enhanced scalability 