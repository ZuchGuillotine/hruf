
import express from 'express';
import { db } from '@db';
import { labResults } from '@db/schema';
import { eq } from 'drizzle-orm';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { labSummaryService } from '../services/labSummaryService';

const router = express.Router();

// Configure file upload middleware with more permissive settings
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/',
  safeFileNames: true,
  preserveExtension: true,
  debug: true, // Enable debug logs
  createParentPath: true,
  parseNested: true,
  useTempFiles: true,
  abortOnLimit: true
}));

// Get all lab results for a user
router.get('/', async (req, res) => {
  try {
    const results = await db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, req.user!.id))
      .orderBy(labResults.uploadedAt);
    res.json(results);
  } catch (error) {
    console.error('Error fetching lab results:', error);
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
});

// Upload new lab result
router.post('/', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file as fileUpload.UploadedFile;
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // Move file to uploads directory
    await file.mv(filePath);
    
    const fileUrl = `/uploads/${fileName}`;

    // Save file info to database
    const [result] = await db
      .insert(labResults)
      .values({
        userId: req.user!.id,
        fileName: file.name,
        fileType: file.mimetype,
        fileUrl: fileUrl,
        metadata: {
          size: file.size,
          lastViewed: new Date().toISOString()
        }
      })
      .returning();

    console.log('Lab result saved:', {
      fileName: file.name,
      fileUrl: fileUrl,
      userId: req.user!.id
    });

    // Trigger background summarization
    try {
      // Don't await summarization to avoid delaying response
      labSummaryService.summarizeLabResult(result.id)
        .then(() => {
          console.log(`Background summary generation completed for lab ID ${result.id}`);
        })
        .catch(summaryError => {
          console.error(`Background summary generation failed for lab ID ${result.id}:`, summaryError);
        });
        
      console.log('Background summary generation started for lab ID:', result.id);
    } catch (summaryError) {
      // Log but don't fail the upload if summarization fails
      console.error('Failed to initiate lab summarization:', summaryError);
    }

    res.json(result);
  } catch (error) {
    console.error('Error uploading lab result:', error);
    res.status(500).json({ error: 'Failed to upload lab result' });
  }
});

// Delete lab result
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db
      .delete(labResults)
      .where(
        eq(labResults.id, parseInt(req.params.id))
      )
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    // Delete file from uploads directory
    const filePath = path.join(process.cwd(), result.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Lab result deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab result:', error);
    res.status(500).json({ error: 'Failed to delete lab result' });
  }
});

export default router;
