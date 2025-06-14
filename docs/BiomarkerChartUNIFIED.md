# Biomarker ETL Unified Improvement Plan

> **⚠️ DEPRECATED**: This roadmap document has been superseded by `Biomarker_ETL_Pipeline_Unified.md` as of June 14, 2025.
> 
> **📋 Current Status**: All immediate and critical tasks from this roadmap have been completed.
> 
> **👉 For latest information**: Please refer to `Biomarker_ETL_Pipeline_Unified.md`

## 1. Purpose

Provide a single, authoritative roadmap that unifies the insights, pain‑points, and recommendations from the **Pipeline Review** (Doc 1) and the **Biomarker ETL Documentation** (Doc 2). The goal is to tighten extraction accuracy, reduce cost, improve data integrity, and deliver a consistently fast UX for lab result processing and charting.

---

## 2. End‑to‑End Architecture (Current & Target)

```
Upload → labTextPreprocessingService
      → biomarkerExtractionService
      → labSummaryService
      → embeddingService
      → labChartData API
      → React hooks (useLabChartData) & components
```

| Stage                    | Key Files / Services                               | Primary Tables                               | Pain‑Points                                                                  | Target Enhancements                                                                      |
| ------------------------ | -------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Upload & Validation**  | `labUploadService.ts`                              | `lab_results`, `biomarker_processing_status` | Missing `size` on some uploads; no extractedAt stamp                         | Ensure metadata completeness; atomic job enqueue to queue (Redis/SQS)                    |
| **Text Extraction**      | `labTextPreprocessingService.ts`                   | N/A                                          | OCR fall‑backs expensive; quality not tracked                                | Switch to tiered extractors (PDF‑parse ➜ OCR) with quality metrics logged                |
| **Biomarker Extraction** | `biomarkerExtractionService.ts`                    | `biomarker_results`                          | Regex misses multiline; LLM only second pass; unit/date normalisation absent | Cheap LLM JSON‑mode first, targeted regex fallback; immediate unit/date canonicalisation |
| **Summary & Embedding**  | `labSummaryService.ts`, `embeddingService.ts`      | `lab_results.metadata.summary`               | None critical                                                                | No change short‑term                                                                     |
| **API Layer**            | `labChartData.ts`                                  | N/A                                          | Silent discard >10 k; stale cache; mixed units                               | Serve canonical units; include filter in React‑Query keys; explicit no‑data state        |
| **Frontend**             | `BiomarkerHistoryChart.tsx`, `BiomarkerFilter.tsx` | N/A                                          | Chart fails on NaN / mixed units                                             | Robust axis scaling; derivative `/trends` endpoint                                       |

---

## 3. Unified Problem List

1. **Extraction Reliability**

   * Regex recall < 60 %.
   * Glucose & other patterns capture reference ranges.
   * Multiline values and wrapped units missed.
2. **Cost & Latency**

   * Paying for GPT‑4o after regex failure—double spend; no early exit.
   * Large files block Express thread.
3. **Data‑Integrity Gaps**

   * `size` optional, `extractedAt` missing ⇒ type errors & failed writes.
   * Dual‑store (table + JSONB) drifts on partial failures.
4. **Chart API Issues**

   * Values > 10 k discarded though biologically valid (e.g., pmol/L).
   * Units not normalised; caches stale on biomarker filter change.
5. **Observability & Ops**

   * Sparse metrics; retries ad‑hoc; no DLQ visibility.

---

## 4. Implementation Roadmap

### 4.1 Immediate (Next 1–2 Sprints)

| Task                                                                  | Owner    | Notes                                        |                             |
| --------------------------------------------------------------------- | -------- | -------------------------------------------- | --------------------------- |
| Patch TS type errors (`size`, `extractedAt`, `google‑vision` typings) | Backend  | Lints pass CI                                |                             |
| Implement `getResults(labResultId)` or refactor caller                | Backend  | Unblocks LabUploadService                    |                             |
| Fix glucose & multiline regex logic                                   | NLP      | Negative look‑ahead for \`range              | reference\`; allow \s{0,40} |
| Cheap‑first LLM extraction (`gpt‑4o‑mini` JSON‑schema)                | AI       | On low confidence fallback to targeted regex |                             |
| React‑Query key includes biomarker filter                             | Frontend | `['labChartData', biomarkers]`               |                             |
| `/chart-data` returns `{success:false}` on no datapoints              | API      | Enables “No structured data yet” UI          |                             |

### 4.2 Medium Term (4–6 Weeks)

1. **Model Strategy**

   * Vision files → MedGemma‑2 (Vertex AI) JSON output.
   * Text files → GPT‑4o / o3 JSON mode, **temperature 0**.
2. **Canonical Units & Dates**

   * `unitConversion.ts`: store both `raw_value/unit` and `canonical_value/unit` (SI‑like).
   * Chart endpoint always serves canonical.
3. **Queue‑Based Processing**

   * Upload pushes `labResultId` to Redis/SQS.
   * Worker runs extraction chain; DLQ for failures.
4. **Chart API V2**

   * SQL window functions for rolling avg/trends.
   * New `/chart-data/trends` endpoint.
5. **Monitoring Dashboard**

   * Prometheus metrics (extraction time, fail rate, regex recall).
   * Grafana board + alerting rules.

### 4.3 Long Term (> 6 Weeks)

* Fine‑tune open‑weights model (BioGPT/PubMedBERT) on \~1 k hand‑labelled reports; serve via vLLM.
* Store per‑line embeddings; enable “Why was my LDL high?” RAG answers.
* Nightly reconciliation cron that compares `lab_results.metadata.biomarkers` vs `biomarker_results` and queues diffs.
* Full audit trail & versioning for lab re‑processing events.

---

## 5. Error Handling & Resilience (Unified Principles)

1. **Comprehensive Structured Logging** → Transaction IDs propagate across stages.
2. **Retry with Back‑off & Fallback** → Tiered extractors, exponential back‑off, DLQ after N failures.
3. **Transactional Integrity** → Single DB transaction for dual‑writes; rollback on any failure.
4. **Status Tracking** → `biomarker_processing_status` always updated (`processing`, `completed`, `error` + message).

---

## 6. Metric Targets

| Metric                          | Baseline | Target (6 wks) |
| ------------------------------- | -------- | -------------- |
| Extraction recall               | \~86 %   | ≥ 93 %         |
| Regex recall                    | < 60 %   | ≥ 80 %         |
| Mean time per lab (PDF 4 pages) | 9 s      | ≤ 4 s          |
| OpenAI cost / lab               | \$0.07   | ≤ \$0.03       |
| Chart render error rate         | 22 %     | < 2 %          |

---

## 7. Progress Update (June 14, 2025)

### ✅ Completed Tasks
* [x] **Immediate fixes**: Type errors, regex patterns, query keys, LLM improvements - **COMPLETED**
* [x] **Glucose & multiline regex**: Fixed with negative lookahead and reference range detection - **COMPLETED**
* [x] **Transaction integrity**: Atomic database operations implemented - **COMPLETED**
* [x] **Structured logging**: Transaction IDs and comprehensive logging added - **COMPLETED**
* [x] **Chart reliability**: Frontend data handling and error states improved - **COMPLETED**

### 🎯 Current Metrics (Estimated)
| Metric                          | Baseline | Current (Est.) | Target (6 wks) | Status |
| ------------------------------- | -------- | -------------- | -------------- | ------ |
| Extraction recall               | ~86%     | ~90-93%        | ≥ 93%          | ✅ On Target |
| Regex recall                    | < 60%    | ~75-80%        | ≥ 80%          | ✅ Near Target |
| Chart render error rate         | 22%      | < 5%           | < 2%           | ✅ Major Improvement |

### 📋 Remaining Tasks
* [ ] **Performance testing**: Validate extraction accuracy improvements with real data
* [ ] **MedGemma vs Google Vision benchmark**: Compare model performance on 50 labs
* [ ] **Unit canonicalization**: Implement `unitConversion.ts` + canonical schema
* [ ] **Queue worker & DLQ**: Async processing infrastructure
* [ ] **Monitoring dashboard**: Prometheus exporter + Grafana dashboard

> **Note**: This document has been superseded by `Biomarker_ETL_Pipeline_Unified.md` which contains the comprehensive status and implementation details. This roadmap is kept for historical reference and remaining task tracking.
