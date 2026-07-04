export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  images: string[];
  sizes: string[];
  stock: { [size: string]: number };
  featured: boolean;
  createdAt: string;
}

export interface Category {
  id?: string;
  name: string;
  active: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}

export interface Order {
  id?: string;
  orderNumber: string; // e.g. #CX-4812
  customer: {
    name: string;
    phone: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  items: {
    productId: string;
    name: string;
    size: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  subtotal: number;
  shippingCost: number;
  shippingMethod?: string;
  discount: number;
  total: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  paymentMethod: "pix" | "card" | "money" | "whatsapp_payment";
  type: "online" | "pdv";
  createdAt: string;
}

export interface Coupon {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minPurchase: number;
  expiresAt: string;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  whatsapp: string;
  instagram: string;
  address: string;
  shippingRates: { [state: string]: number };
  shippingDefault: number;
}
