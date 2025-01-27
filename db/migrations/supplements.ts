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
  // Add more supplements here...
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

if (require.main === module) {
  seedSupplements()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
