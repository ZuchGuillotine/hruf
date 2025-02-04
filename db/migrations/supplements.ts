import { db } from "@db";
import { supplementReference } from "@db/schema";

const initialSupplements = [
  // General Supplements
  { name: "Acai (General)", category: "General" },
  { name: "Acai Berry Extract", category: "Extracts" },
  { name: "Acai Berry Powder", category: "Powders" },
  { name: "Acetyl-L-Carnitine (General)", category: "Amino Acids" },
  { name: "Acetyl-L-Carnitine HCL", category: "Amino Acids" },
  { name: "Aged Garlic Extract (General)", category: "Extracts" },
  { name: "Aged Garlic Extract Powder", category: "Powders" },
  { name: "Agmatine (General)", category: "Amino Acids" },
  { name: "Agmatine Sulfate", category: "Amino Acids" },
  { name: "Alpha Lipoic Acid (General)", category: "Antioxidants" },
  { name: "Alpha Lipoic Acid (R-ALA)", category: "Antioxidants" },
  { name: "Alpha Lipoic Acid (Racemic)", category: "Antioxidants" },
  { name: "Algae Oil (General)", category: "Oils" },
  { name: "Alfalfa (General)", category: "Herbs" },
  { name: "Allicin (General)", category: "Compounds" },
  { name: "Alpha GPC (General)", category: "Nootropics" },
  { name: "Andrographis (General)", category: "Herbs" },
  { name: "Andrographis Paniculata Extract", category: "Extracts" },
  { name: "Arginine (General)", category: "Amino Acids" },
  { name: "L-Arginine", category: "Amino Acids" },
  { name: "Arginine Alpha-Ketoglutarate", category: "Amino Acids" },
  { name: "Ashwagandha (General)", category: "Adaptogens" },
  { name: "Ashwagandha Root Powder", category: "Powders" },
  { name: "Ashwagandha Extract (KSM-66)", category: "Extracts" },
  { name: "Ashwagandha Extract (Sensoril)", category: "Extracts" },
  { name: "Astaxanthin (General)", category: "Carotenoids" },
  { name: "Astaxanthin (Haematococcus pluvialis)", category: "Carotenoids" },
  { name: "Vitamin A (Beta Carotene)", category: "Vitamins" },
  { name: "Vitamin A (Retinyl Palmitate)", category: "Vitamins" },
  { name: "Vitamin B1 (Thiamine)", category: "Vitamins" },
  { name: "Vitamin B1 (Thiamin)", category: "Vitamins" },
  { name: "Vitamin B2 (Riboflavin)", category: "Vitamins" },
  { name: "Vitamin B3 (Niacin)", category: "Vitamins" },
  { name: "Vitamin B3 (Nicotinamide)", category: "Vitamins" },
  { name: "Vitamin B3 (Nicotinic Acid)", category: "Vitamins" },
  { name: "Vitamin B5 (Pantothenic Acid)", category: "Vitamins" },
  { name: "Vitamin B5 (Calcium Pantothenate)", category: "Vitamins" },
  { name: "Vitamin B6 (Pyridoxine)", category: "Vitamins" },
  { name: "Vitamin B6 (Pyridoxal)", category: "Vitamins" },
  { name: "Vitamin B6 (Pyridoxamine)", category: "Vitamins" },
  { name: "Vitamin B7 (Biotin)", category: "Vitamins" },
  { name: "Vitamin B9 (Folate)", category: "Vitamins" },
  { name: "Vitamin B9 (Folic Acid)", category: "Vitamins" },
  { name: "Vitamin B9 (Methylfolate)", category: "Vitamins" },
  { name: "Vitamin B12 (Methylcobalamin)", category: "Vitamins" },
  { name: "Vitamin B12 (Cyanocobalamin)", category: "Vitamins" },
  { name: "Vitamin C (Ascorbic Acid)", category: "Vitamins" },
  { name: "Vitamin D2 (Ergocalciferol)", category: "Vitamins" },
  { name: "Vitamin D3 (Cholecalciferol)", category: "Vitamins" },
  { name: "Vitamin E (Alpha-tocopherol)", category: "Vitamins" },
  { name: "Vitamin E (Mixed Tocopherols)", category: "Vitamins" },
  { name: "Vitamin K1 (Phylloquinone)", category: "Vitamins" },
  { name: "Vitamin K2 (Menaquinone)", category: "Vitamins" },

  // Minerals
  { name: "Calcium (Carbonate)", category: "Minerals" },
  { name: "Calcium (Citrate)", category: "Minerals" },
  { name: "Calcium (Gluconate)", category: "Minerals" },
  { name: "Magnesium (Citrate)", category: "Minerals" },
  { name: "Magnesium (Glycinate)", category: "Minerals" },
  { name: "Magnesium (Oxide)", category: "Minerals" },
  { name: "Zinc (Picolinate)", category: "Minerals" },
  { name: "Zinc (Gluconate)", category: "Minerals" },
  { name: "Zinc (Citrate)", category: "Minerals" },
  { name: "Iron (Ferrous Sulfate)", category: "Minerals" },
  { name: "Iron (Ferrous Gluconate)", category: "Minerals" },
  { name: "Iron (Ferric Citrate)", category: "Minerals" },
  { name: "Selenium (Selenomethionine)", category: "Minerals" },
  { name: "Selenium (Sodium Selenite)", category: "Minerals" },

  // Herbal
  { name: "Turmeric Root", category: "Herbal" },
  { name: "Turmeric (Curcumin)", category: "Herbal" },
  { name: "Ginger Root", category: "Herbal" },
  { name: "Ginger Extract", category: "Herbal" },
  { name: "Echinacea Purpurea Root", category: "Herbal" },
  { name: "Echinacea Extract", category: "Herbal" },

  // Amino Acids
  { name: "L-Theanine", category: "Amino Acids" },
  { name: "L-Glutamine", category: "Amino Acids" },
  { name: "Creatine Monohydrate", category: "Amino Acids" },
  { name: "Creatine HCL", category: "Amino Acids" },
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