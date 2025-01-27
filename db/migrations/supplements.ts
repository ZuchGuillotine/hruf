import { db } from "@db";
import { supplementReference } from "@db/schema";

// Data sourced from NIH Office of Dietary Supplements (https://ods.od.nih.gov/)
// and Examine.com (https://examine.com/)
const initialSupplements = [
  {
    name: "Vitamin D",
    category: "Vitamins",
    alternativeNames: ["Cholecalciferol", "Vitamin D3", "Ergocalciferol", "Vitamin D2"],
    description: "Fat-soluble vitamin important for bone health and immune function",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
  },
  {
    name: "Vitamin B12",
    category: "Vitamins",
    alternativeNames: ["Cobalamin", "Cyanocobalamin", "Methylcobalamin"],
    description: "Essential for red blood cell formation and neurological function",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/",
  },
  {
    name: "Magnesium",
    category: "Minerals",
    alternativeNames: ["Magnesium Citrate", "Magnesium Glycinate", "Magnesium Oxide"],
    description: "Important for muscle and nerve function, blood pressure regulation",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/",
  },
  {
    name: "Zinc",
    category: "Minerals",
    alternativeNames: ["Zinc Picolinate", "Zinc Gluconate", "Zinc Citrate"],
    description: "Essential mineral for immune function and wound healing",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/",
  },
  {
    name: "Omega-3",
    category: "Fatty Acids",
    alternativeNames: ["Fish Oil", "EPA", "DHA", "Alpha-linolenic acid"],
    description: "Essential fatty acids important for heart and brain health",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/",
  },
  {
    name: "Vitamin C",
    category: "Vitamins",
    alternativeNames: ["Ascorbic Acid", "L-ascorbic acid"],
    description: "Antioxidant vitamin essential for immune function and skin health",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/",
  },
  {
    name: "Iron",
    category: "Minerals",
    alternativeNames: ["Ferrous Sulfate", "Ferrous Gluconate", "Ferric Citrate"],
    description: "Essential mineral for blood production and oxygen transport",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
  },
  {
    name: "Calcium",
    category: "Minerals",
    alternativeNames: ["Calcium Carbonate", "Calcium Citrate", "Calcium Gluconate"],
    description: "Essential mineral for bone health and muscle function",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/",
  },
  {
    name: "Vitamin E",
    category: "Vitamins",
    alternativeNames: ["Alpha-tocopherol", "Mixed Tocopherols"],
    description: "Fat-soluble antioxidant vitamin",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/",
  },
  {
    name: "Creatine",
    category: "Amino Acids",
    alternativeNames: ["Creatine Monohydrate", "Creatine HCL"],
    description: "Supports muscle energy production and exercise performance",
    source: "Examine.com",
    sourceUrl: "https://examine.com/supplements/creatine/",
  }
];

export async function seedSupplements() {
  try {
    console.log("Seeding supplement reference data...");

    for (const supplement of initialSupplements) {
      await db.insert(supplementReference).values(supplement).onConflictDoNothing();
    }

    console.log("Supplement reference data seeded successfully");
  } catch (error) {
    console.error("Error seeding supplement data:", error);
    throw error;
  }
}

// Run the seeding function
seedSupplements()
  .then(() => console.log("Seeding completed successfully"))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });