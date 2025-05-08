import express, { Request } from 'express';
import { db } from '@db';
import { labResults } from '@db/schema';
import { eq } from 'drizzle-orm';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { labSummaryService } from '../services/labSummaryService';
import logger from '../utils/logger';
import { checkLabUploadLimit } from '../middleware/tierLimitMiddleware';
import { biomarkerExtractionService } from '../services/biomarkerExtractionService';

// Define a flexible user type that can handle both authenticated and anonymous users
type BaseUser = {
  id?: number;  // Optional for anonymous users
  sessionId?: string;  // For tracking anonymous uploads
};

type AuthenticatedUser = BaseUser & {
  id: number;  // Required for authenticated users
  username?: string;
  email?: string;
};

type AnonymousUser = BaseUser & {
  sessionId: string;  // Required for anonymous users
};

type LabUser = AuthenticatedUser | AnonymousUser;

// Extend Express Request type to include files and flexible user
interface LabRequest extends Request {
  files?: fileUpload.FileArray;
  user?: LabUser;
}

const router = express.Router();

// Configure file upload middleware
const uploadMiddleware = fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  safeFileNames: true,
  preserveExtension: true,
  debug: true,
  createParentPath: true,
  parseNested: true,
  abortOnLimit: true
});

// Get all lab results for a user
router.get('/', async (req, res) => {
  try {
    const results = await db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, req.user!.id))
      .orderBy(labResults.uploadedAt, "desc");

    logger.info(`Retrieved ${results.length} lab results for user ${req.user!.id}`);
    res.json(results);
  } catch (error) {
    logger.error('Error fetching lab results:', {
      userId: req.user!.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
});

// Upload new lab result
router.post('/', uploadMiddleware, checkLabUploadLimit, async (req: LabRequest, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file as fileUpload.UploadedFile;
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info(`Created uploads directory at ${uploadDir}`);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    const relativeUrl = `/uploads/${fileName}`;

    // Move file to uploads directory
    await file.mv(filePath);
    logger.info(`File moved to ${filePath}`);
    
    // Save file info to database with enhanced metadata
    const [result] = await db
      .insert(labResults)
      .values({
        userId: req.user?.id || null,  // Allow null for anonymous uploads
        fileName: file.name,
        fileType: file.mimetype,
        fileUrl: relativeUrl,
        metadata: {
          size: file.size,
          lastViewed: new Date().toISOString(),
          tags: [],
          ocr: {
            originalName: file.name,
            absolutePath: filePath,
            relativePath: relativeUrl,
            uploadTimestamp: Date.now(),
            mimeType: file.mimetype,
            md5: file.md5,
            sessionId: req.user?.sessionId  // Store session ID for anonymous uploads
          }
        }
      })
      .returning();

    logger.info('Lab result saved:', {
      labId: result.id,
      fileName: file.name,
      fileUrl: relativeUrl,
      userId: req.user?.id || null,
      fileSize: file.size
    });

    // Trigger background processing in parallel
    try {
      // Start summarization
      labSummaryService.summarizeLabResult(result.id)
        .then((summary) => {
          if (summary) {
            logger.info(`Background summary generation completed for lab ID ${result.id}`);
          } else {
            logger.warn(`Background summary generation completed but returned null for lab ID ${result.id}`);
          }
        })
        .catch(summaryError => {
          logger.error('Background summary generation failed:', {
            labId: result.id,
            error: summaryError instanceof Error ? summaryError.message : String(summaryError),
            stack: summaryError instanceof Error ? summaryError.stack : undefined
          });
        });

      // Start biomarker extraction
      biomarkerExtractionService.processLabResult(result.id)
        .then(() => {
          logger.info(`Background biomarker extraction completed for lab ID ${result.id}`);
        })
        .catch(biomarkerError => {
          logger.error('Background biomarker extraction failed:', {
            labId: result.id,
            error: biomarkerError instanceof Error ? biomarkerError.message : String(biomarkerError),
            stack: biomarkerError instanceof Error ? biomarkerError.stack : undefined
          });
        });
        
      logger.info('Background processing started for lab ID:', result.id);
    } catch (processingError) {
      logger.error('Failed to initiate lab processing:', {
        labId: result.id,
        error: processingError instanceof Error ? processingError.message : String(processingError),
        stack: processingError instanceof Error ? processingError.stack : undefined
      });
    }

    res.json(result);
  } catch (error) {
    logger.error('Error uploading lab result:', {
      userId: req.user?.id || null,
      fileName: req.files?.file ? (req.files.file as fileUpload.UploadedFile).name : 'unknown',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to upload lab result' });
  }
});

// Delete lab result
router.delete('/:id', async (req, res) => {
  const labId = parseInt(req.params.id);
  
  try {
    // First fetch the record to get file path
    const [labRecord] = await db
      .select()
      .from(labResults)
      .where(eq(labResults.id, labId))
      .limit(1);

    if (!labRecord) {
      logger.warn(`Attempted to delete non-existent lab result: ${labId}`);
      return res.status(404).json({ error: 'Lab result not found' });
    }

    // Delete database record
    await db
      .delete(labResults)
      .where(eq(labResults.id, labId));

    // Delete physical file if it exists
    try {
      const filePath = path.join(process.cwd(), labRecord.fileUrl);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted lab result file:`, {
          labId,
          filePath,
          fileName: labRecord.fileName
        });
      } else {
        logger.warn(`Lab result file not found during deletion:`, {
          labId,
          filePath,
          fileName: labRecord.fileName
        });
      }
    } catch (fileError) {
      logger.error('Error deleting lab result file:', {
        labId,
        error: fileError instanceof Error ? fileError.message : String(fileError),
        stack: fileError instanceof Error ? fileError.stack : undefined
      });
    }

    res.json({ 
      message: 'Lab result deleted successfully',
      labId,
      fileName: labRecord.fileName
    });
  } catch (error) {
    logger.error('Error deleting lab result:', {
      labId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to delete lab result' });
  }
});

export default router;
