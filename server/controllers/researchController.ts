
import { Request, Response } from "express";
import { db } from "../../db";
import { researchDocuments } from "../../db/schema";
import { eq } from "drizzle-orm";

// Get all research documents
export const getAllResearchDocuments = async (req: Request, res: Response) => {
  try {
    const documents = await db.query.researchDocuments.findMany({
      orderBy: (research, { desc }) => [desc(research.publishedAt)]
    });
    
    return res.status(200).json(documents);
  } catch (error) {
    console.error("Error fetching research documents:", error);
    return res.status(500).json({ error: "Failed to fetch research documents" });
  }
};

// Get research document by slug
export const getResearchDocumentBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const document = await db.query.researchDocuments.findFirst({
      where: eq(researchDocuments.slug, slug)
    });
    
    if (!document) {
      return res.status(404).json({ error: "Research document not found" });
    }
    
    return res.status(200).json(document);
  } catch (error) {
    console.error("Error fetching research document:", error);
    return res.status(500).json({ error: "Failed to fetch research document" });
  }
};

// Create research document (admin only)
export const createResearchDocument = async (req: Request, res: Response) => {
  try {
    const { title, summary, content, authors, imageUrls, tags } = req.body;
    
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    const newDocument = await db.insert(researchDocuments).values({
      title,
      slug,
      summary,
      content,
      authors,
      imageUrls: imageUrls || [],
      tags: tags || []
    }).returning();
    
    return res.status(201).json(newDocument[0]);
  } catch (error) {
    console.error("Error creating research document:", error);
    return res.status(500).json({ error: "Failed to create research document" });
  }
};

// Update research document (admin only)
export const updateResearchDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, summary, content, authors, imageUrls, tags } = req.body;
    
    const updatedDocument = await db.update(researchDocuments)
      .set({
        title,
        summary,
        content,
        authors,
        imageUrls,
        tags,
        updatedAt: new Date()
      })
      .where(eq(researchDocuments.id, parseInt(id)))
      .returning();
    
    if (updatedDocument.length === 0) {
      return res.status(404).json({ error: "Research document not found" });
    }
    
    return res.status(200).json(updatedDocument[0]);
  } catch (error) {
    console.error("Error updating research document:", error);
    return res.status(500).json({ error: "Failed to update research document" });
  }
};

// Delete research document (admin only)
export const deleteResearchDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deletedDocument = await db.delete(researchDocuments)
      .where(eq(researchDocuments.id, parseInt(id)))
      .returning();
    
    if (deletedDocument.length === 0) {
      return res.status(404).json({ error: "Research document not found" });
    }
    
    return res.status(200).json({ message: "Research document deleted successfully" });
  } catch (error) {
    console.error("Error deleting research document:", error);
    return res.status(500).json({ error: "Failed to delete research document" });
  }
};
