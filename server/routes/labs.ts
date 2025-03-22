
import express from 'express';
import { db } from '@db';
import { labResults } from '@db/schema';
import { eq } from 'drizzle-orm';
import fileUpload from 'express-fileupload';

const router = express.Router();

// Configure file upload middleware for this router
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/',
  safeFileNames: true,
  preserveExtension: true
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
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file as fileUpload.UploadedFile;
    const fileUrl = `/uploads/${file.name}`; // You'll need to implement actual file storage
    
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
      .where(eq(labResults.id, parseInt(req.params.id)))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    res.json({ message: 'Lab result deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab result:', error);
    res.status(500).json({ error: 'Failed to delete lab result' });
  }
});

export default router;
