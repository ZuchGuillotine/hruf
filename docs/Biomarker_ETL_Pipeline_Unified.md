# Biomarker ETL Pipeline: Unified Documentation

## 1. Overview

This document provides a comprehensive overview of the biomarker Extraction, Transformation, and Loading (ETL) process for lab results. It serves as a single source of truth for understanding the architecture, data flow, current challenges, and future improvements for the biomarker processing pipeline.

The system processes lab result files (PDF, images, etc.) to extract, validate, and store biomarker data. This data is maintained in two locations:
1.  **Primary Storage**: The `biomarker_results` table in a PostgreSQL database, used for querying, analysis, and historical tracking.
2.  **Cached Storage**: The `lab_results.metadata.biomarkers` JSONB field, used for quick access and efficient UI rendering.

## 2. Architecture & Data Flow

The ETL pipeline follows these sequential stages:

**Upload → Text Extraction → Biomarker Extraction → Data Storage → API Layer → Frontend Display**

### 2.1. Key Components

#### Backend Services
- `labUploadService.ts`: Handles file uploads, validation, and initiates the processing pipeline.
- `labTextPreprocessingService.ts`: Extracts and normalizes text from various file formats.
- `biomarkerExtractionService.ts`: Extracts structured biomarker data from raw text using a hybrid Regex and LLM approach.
- `labSummaryService.ts`: Generates qualitative summaries of lab results.
- `labChartData.ts`: Provides API endpoints to serve aggregated and processed data to the frontend.

#### Database Tables
- `lab_results`: Stores metadata about the uploaded lab file.
- `biomarker_results`: Stores individual extracted biomarker data points.
- `biomarker_processing_status`: Tracks the status of the ETL process for each lab result.

#### Frontend Components
- `BiomarkerHistoryChart.tsx`: Visualizes biomarker trends over time using Recharts.
- `BiomarkerFilter.tsx`: Allows users to select which biomarkers to display on the chart.
- `useLabChartData.ts`: React Query hook for fetching and managing biomarker data.

### 2.2. Detailed Processing Steps

1.  **File Upload & Validation**:
    *   User uploads a file (PDF, DOCX, JPG, PNG).
    *   The system validates file type and size (max 50MB).
    *   The file is saved to the `/uploads` directory.
    *   An initial record is created in the `lab_results` table.
    *   A record is created in `biomarker_processing_status` to track progress.

2.  **Text Processing & Normalization**:
    *   A robust fallback chain is used for text extraction:
        *   **PDF**: Enhanced `pdf-parse` → Basic `pdf-parse` → Google Vision OCR.
        *   **DOCX**: `mammoth`.
        *   **Images**: Google Vision OCR.
    *   The extracted text is normalized and cleaned (e.g., removing headers/footers, fixing common OCR errors).
    *   Text quality metrics are calculated and stored.

3.  **Biomarker Extraction**:
    *   A hybrid approach is used for extraction:
        1.  **Regex First**: A set of predefined regex patterns attempts to quickly extract common biomarkers.
        2.  **LLM Enhancement**: The raw text, along with the results from the regex pass, is sent to an LLM (GPT-4o) to find additional biomarkers and improve accuracy.
    *   All extracted biomarkers are validated (e.g., for reasonable numeric ranges) and normalized (e.g., standardizing units).
    *   Confidence scores are assigned based on the extraction method.

4.  **Data Storage**:
    *   The pipeline uses atomic transactions to ensure data consistency between the `biomarker_results` table and the `lab_results.metadata`.
    *   Existing biomarkers for a given `labResultId` are deleted before new ones are inserted.
    *   New biomarkers are inserted in chunks to prevent database timeouts.
    *   The processing status is updated to `completed` or `error`.

## 3. Current Status & Immediate Priorities

### 3.1. Current Status (June 2025)
-   **Extraction Accuracy**: ~86% with the current hybrid model, but known issues exist (e.g., glucose regex).
-   **Storage**: Dual storage is functional, but prone to consistency issues if a transaction fails.
-   **Charting Component**: Often fails to render due to data quality issues and data transformation problems.

### 3.2. Implementation Priorities
1.  **Data Quality & Extraction Reliability (Critical)**:
    *   Fix the known `glucose` regex bug that extracts values from the reference range.
    *   Improve regex patterns to handle multi-line results and variable formatting.
    *   Enhance the LLM prompt to prevent extraction failures when a `unit` is not present (e.g., for ratios).
    *   Implement more robust validation and reasonable range checks in `biomarkerExtractionService.ts`.
2.  **Storage Layer & Data Consistency**:
    *   Strengthen the transaction process to ensure updates to `biomarker_results` and `lab_results.metadata` are truly atomic.
    *   Implement an automated reconciliation process (e.g., a nightly cron job) to detect and fix discrepancies between the two storage locations.
3.  **API & Frontend Integration**:
    *   Ensure data transformations in the frontend can handle data variations and potential invalid values gracefully.
    *   Fix data aggregation and date handling in `BiomarkerHistoryChart.tsx`.
    *   Improve loading and error states in the UI.
4.  **Monitoring & Debugging**:
    *   Enhance logging with unique transaction IDs to trace a lab result through the entire pipeline.
    *   Create a monitoring dashboard to view pipeline health, error rates, and processing times.
    *   Leverage the `/api/labs/chart-data/debug` and `/api/labs/chart-data/reprocess/:labId` endpoints for easier troubleshooting.

## 4. Error Handling & Resilience

-   **Comprehensive Logging**: Detailed, structured logs are essential at each stage.
-   **Retry Logic**: The pipeline should include retry mechanisms with exponential backoff for transient failures (e.g., network issues, temporary API unavailability). The general flow should be: `Stage Failure → Retry Logic → Fallback → Final Error Reporting`.
-   **Transaction Rollback**: On any failure during the storage step, the entire transaction must be rolled back to prevent partial data writes.
-   **Status Tracking**: The `biomarker_processing_status` table must be reliably updated to reflect the final state (`completed` or `error`), including a descriptive error message.

## 5. Future Enhancements

1.  **Performance Optimization**:
    *   Implement parallel processing for large files or batch uploads.
    *   Introduce a dedicated caching layer (e.g., Redis) for frequently accessed data to reduce database load.
2.  **Advanced Extraction**:
    *   Train a custom Machine Learning model to improve pattern detection and extraction accuracy.
    *   Implement adaptive learning, where manual corrections are fed back into the system to improve future extractions.
3.  **Monitoring & Alerting**:
    *   Set up real-time, automated alerts for data inconsistencies, high error rates, or significant drops in extraction accuracy.
4.  **Data Auditing**:
    *   Implement an audit trail to track all modifications and reprocessing events for a given lab result. 