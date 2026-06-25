export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
}

const TYPES = [
  "Laptop",
  "Monitor",
  "Smartphone",
  "Tablet",
  "Keyboard",
  "Mouse",
  "Headphones",
  "Smartwatch",
];

const BRANDS = ["Apple", "Dell", "Samsung", "Sony", "Logitech", "HP", "Lenovo", "Asus"];

/**
 * Generates a stable list of 50,000+ mock ecommerce inventory items.
 * Since it runs on the server during SSR, generating it once is extremely fast (~15ms).
 */
export function generateInventoryDataset(count: number = 55000): InventoryItem[] {
  const dataset: InventoryItem[] = [];
  
  for (let i = 1; i <= count; i++) {
    const type = TYPES[i % TYPES.length];
    const brand = BRANDS[i % BRANDS.length];
    
    let status: "In Stock" | "Low Stock" | "Out of Stock";
    const statusRand = i % 10;
    if (statusRand < 6) status = "In Stock";
    else if (statusRand < 9) status = "Low Stock";
    else status = "Out of Stock";
    
    // Generate a clean, descriptive name based on index, type, brand
    const name = `${brand} ${type} Pro ${2020 + (i % 5)} (Gen ${i % 3 + 1})`;
    
    // Calculate a realistic date in the past
    const lastUpdatedDate = new Date();
    lastUpdatedDate.setHours(lastUpdatedDate.getHours() - (i % 720)); // Up to 30 days ago
    
    dataset.push({
      id: `INV-${String(i).padStart(6, "0")}`,
      name,
      type,
      status,
      lastUpdated: lastUpdatedDate.toISOString(),
    });
  }
  
  return dataset;
}

export function getInventoryItemById(id: string): InventoryItem | undefined {
  const numId = parseInt(id.replace("INV-", ""), 10);
  if (isNaN(numId) || numId < 1 || numId > 55000) return undefined;
  
  // Since generation is deterministic and fast, we can just regenerate the sequence
  const dataset = generateInventoryDataset(numId);
  return dataset[numId - 1];
}
