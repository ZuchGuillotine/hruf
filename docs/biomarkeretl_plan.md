# Biomarker ETL Pipeline Implementation Plan

## Overview
The biomarker ETL (Extract, Transform, Load) pipeline processes lab result files to extract, validate, and store biomarker data. The system maintains data in two locations for different purposes:
1. Primary storage in `biomarkerResults` table for querying and analysis
2. Cached copy in `labResults.metadata.biomarkers` for quick access and UI rendering

## Data Flow
1. **Upload & Initial Processing**
   - File validation (size, type, format)
   - File storage in uploads directory
   - Initial lab result record creation
   - Progress tracking initialization

2. **Text Processing**
   - File content extraction with robust fallback chain:
     1. Enhanced pdf-parse with custom renderer for text-based PDFs
     2. Basic pdf-parse for simpler PDFs
     3. Google Vision OCR for image-based PDFs
   - Text normalization and cleaning
   - Quality metrics calculation:
     - Confidence scoring per extraction method
     - Medical term detection
     - Unit consistency checking
     - Overall quality assessment
   - Comprehensive logging and error tracking
   - Extraction attempt monitoring

3. **Biomarker Extraction**
   - Text analysis using regex and LLM-based extraction
   - Biomarker validation and normalization
   - Confidence scoring
   - Error tracking for failed extractions

4. **Data Storage**
   - Atomic transaction for both storage locations
   - Chunked inserts to prevent timeouts
   - Metadata updates with processing information
   - Error handling and status tracking

## Implementation Details

### Storage Structure
```typescript
// Primary Storage (biomarkerResults table)
interface BiomarkerResult {
  id: number;
  labResultId: number;
  name: string;
  value: string;
  unit: string;
  category: string;
  referenceRange: string | null;
  testDate: Date;
  status: string | null;
  extractionMethod: string;
  confidence: string | null;
  metadata: {
    sourceText?: string;
    extractionTimestamp: string;
    validationStatus: string;
  };
}

// Cached Storage (labResults.metadata.biomarkers)
interface BiomarkerMetadata {
  parsedBiomarkers: Array<{
    name: string;
    value: number;
    unit: string;
    referenceRange?: string;
    testDate?: string;
    category?: string;
  }>;
  parsingErrors: string[];
  extractedAt: string;
}
```

### Processing Steps
1. **File Upload**
   - Validate file type and size
   - Save to uploads directory
   - Create initial lab result record
   - Initialize progress tracking

2. **Text Processing**
   - Extract text content using appropriate method:
     - PDF: Try enhanced pdf-parse → basic pdf-parse → OCR
     - DOCX: Use mammoth for extraction
     - Images: Use Google Vision OCR
   - Normalize and clean text
   - Calculate quality metrics:
     - Text extraction confidence
     - Medical term presence
     - Unit consistency
     - Overall quality score
   - Store preprocessed text with metadata
   - Track extraction attempts and results

3. **Biomarker Extraction**
   - Extract biomarkers using regex and LLM
   - Validate and normalize values
   - Calculate confidence scores
   - Track extraction errors

4. **Data Storage**
   - Begin transaction
   - Delete existing biomarkers
   - Insert new biomarkers in chunks
   - Update metadata
   - Update processing status
   - Commit transaction

### Error Handling
- Comprehensive error tracking at each step
- Transaction rollback on failure
- Error status updates in database
- Detailed error logging
- Progress tracking with error states

### Monitoring & Debugging
- Debug endpoint for comparing both storage locations
- Discrepancy detection between table and metadata
- Processing status tracking
- Quality metrics monitoring
- Error rate tracking

## Testing Strategy
1. **Unit Tests**
   - File validation
   - Text processing
   - Biomarker extraction
   - Data storage operations

2. **Integration Tests**
   - End-to-end upload flow
   - Transaction handling
   - Error recovery
   - Data consistency

3. **Performance Tests**
   - Large file handling
   - Concurrent uploads
   - Transaction timeout prevention
   - Memory usage monitoring

## Future Improvements
1. **Performance Optimization**
   - Parallel processing for large files
   - Caching strategies
   - Batch processing optimizations

2. **Data Quality**
   - Enhanced validation rules
   - Machine learning for extraction
   - Automated quality checks

3. **Monitoring**
   - Real-time processing metrics
   - Automated discrepancy detection
   - Alert system for data inconsistencies
