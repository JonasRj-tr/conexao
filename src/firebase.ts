import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  increment
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  increment
};

// Initial streetwear product catalog data (realistic & high quality)
const initialProducts = [
  {
    name: "Conjunto Nike Tech Fleece - Azul/Preto",
    description: "Kit premium Nike Tech Fleece Streetwear. Conforto térmico absoluto, corte slim fit moderno, zíper duplo e capuz estruturado. Perfeito para o rolê urbano na cena paulista.",
    price: 389.90,
    originalPrice: 499.90,
    category: "Nike Tech",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["P", "M", "G", "GG"],
    stock: { "P": 4, "M": 6, "G": 8, "GG": 3 },
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    name: "Corta Vento Conexão 011 Reflective",
    description: "Jaqueta Corta-Vento impermeável com estampa refletiva 'Conexão 011' nas costas. Detalhes em neon ciano e zíperes selados. Item essencial para a noite paulistana.",
    price: 189.90,
    originalPrice: 249.90,
    category: "Corta Vento",
    images: [
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["P", "M", "G", "GG"],
    stock: { "P": 5, "M": 10, "G": 12, "GG": 5 },
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    name: "Moletom Oversized Black Out",
    description: "Moletom streetwear premium pesado (350g/m²). Algodão premium, capuz generoso sem cordão e modelagem oversized europeia. Cor preto profundo fosco.",
    price: 159.90,
    originalPrice: 199.90,
    category: "Moletons",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["M", "G", "GG"],
    stock: { "M": 8, "G": 10, "GG": 7 },
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    name: "Calça Cargo Jogger Tactical Dark",
    description: "Calça Cargo Streetwear confeccionada em sarja peletizada de alta gramatura. 6 bolsos funcionais, fivelas táticas de nylon e cordão de ajuste no punho.",
    price: 149.90,
    originalPrice: 189.90,
    category: "Calças",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["38", "40", "42", "44", "46"],
    stock: { "38": 3, "40": 5, "42": 8, "44": 4, "46": 2 },
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    name: "Camiseta Streetwear Conexão Acid Wash",
    description: "Camiseta com lavagem estonada cinza grafite. Malha 100% algodão penteado 30.1, estampa em silk screen de alta definição e gola canelada de 3cm (ribana de respeito).",
    price: 89.90,
    originalPrice: 119.90,
    category: "Camisetas",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600"
    ],
    sizes: ["P", "M", "G", "GG"],
    stock: { "P": 10, "M": 15, "G": 15, "GG": 8 },
    featured: true,
    createdAt: new Date().toISOString()
  }
];

const initialCategories = [
  { name: "Nike Tech", active: true },
  { name: "Corta Vento", active: true },
  { name: "Moletons", active: true },
  { name: "Calças", active: true },
  { name: "Camisetas", active: true }
];

const initialCoupons = [
  {
    code: "CONEXAO10",
    type: "percent",
    value: 10,
    minPurchase: 100,
    expiresAt: "2027-12-31",
    active: true
  },
  {
    code: "BEMVINDO20",
    type: "fixed",
    value: 20,
    minPurchase: 150,
    expiresAt: "2027-12-31",
    active: true
  }
];

const defaultSettings = {
  storeName: "Conexão 011",
  whatsapp: "5513997124921", // Exemplo de WhatsApp (Guarujá DDD 13)
  instagram: "@conexao011.oficial",
  address: "Av. Oswaldo Cruz, 1594 - Itapema, Guarujá - São Paulo",
  shippingRates: {
    "SP": 15.00,
    "RJ": 22.00,
    "MG": 22.00,
    "ES": 22.00,
    "PR": 25.00,
    "SC": 25.00,
    "RS": 25.00,
    "DF": 28.00,
    "GO": 28.00,
    "MS": 28.00,
    "MT": 28.00,
    "BA": 32.00,
    "PE": 32.00,
    "CE": 32.00,
    "RN": 35.00,
    "PB": 35.00,
    "AL": 35.00,
    "SE": 35.00,
    "MA": 38.00,
    "PI": 38.00,
    "AM": 45.00,
    "PA": 45.00,
    "RO": 45.00,
    "AC": 48.00,
    "RR": 48.00,
    "AP": 48.00,
    "TO": 38.00
  },
  shippingDefault: 25.00
};

// Seed database function to ensure it has amazing data on first load
export async function seedDatabaseIfEmpty() {
  try {
    const settingsDocRef = doc(db, "settings", "store_config");
    const settingsSnap = await getDoc(settingsDocRef);
    
    if (!settingsSnap.exists()) {
      console.log("Database is empty. Seeding initial data for Conexão 011...");
      
      // Save settings
      await setDoc(settingsDocRef, defaultSettings);
      
      // Save categories
      const categoriesCol = collection(db, "categories");
      for (const cat of initialCategories) {
        const docRef = doc(categoriesCol, cat.name.toLowerCase().replace(/\s+/g, "-"));
        await setDoc(docRef, cat);
      }
      
      // Save coupons
      const couponsCol = collection(db, "coupons");
      for (const coup of initialCoupons) {
        const docRef = doc(couponsCol, coup.code);
        await setDoc(docRef, coup);
      }
      
      // Save products
      const productsCol = collection(db, "products");
      for (const prod of initialProducts) {
        await addDoc(productsCol, prod);
      }
      
      console.log("Database successfully seeded with streetwear catalog!");
    } else {
      console.log("Database already initialized. Settings exist.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
