import { db } from "@db";
import { supplementReference } from "@db/schema";

// Data sourced from NIH Office of Dietary Supplements (https://ods.od.nih.gov/)
// and Examine.com (https://examine.com/)
const initialSupplements = [
  // Vitamins
  {
    name: "Vitamin A",
    category: "Vitamins",
    alternativeNames: ["Retinol", "Beta Carotene", "Retinyl Palmitate"],
    description: "Essential for vision, immune function, and cell growth",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/",
  },
  {
    name: "Vitamin B1",
    category: "Vitamins",
    alternativeNames: ["Thiamine", "Thiamin"],
    description: "Important for energy metabolism and nerve function",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Thiamin-HealthProfessional/",
  },
  {
    name: "Vitamin B2",
    category: "Vitamins",
    alternativeNames: ["Riboflavin"],
    description: "Essential for energy production and cellular function",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Riboflavin-HealthProfessional/",
  },
  {
    name: "Vitamin B3",
    category: "Vitamins",
    alternativeNames: ["Niacin", "Nicotinamide", "Nicotinic Acid"],
    description: "Important for DNA repair and cellular health",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Niacin-HealthProfessional/",
  },
  {
    name: "Vitamin B5",
    category: "Vitamins",
    alternativeNames: ["Pantothenic Acid", "Calcium Pantothenate"],
    description: "Essential for fatty acid metabolism",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/PantothenicAcid-HealthProfessional/",
  },
  {
    name: "Vitamin B6",
    category: "Vitamins",
    alternativeNames: ["Pyridoxine", "Pyridoxal", "Pyridoxamine"],
    description: "Important for protein metabolism and cognitive development",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/",
  },
  {
    name: "Vitamin B7",
    category: "Vitamins",
    alternativeNames: ["Biotin", "Vitamin H"],
    description: "Essential for metabolism of fats and proteins",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Biotin-HealthProfessional/",
  },
  {
    name: "Vitamin B9",
    category: "Vitamins",
    alternativeNames: ["Folate", "Folic Acid", "Methylfolate"],
    description: "Critical for DNA synthesis and cell division",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/",
  },
  {
    name: "Vitamin B12",
    category: "Vitamins",
    alternativeNames: ["Cobalamin", "Methylcobalamin", "Cyanocobalamin"],
    description: "Essential for red blood cell formation and neurological function",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/",
  },
  {
    name: "Vitamin C",
    category: "Vitamins",
    alternativeNames: ["Ascorbic Acid", "L-ascorbic acid"],
    description: "Antioxidant vital for immune function and skin health",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/",
  },
  {
    name: "Vitamin D",
    category: "Vitamins",
    alternativeNames: ["Cholecalciferol", "Vitamin D3", "Ergocalciferol", "Vitamin D2"],
    description: "Essential for bone health and immune function",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
  },
  {
    name: "Vitamin E",
    category: "Vitamins",
    alternativeNames: ["Alpha-tocopherol", "Mixed Tocopherols"],
    description: "Antioxidant important for immune function and cell signaling",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/",
  },
  {
    name: "Vitamin K",
    category: "Vitamins",
    alternativeNames: ["Phylloquinone", "Menaquinone", "K1", "K2"],
    description: "Essential for blood clotting and bone health",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/",
  },

  // Minerals
  {
    name: "Calcium",
    category: "Minerals",
    alternativeNames: ["Calcium Carbonate", "Calcium Citrate", "Calcium Gluconate"],
    description: "Essential for bone health, muscle function, and nerve signaling",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/",
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
    description: "Essential for immune function and wound healing",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/",
  },
  {
    name: "Iron",
    category: "Minerals",
    alternativeNames: ["Ferrous Sulfate", "Ferrous Gluconate", "Ferric Citrate"],
    description: "Essential for oxygen transport and energy production",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
  },
  {
    name: "Selenium",
    category: "Minerals",
    alternativeNames: ["Selenomethionine", "Sodium Selenite"],
    description: "Antioxidant mineral important for thyroid function",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Selenium-HealthProfessional/",
  },

  // Herbal Supplements
  {
    name: "Turmeric",
    category: "Herbal",
    alternativeNames: ["Curcumin", "Curcuma longa"],
    description: "Anti-inflammatory herb with antioxidant properties",
    source: "NIH",
    sourceUrl: "https://www.nccih.nih.gov/health/turmeric",
  },
  {
    name: "Ginger",
    category: "Herbal",
    alternativeNames: ["Zingiber officinale"],
    description: "Used for digestive health and anti-inflammatory properties",
    source: "NIH",
    sourceUrl: "https://www.nccih.nih.gov/health/ginger",
  },
  {
    name: "Echinacea",
    category: "Herbal",
    alternativeNames: ["Purple Coneflower", "Echinacea purpurea"],
    description: "Used to support immune system function",
    source: "NIH",
    sourceUrl: "https://www.nccih.nih.gov/health/echinacea",
  },

  // Amino Acids
  {
    name: "L-Theanine",
    category: "Amino Acids",
    alternativeNames: ["Theanine"],
    description: "Promotes relaxation and cognitive function",
    source: "Examine.com",
    sourceUrl: "https://examine.com/supplements/theanine/",
  },
  {
    name: "L-Glutamine",
    category: "Amino Acids",
    alternativeNames: ["Glutamine"],
    description: "Important for intestinal health and immune function",
    source: "Examine.com",
    sourceUrl: "https://examine.com/supplements/glutamine/",
  },
  {
    name: "Creatine",
    category: "Amino Acids",
    alternativeNames: ["Creatine Monohydrate", "Creatine HCL"],
    description: "Supports muscle energy production and exercise performance",
    source: "Examine.com",
    sourceUrl: "https://examine.com/supplements/creatine/",
  },

  // Other Essential Supplements
  {
    name: "Omega-3",
    category: "Fatty Acids",
    alternativeNames: ["Fish Oil", "EPA", "DHA", "Alpha-linolenic acid"],
    description: "Essential fatty acids important for heart and brain health",
    source: "NIH",
    sourceUrl: "https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/",
  },
  {
    name: "Probiotics",
    category: "Probiotics",
    alternativeNames: ["Lactobacillus", "Bifidobacterium"],
    description: "Beneficial bacteria supporting gut and immune health",
    source: "NIH",
    sourceUrl: "https://www.nccih.nih.gov/health/probiotics-what-you-need-to-know",
  },
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