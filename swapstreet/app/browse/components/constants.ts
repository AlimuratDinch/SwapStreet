// --- Filter Constants (Matched to C# Enums) ---

export const CATEGORIES = [
  "Bottoms",
  "Tops",
  "Footwear",
  "Accessory",
  "Outerwear",
  "Formalwear",
  "Sportswear",
  "Other",
];

export const COLOURS = [
  // Basic Colors
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Grey",

  // Metallics / Neutrals
  "Beige",
  "Silver",
  "Gold",

  // Patterns / Other
  "Clear",
  "MultiColor",
];

export const CONDITIONS = [
  "New",
  "LikeNew",
  "UsedExcellent",
  "UsedGood",
  "UsedFair",
];

export const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "Other"];

export const BRANDS = [
  "Nike",
  "HandM",
  "Zara",
  "Adidas",
  "Carhartt",
  "Dickies",
  "Puma",
  "Gap",
  "Vans",
  "NewBalance",
  "Lululemon",
  "Other",
];

export const plurals: Record<string, string> = {
  Category: "Categories",
  Brand: "Brands",
  Condition: "Conditions",
  Size: "Sizes",
  Colour: "Colours",
};
