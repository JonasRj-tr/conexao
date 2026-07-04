import React, { useState, useEffect } from "react";
import { Product, Category, Order, Coupon, StoreSettings } from "../types";
import { formatCurrency, generateOrderNumber } from "../utils";
import {
  db,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  increment
} from "../firebase";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Search,
  Check,
  X,
  Percent,
  Filter,
  DollarSign,
  Smartphone,
  Store,
  Settings,
  Ticket,
  ChevronRight,
  Printer,
  Grid
} from "lucide-react";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings | null;
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
}

export default function AdminPanel({
  isOpen,
  onClose,
  settings,
  products,
  categories,
  coupons
}: AdminPanelProps) {
  if (!isOpen) return null;

  // Session authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Check existing session
  useEffect(() => {
    const adminSession = localStorage.getItem("conexao011_admin_session");
    if (adminSession === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim() === "conexao011@x.com" && loginPassword === "conexao4321") {
      setIsAuthenticated(true);
      setLoginError("");
      localStorage.setItem("conexao011_admin_session", "true");
    } else {
      setLoginError("Credenciais inválidas. Tente novamente.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("conexao011_admin_session");
  };

  // Active section state
  const [activeTab, setActiveTab] = useState<"dashboard" | "produtos" | "categorias" | "pedidos" | "pdv" | "cupons" | "config">("dashboard");

  // State collections synchronized in real-time
  const [orders, setOrders] = useState<Order[]>([]);

  // Sync orders in real-time
  useEffect(() => {
    if (!isAuthenticated) return;
    const ordersCol = collection(db, "orders");
    const q = query(ordersCol, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({ ...doc.data() as Order, id: doc.id });
      });
      setOrders(ordersData);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // UI state variables
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // FORM STATES: PRODUCTS
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOrigPrice, setProdOrigPrice] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([""]);
  const [prodSizes, setProdSizes] = useState<string[]>(["P", "M", "G", "GG"]);
  const [prodStock, setProdStock] = useState<{ [size: string]: number }>({ P: 5, M: 5, G: 5, GG: 5 });
  const [prodFeatured, setProdFeatured] = useState(false);

  // FORM STATES: CATEGORIES
  const [catName, setCatName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // FORM STATES: COUPONS
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [coupCode, setCoupCode] = useState("");
  const [coupType, setCoupType] = useState<"percent" | "fixed">("percent");
  const [coupValue, setCoupValue] = useState("");
  const [coupMinPurchase, setCoupMinPurchase] = useState("");
  const [coupExpiresAt, setCoupExpiresAt] = useState("");
  const [coupActive, setCoupActive] = useState(true);

  // FORM STATES: SETTINGS
  const [setStoreName, setSetStoreName] = useState(settings?.storeName || "Conexão 011");
  const [setWhatsapp, setSetWhatsapp] = useState(settings?.whatsapp || "5513997124921");
  const [setInstagram, setSetInstagram] = useState(settings?.instagram || "@conexao011.oficial");
  const [setAddress, setSetAddress] = useState(settings?.address || "Av. Oswaldo Cruz, 1594 - Itapema, Guarujá - São Paulo");
  const [setShippingRates, setSetShippingRates] = useState<{ [key: string]: number }>(settings?.shippingRates || {});
  const [setShippingDefault, setSetShippingDefault] = useState(settings?.shippingDefault?.toString() || "25");

  // PDV (Point of Sale) STATES
  const [pdvCart, setPdvCart] = useState<{ product: Product; size: string; quantity: number }[]>([]);
  const [pdvSearch, setPdvSearch] = useState("");
  const [pdvCategory, setPdvCategory] = useState("all");
  const [pdvCustomerName, setPdvCustomerName] = useState("");
  const [pdvCustomerPhone, setPdvCustomerPhone] = useState("");
  const [pdvPaymentMethod, setPdvPaymentMethod] = useState<"pix" | "card" | "money">("pix");
  const [pdvCouponCode, setPdvCouponCode] = useState("");
  const [pdvAppliedCoupon, setPdvAppliedCoupon] = useState<Coupon | null>(null);
  const [pdvCouponError, setPdvCouponError] = useState("");
  const [pdvSuccessReceipt, setPdvSuccessReceipt] = useState<Order | null>(null);

  // Load configuration default fields when settings sync
  useEffect(() => {
    if (settings) {
      setSetStoreName(settings.storeName);
      setSetWhatsapp(settings.whatsapp);
      setSetInstagram(settings.instagram);
      setSetAddress(settings.address);
      setSetShippingRates(settings.shippingRates);
      setSetShippingDefault(settings.shippingDefault.toString());
    }
  }, [settings]);

  // Open edit product form
  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesc(prod.description);
    setProdCategory(prod.category);
    setProdPrice(prod.price.toString());
    setProdOrigPrice(prod.originalPrice.toString());
    setProdImages(prod.images.length > 0 ? prod.images : [""]);
    setProdSizes(prod.sizes);
    setProdStock({ ...prod.stock });
    setProdFeatured(prod.featured);
    setIsProductFormOpen(true);
  };

  const handleNewProductClick = () => {
    setEditingProduct(null);
    setProdName("");
    setProdDesc("");
    setProdCategory(categories[0]?.name || "Nike Tech");
    setProdPrice("");
    setProdOrigPrice("");
    setProdImages([""]);
    setProdSizes(["P", "M", "G", "GG"]);
    setProdStock({ P: 5, M: 5, G: 5, GG: 5 });
    setProdFeatured(false);
    setIsProductFormOpen(true);
  };

  // Add/Remove Image inputs in form
  const handleAddImageUrl = () => {
    setProdImages([...prodImages, ""]);
  };

  const handleRemoveImageUrl = (index: number) => {
    if (prodImages.length === 1) return;
    setProdImages(prodImages.filter((_, idx) => idx !== index));
  };

  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...prodImages];
    updated[index] = val;
    setProdImages(updated);
  };

  // Save Product to Firestore
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodCategory) return;

    const filteredImages = prodImages.filter((img) => img.trim() !== "");

    const stockObj: { [size: string]: number } = {};
    prodSizes.forEach((sz) => {
      stockObj[sz] = prodStock[sz] !== undefined ? Number(prodStock[sz]) : 0;
    });

    const productData: Omit<Product, "id"> = {
      name: prodName,
      description: prodDesc,
      price: Number(prodPrice),
      originalPrice: prodOrigPrice ? Number(prodOrigPrice) : Number(prodPrice),
      category: prodCategory,
      images: filteredImages.length > 0 ? filteredImages : ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600"],
      sizes: prodSizes,
      stock: stockObj,
      featured: prodFeatured,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    try {
      if (editingProduct?.id) {
        // Edit
        const docRef = doc(db, "products", editingProduct.id);
        await updateDoc(docRef, productData);
      } else {
        // Add
        const colRef = collection(db, "products");
        await addDoc(colRef, productData);
      }
      setIsProductFormOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Erro ao salvar produto.");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este produto?")) return;
    try {
      const docRef = doc(db, "products", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      const slug = catName.trim().toLowerCase().replace(/\s+/g, "-");
      const docRef = doc(db, "categories", slug);
      await setDoc(docRef, { name: catName.trim(), active: true });
      setCatName("");
      setEditingCategory(null);
    } catch (err) {
      console.error("Error saving category:", err);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Remover esta categoria? Produtos associados não serão apagados.")) return;
    try {
      const docRef = doc(db, "categories", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  // Save Coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupCode || !coupValue || !coupMinPurchase || !coupExpiresAt) return;

    const codeUpper = coupCode.trim().toUpperCase();
    const couponData: Coupon = {
      code: codeUpper,
      type: coupType,
      value: Number(coupValue),
      minPurchase: Number(coupMinPurchase),
      expiresAt: coupExpiresAt,
      active: coupActive,
    };

    try {
      const docRef = doc(db, "coupons", codeUpper);
      await setDoc(docRef, couponData);
      setIsCouponFormOpen(false);
      setEditingCoupon(null);
      setCoupCode("");
      setCoupValue("");
      setCoupMinPurchase("");
      setCoupExpiresAt("");
    } catch (err) {
      console.error("Error saving coupon:", err);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (code: string) => {
    if (!confirm("Excluir este cupom?")) return;
    try {
      const docRef = doc(db, "coupons", code);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting coupon:", err);
    }
  };

  // Edit Coupon
  const handleEditCouponClick = (coup: Coupon) => {
    setEditingCoupon(coup);
    setCoupCode(coup.code);
    setCoupType(coup.type);
    setCoupValue(coup.value.toString());
    setCoupMinPurchase(coup.minPurchase.toString());
    setCoupExpiresAt(coup.expiresAt);
    setCoupActive(coup.active);
    setIsCouponFormOpen(true);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "settings", "store_config");
      const updatedConfig: StoreSettings = {
        storeName: setStoreName,
        whatsapp: setWhatsapp,
        instagram: setInstagram,
        address: setAddress,
        shippingRates: setShippingRates,
        shippingDefault: Number(setShippingDefault),
      };
      await setDoc(docRef, updatedConfig);
      alert("Configurações atualizadas com sucesso!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Erro ao salvar configurações.");
    }
  };

  // Update shipping rates for a state
  const handleShippingRateChange = (stateCode: string, value: string) => {
    setSetShippingRates({
      ...setShippingRates,
      [stateCode]: Number(value),
    });
  };

  // Update order status in Firestore
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const docRef = doc(db, "orders", orderId);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Excluir este registro de pedido permanentemente do banco de dados?")) return;
    try {
      const docRef = doc(db, "orders", orderId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  // Selected Order Detail in panel
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // ==========================================
  // PDV (Point of Sale) CORE ACTIONS
  // ==========================================
  const handleAddPdvProduct = (product: Product, size: string) => {
    const existing = pdvCart.find((it) => it.product.id === product.id && it.size === size);
    const availableStock = product.stock[size] || 0;

    if (existing) {
      if (existing.quantity >= availableStock) {
        alert(`Não há mais estoque disponível para o tamanho ${size}. Máximo: ${availableStock}.`);
        return;
      }
      setPdvCart(
        pdvCart.map((it) =>
          it.product.id === product.id && it.size === size
            ? { ...it, quantity: it.quantity + 1 }
            : it
        )
      );
    } else {
      if (availableStock <= 0) {
        alert(`O tamanho ${size} está esgotado.`);
        return;
      }
      setPdvCart([...pdvCart, { product, size, quantity: 1 }]);
    }
  };

  const handleUpdatePdvQty = (productId: string, size: string, change: number) => {
    setPdvCart(
      pdvCart
        .map((it) => {
          if (it.product.id === productId && it.size === size) {
            const nextQty = it.quantity + change;
            const availableStock = it.product.stock[size] || 0;
            if (nextQty > availableStock) {
              alert(`Sem estoque adicional para ${size}. Limite: ${availableStock}`);
              return it;
            }
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter((it) => it.quantity > 0)
    );
  };

  const handleRemovePdvItem = (productId: string, size: string) => {
    setPdvCart(pdvCart.filter((it) => !(it.product.id === productId && it.size === size)));
  };

  // Apply Coupon in PDV
  const handleApplyPdvCoupon = () => {
    if (!pdvCouponCode.trim()) return;
    setPdvCouponError("");
    setPdvAppliedCoupon(null);

    const match = coupons.find((cp) => cp.code === pdvCouponCode.trim().toUpperCase());
    if (match) {
      const isExpired = new Date(match.expiresAt) < new Date();
      const pdvSubtotal = pdvCart.reduce((sum, it) => sum + (it.product.price * it.quantity), 0);

      if (!match.active) {
        setPdvCouponError("Cupom inativo.");
      } else if (isExpired) {
        setPdvCouponError("Cupom expirado.");
      } else if (pdvSubtotal < match.minPurchase) {
        setPdvCouponError(`Mínimo de compra R$ ${match.minPurchase}`);
      } else {
        setPdvAppliedCoupon(match);
        setPdvCouponError("");
      }
    } else {
      setPdvCouponError("Cupom inválido.");
    }
  };

  // PDV checkout totals
  const pdvSubtotal = pdvCart.reduce((sum, it) => sum + (it.product.price * it.quantity), 0);
  const getPdvDiscount = () => {
    if (!pdvAppliedCoupon) return 0;
    if (pdvSubtotal < pdvAppliedCoupon.minPurchase) return 0;
    if (pdvAppliedCoupon.type === "percent") {
      return (pdvSubtotal * pdvAppliedCoupon.value) / 100;
    } else {
      return pdvAppliedCoupon.value;
    }
  };
  const pdvDiscount = getPdvDiscount();
  const pdvTotal = Math.max(0, pdvSubtotal - pdvDiscount);

  // Concluir venda no PDV (Finalize PDV order)
  const handleFinalizePdvSale = async () => {
    if (pdvCart.length === 0) return;

    try {
      const orderNumber = generateOrderNumber();
      const orderData: Omit<Order, "id"> = {
        orderNumber,
        customer: {
          name: pdvCustomerName.trim() || "Cliente Balcão",
          phone: pdvCustomerPhone.trim() || "Balcão PDV",
          cep: "00000-000",
          street: "Venda Presencial PDV",
          number: "S/N",
          neighborhood: "Presencial",
          city: "Guarujá",
          state: "SP",
        },
        items: pdvCart.map((it) => ({
          productId: it.product.id || "",
          name: it.product.name,
          size: it.size,
          price: it.product.price,
          quantity: it.quantity,
          image: it.product.images[0] || "",
        })),
        subtotal: pdvSubtotal,
        shippingCost: 0,
        discount: pdvDiscount,
        total: pdvTotal,
        status: "paid", // PDV sales are paid instantly
        paymentMethod: pdvPaymentMethod,
        type: "pdv",
        createdAt: new Date().toISOString(),
      };

      // 1. Save sale as Paid Order in Firestore
      const ordersCol = collection(db, "orders");
      const orderRef = await addDoc(ordersCol, orderData);

      // 2. Decrement STOCK in real-time for each item sold!
      for (const cartItem of pdvCart) {
        if (!cartItem.product.id) continue;
        const prodDocRef = doc(db, "products", cartItem.product.id);
        
        // Decrement local inventory size field in Firebase
        await updateDoc(prodDocRef, {
          [`stock.${cartItem.size}`]: increment(-cartItem.quantity),
        });
      }

      // Keep order with ID for receipt visualizer
      setPdvSuccessReceipt({ ...orderData, id: orderRef.id });

      // Clear POS layout
      setPdvCart([]);
      setPdvCustomerName("");
      setPdvCustomerPhone("");
      setPdvCouponCode("");
      setPdvAppliedCoupon(null);
    } catch (err) {
      console.error("Error during PDV finalizing:", err);
      alert("Houve um erro ao processar a venda física.");
    }
  };

  // ==========================================
  // DASHBOARD STATISTICS COMPUTATION
  // ==========================================
  const totalRevenue = orders
    .filter((o) => o.status === "paid" || o.status === "shipped")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingRevenue = orders
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + o.total, 0);

  const completedOrdersCount = orders.filter((o) => o.status === "paid" || o.status === "shipped").length;
  
  const onlineSalesCount = orders.filter((o) => o.type === "online").length;
  const pdvSalesCount = orders.filter((o) => o.type === "pdv").length;

  // Compute stock levels
  const lowStockItems = products.filter((p) => {
    const total = (Object.values(p.stock) as number[]).reduce((a, b) => a + b, 0);
    return total <= 3;
  });

  const totalStockSum = products.reduce((sum, p) => {
    return sum + (Object.values(p.stock) as number[]).reduce((a, b) => a + b, 0);
  }, 0);

  // List of all Brazilian states for shipping configuration
  const brStates = [
    "SP", "RJ", "MG", "ES", "PR", "SC", "RS", "DF", "GO", "MS", "MT",
    "BA", "PE", "CE", "RN", "PB", "AL", "SE", "MA", "PI", "AM", "PA",
    "RO", "AC", "RR", "AP", "TO"
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      
      {/* Top Banner admin */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-extrabold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-400/20 px-3 py-1 rounded-md">
            CONEXÃO 011 ADMIN
          </span>
          <span className="text-xs text-zinc-500">Painel Operacional v1.0</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            Voltar ao Site
          </button>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/40 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </header>

      {/* Login Screen (If not logged in) */}
      {!isAuthenticated ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-850 bg-zinc-900 p-8 shadow-2xl shadow-cyan-500/5">
            <div className="text-center">
              <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent uppercase font-sans tracking-wider">
                CONEXÃO 011
              </span>
              <p className="mt-2 text-xs text-zinc-500 uppercase tracking-widest font-bold">
                Acesso Restrito ao Administrador
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-400 uppercase tracking-wide">E-mail Administrativo</label>
                <input
                  type="email"
                  required
                  placeholder="conexao011@x.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 uppercase tracking-wide">Senha de Segurança</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>

              {loginError && <p className="text-red-400 font-medium text-center">{loginError}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 py-3.5 text-xs font-black uppercase tracking-wider text-black transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                Autenticar Acesso
              </button>
            </form>
            <p className="mt-4 text-center text-[10px] text-zinc-600">
              Uso estritamente operacional da equipe Conexão 011 Streetwear.
            </p>
          </div>
        </div>
      ) : (
        /* Logged in Admin Panel Grid */
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Sidebar - Desktop Only */}
          <aside className="hidden md:flex w-64 border-r border-zinc-800 bg-zinc-900/50 p-5 space-y-2 shrink-0 flex-col justify-between overflow-y-auto">
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 px-3 mb-3">Navegação</span>
              
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "dashboard" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("produtos")}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "produtos" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <Grid className="h-4 w-4 text-cyan-400" />
                <span>Produtos</span>
              </button>

              <button
                onClick={() => setActiveTab("categorias")}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "categorias" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <Filter className="h-4 w-4 text-cyan-400" />
                <span>Categorias</span>
              </button>

              <button
                onClick={() => setActiveTab("pedidos")}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer relative ${
                  activeTab === "pedidos" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <ShoppingBag className="h-4 w-4 text-cyan-400" />
                <span>Pedidos</span>
                {orders.filter((o) => o.status === "pending").length > 0 && (
                  <span className="absolute right-3.5 bg-fuchsia-600 text-white rounded-full text-[9px] font-black px-1.5 py-0.5 animate-pulse">
                    {orders.filter((o) => o.status === "pending").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("pdv")}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "pdv" ? "bg-fuchsia-950/40 text-fuchsia-400 border border-fuchsia-500/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <Store className="h-4 w-4 text-fuchsia-400" />
                <span>Ponto de Venda (PDV)</span>
              </button>

              <button
                onClick={() => setActiveTab("cupons")}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "cupons" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <Ticket className="h-4 w-4 text-cyan-400" />
                <span>Cupons</span>
              </button>

              <button
                onClick={() => setActiveTab("config")}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "config" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <Settings className="h-4 w-4 text-cyan-400" />
                <span>Configurações</span>
              </button>
            </div>

            <div className="rounded-xl bg-zinc-950/80 border border-zinc-850 p-3 text-xs text-zinc-500">
              <span className="block font-bold text-zinc-400">Logado como:</span>
              <span className="block text-[11px] truncate mt-0.5">conexao011@x.com</span>
              <span className="block text-[10px] text-emerald-400 font-bold flex items-center mt-2">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Banco em Tempo Real
              </span>
            </div>
          </aside>

          {/* Mobile/Tablet Horizontal Tab Bar */}
          <div className="md:hidden flex overflow-x-auto border-b border-zinc-800 bg-zinc-900 p-2 gap-2 shrink-0 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                activeTab === "dashboard" ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab("produtos")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                activeTab === "produtos" ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Grid className="h-3.5 w-3.5 text-cyan-400" />
              <span>Produtos</span>
            </button>
            <button
              onClick={() => setActiveTab("categorias")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                activeTab === "categorias" ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              <span>Categorias</span>
            </button>
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer relative ${
                activeTab === "pedidos" ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-cyan-400" />
              <span>Pedidos</span>
              {orders.filter((o) => o.status === "pending").length > 0 && (
                <span className="absolute -top-1 -right-1 bg-fuchsia-600 text-white rounded-full text-[8px] font-black px-1.5 py-0.2 animate-pulse">
                  {orders.filter((o) => o.status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("pdv")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                activeTab === "pdv" ? "bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Store className="h-3.5 w-3.5 text-fuchsia-400" />
              <span>PDV</span>
            </button>
            <button
              onClick={() => setActiveTab("cupons")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                activeTab === "cupons" ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Ticket className="h-3.5 w-3.5 text-cyan-400" />
              <span>Cupons</span>
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                activeTab === "config" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Settings className="h-3.5 w-3.5 text-cyan-400" />
              <span>Config</span>
            </button>
          </div>

          {/* Core Content Area */}
          <main className="flex-1 bg-zinc-950 overflow-y-auto p-4 md:p-8">
            
            {/* ========================================================= */}
            {/* TAB: DASHBOARD */}
            {/* ========================================================= */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">Dashboard de Operações</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Visão geral do faturamento e vendas presenciais e online.</p>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Faturamento Efetivado</span>
                    <h3 className="mt-1 text-2xl font-black text-white">{formatCurrency(totalRevenue)}</h3>
                    <p className="mt-1 text-[10px] text-zinc-500">Pedidos pagos e enviados</p>
                  </div>
                  <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Faturamento Pendente</span>
                    <h3 className="mt-1 text-2xl font-black text-fuchsia-400">{formatCurrency(pendingRevenue)}</h3>
                    <p className="mt-1 text-[10px] text-zinc-500">Carrinhos aguardando Pix</p>
                  </div>
                  <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vendas Concluídas</span>
                    <h3 className="mt-1 text-2xl font-black text-white">{completedOrdersCount}</h3>
                    <p className="mt-1 text-[10px] text-zinc-500">Online ({onlineSalesCount}) | PDV ({pdvSalesCount})</p>
                  </div>
                  <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mr-1" />
                      Aviso de Estoque
                    </span>
                    <h3 className="mt-1 text-2xl font-black text-amber-500">{lowStockItems.length}</h3>
                    <p className="mt-1 text-[10px] text-zinc-500">Itens com estoque &le; 3 un.</p>
                  </div>
                </div>

                {/* Graphs and Quick details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Styled pure CSS Visual Distribution chart */}
                  <div className="col-span-2 rounded-xl border border-zinc-850 bg-zinc-900 p-5">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-zinc-200">Distribuição de Vendas</h3>
                    
                    <div className="mt-8 space-y-6 text-xs">
                      {/* POS distribution bar */}
                      <div>
                        <div className="flex justify-between font-bold mb-1.5 text-zinc-400">
                          <span>Vendas Balcão (PDV)</span>
                          <span className="text-white">{pdvSalesCount} ({orders.length > 0 ? Math.round((pdvSalesCount/orders.length)*100) : 0}%)</span>
                        </div>
                        <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                          <div 
                            className="h-full bg-gradient-to-r from-fuchsia-600 to-purple-500 rounded-full" 
                            style={{ width: `${orders.length > 0 ? (pdvSalesCount/orders.length)*100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Online distribution bar */}
                      <div>
                        <div className="flex justify-between font-bold mb-1.5 text-zinc-400">
                          <span>Pedidos Online (Site/WhatsApp)</span>
                          <span className="text-white">{onlineSalesCount} ({orders.length > 0 ? Math.round((onlineSalesCount/orders.length)*100) : 0}%)</span>
                        </div>
                        <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" 
                            style={{ width: `${orders.length > 0 ? (onlineSalesCount/orders.length)*100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-zinc-800/80 pt-4 flex justify-between text-[11px] text-zinc-500">
                      <span>Total de itens estocados: <strong>{totalStockSum} un.</strong></span>
                      <span>Cadastros de cupons: <strong>{coupons.length} ativos</strong></span>
                    </div>
                  </div>

                  {/* Low Stock Warning Panel */}
                  <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-zinc-200 flex items-center space-x-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>Alerta de Reposição</span>
                      </h3>
                      
                      <div className="mt-4 space-y-3 max-h-[190px] overflow-y-auto">
                        {lowStockItems.length === 0 ? (
                          <p className="text-xs text-zinc-500 text-center py-6">Excelente! Todos os itens estão bem estocados.</p>
                        ) : (
                          lowStockItems.map((p) => {
                            const total = Object.values(p.stock).reduce((a, b) => a + b, 0);
                            return (
                              <div key={p.id} className="flex items-center justify-between text-xs rounded-lg bg-zinc-950 p-2.5 border border-zinc-850">
                                <span className="font-bold text-zinc-300 truncate w-32">{p.name}</span>
                                <span className="rounded bg-amber-950/60 border border-amber-500/30 text-amber-400 font-extrabold px-1.5 py-0.5">
                                  {total} un.
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab("produtos")}
                      className="mt-4 w-full rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white py-2 text-xs font-bold uppercase transition-all"
                    >
                      Ajustar Estoques
                    </button>
                  </div>
                </div>

                {/* Recent Orders lists inside dashboard */}
                <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-zinc-200 mb-4">Últimos Pedidos Cadastrados</h3>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-black text-[10px] tracking-wider">
                          <th className="pb-3">Código</th>
                          <th className="pb-3">Cliente</th>
                          <th className="pb-3">Origem</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3 text-right">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {orders.slice(0, 5).map((o) => (
                          <tr key={o.id} className="hover:bg-zinc-850/30">
                            <td className="py-3.5 font-bold text-cyan-400">#{o.orderNumber}</td>
                            <td className="py-3.5 font-semibold text-zinc-200">{o.customer.name}</td>
                            <td className="py-3.5">
                              {o.type === "pdv" ? (
                                <span className="rounded bg-fuchsia-950/50 border border-fuchsia-500/30 text-fuchsia-400 px-2 py-0.5 font-bold text-[10px]">
                                  PDV Físico
                                </span>
                              ) : (
                                <span className="rounded bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 font-bold text-[10px]">
                                  Site / Online
                                </span>
                              )}
                            </td>
                            <td className="py-3.5">
                              <span className={`rounded-full px-2 py-0.5 font-black text-[9px] uppercase ${
                                o.status === "paid" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" :
                                o.status === "shipped" ? "bg-blue-950 text-blue-400 border border-blue-500/20" :
                                o.status === "cancelled" ? "bg-red-950 text-red-400 border border-red-500/20" :
                                "bg-amber-950 text-amber-400 border border-amber-500/20"
                              }`}>
                                {o.status === "pending" ? "Pendente" :
                                 o.status === "paid" ? "Pago" :
                                 o.status === "shipped" ? "Enviado" : "Cancelado"}
                              </span>
                            </td>
                            <td className="py-3.5 font-extrabold text-white">{formatCurrency(o.total)}</td>
                            <td className="py-3.5 text-right text-zinc-500 font-mono">
                              {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


            {/* ========================================================= */}
            {/* TAB: PRODUCTS */}
            {/* ========================================================= */}
            {activeTab === "produtos" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Cadastro de Produtos</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Gerencie os produtos streetwear da sua vitrine.</p>
                  </div>
                  <button
                    onClick={handleNewProductClick}
                    className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase text-black transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4 stroke-[3px]" />
                    <span>Novo Produto</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar produto pelo nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-300 outline-none focus:border-cyan-500"
                  >
                    <option value="all">Todas as Categorias</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Product List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter((p) => selectedCategory === "all" || p.category === selectedCategory)
                    .map((p) => {
                      const totalStock = (Object.values(p.stock) as number[]).reduce((a, b) => a + b, 0);
                      return (
                        <div key={p.id} className="rounded-xl border border-zinc-850 bg-zinc-900 overflow-hidden flex flex-col justify-between">
                          <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                            <img src={p.images[0]} alt={p.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                            <div className="absolute top-2.5 right-2.5 flex space-x-1.5">
                              <button
                                onClick={() => handleEditProductClick(p)}
                                className="rounded bg-zinc-900/90 border border-zinc-800 p-1.5 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => p.id && handleDeleteProduct(p.id)}
                                className="rounded bg-zinc-900/90 border border-zinc-800 p-1.5 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-all cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="absolute bottom-2.5 left-2.5 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] font-bold text-zinc-300 px-2 py-0.5 uppercase">
                              {p.category}
                            </span>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-white line-clamp-1">{p.name}</h4>
                              <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                              
                              <div className="mt-3 flex items-baseline space-x-2">
                                <span className="text-sm font-black text-white">{formatCurrency(p.price)}</span>
                                {p.originalPrice > p.price && (
                                  <span className="text-[11px] text-zinc-500 line-through">{formatCurrency(p.originalPrice)}</span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3.5 border-t border-zinc-800/80 text-[11px]">
                              <span className="block font-bold text-zinc-400 mb-1.5">Estoque por tamanho:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(p.stock).map(([sz, qty]) => (
                                  <span key={sz} className={`rounded border px-1.5 py-0.5 font-bold ${
                                    qty <= 0 ? "border-zinc-800 text-zinc-600 bg-zinc-950" :
                                    qty <= 2 ? "border-amber-500/20 text-amber-400 bg-amber-950/20" :
                                    "border-zinc-800 text-zinc-300 bg-zinc-950"
                                  }`}>
                                    {sz}: <strong className="text-white">{qty}</strong>
                                  </span>
                                ))}
                              </div>
                              <div className="mt-3 text-right text-zinc-500">
                                Total Geral: <strong className="text-cyan-400 font-extrabold">{totalStock} un.</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* PRODUCT DIALOG FORM (CREATE / EDIT) */}
                {isProductFormOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xs" onClick={() => setIsProductFormOpen(false)} />
                    
                    <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                          {editingProduct ? "Editar Produto" : "Novo Produto"}
                        </h3>
                        <button
                          onClick={() => setIsProductFormOpen(false)}
                          className="rounded-full p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveProduct} className="mt-5 space-y-4 text-xs">
                        {/* Name & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-bold text-zinc-400 uppercase">Nome do Produto *</label>
                            <input
                              type="text"
                              required
                              value={prodName}
                              onChange={(e) => setProdName(e.target.value)}
                              placeholder="Ex: Camiseta Nike Tech Fleece Carbon"
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-zinc-400 uppercase">Categoria *</label>
                            <select
                              value={prodCategory}
                              onChange={(e) => setProdCategory(e.target.value)}
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white outline-none focus:border-cyan-500"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block font-bold text-zinc-400 uppercase">Descrição Completa</label>
                          <textarea
                            value={prodDesc}
                            onChange={(e) => setProdDesc(e.target.value)}
                            rows={3}
                            placeholder="Descreva detalhes como gramatura da malha, modelo da foto, fivelas táticas, etc."
                            className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Prices & Featured */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block font-bold text-zinc-400 uppercase">Preço de Venda (R$) *</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={prodPrice}
                              onChange={(e) => setProdPrice(e.target.value)}
                              placeholder="Ex: 189.90"
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-zinc-400 uppercase">Preço Original (R$ - De:)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={prodOrigPrice}
                              onChange={(e) => setProdOrigPrice(e.target.value)}
                              placeholder="Ex: 249.90"
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div className="flex items-center pt-5">
                            <label className="flex items-center space-x-2.5 cursor-pointer text-zinc-300">
                              <input
                                type="checkbox"
                                checked={prodFeatured}
                                onChange={(e) => setProdFeatured(e.target.checked)}
                                className="h-4.5 w-4.5 accent-cyan-500"
                              />
                              <span className="font-bold">Produto em Destaque?</span>
                            </label>
                          </div>
                        </div>

                        {/* Sizing & Inventory Control */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4 text-xs">
                          <span className="block font-bold text-zinc-400 uppercase tracking-wider">Tamanhos & Estoque</span>
                          
                          <div className="space-y-3">
                            <div>
                              <span className="block font-bold text-zinc-500 text-[10px] uppercase mb-1.5">Tamanhos de Roupas</span>
                              <div className="flex flex-wrap gap-1.5">
                                {["PP", "P", "M", "G", "GG", "XG"].map((size) => {
                                  const isSelected = prodSizes.includes(size);
                                  return (
                                    <button
                                      type="button"
                                      key={size}
                                      onClick={() => {
                                        let nextSizes;
                                        if (isSelected) {
                                          nextSizes = prodSizes.filter((s) => s !== size);
                                        } else {
                                          nextSizes = [...prodSizes, size];
                                        }
                                        // Sort sizes
                                        const order = ["PP", "P", "M", "G", "GG", "XG", "XXG"];
                                        nextSizes.sort((a, b) => {
                                          const numA = Number(a);
                                          const numB = Number(b);
                                          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                                          const idxA = order.indexOf(a);
                                          const idxB = order.indexOf(b);
                                          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                          if (idxA !== -1) return -1;
                                          if (idxB !== -1) return 1;
                                          return a.localeCompare(b);
                                        });
                                        setProdSizes(nextSizes);
                                        if (!isSelected && prodStock[size] === undefined) {
                                          setProdStock({ ...prodStock, [size]: 5 });
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded text-[11px] font-black uppercase transition-all cursor-pointer border ${
                                        isSelected 
                                          ? "bg-cyan-500 text-black border-cyan-400" 
                                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <span className="block font-bold text-zinc-500 text-[10px] uppercase mb-1.5">Tamanhos de Calçados / Tênis (30 ao 50) *</span>
                              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-zinc-900/40 rounded-lg border border-zinc-800">
                                {Array.from({ length: 21 }, (_, i) => String(30 + i)).map((size) => {
                                  const isSelected = prodSizes.includes(size);
                                  return (
                                    <button
                                      type="button"
                                      key={size}
                                      onClick={() => {
                                        let nextSizes;
                                        if (isSelected) {
                                          nextSizes = prodSizes.filter((s) => s !== size);
                                        } else {
                                          nextSizes = [...prodSizes, size];
                                        }
                                        // Sort sizes
                                        const order = ["PP", "P", "M", "G", "GG", "XG", "XXG"];
                                        nextSizes.sort((a, b) => {
                                          const numA = Number(a);
                                          const numB = Number(b);
                                          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                                          const idxA = order.indexOf(a);
                                          const idxB = order.indexOf(b);
                                          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                          if (idxA !== -1) return -1;
                                          if (idxB !== -1) return 1;
                                          return a.localeCompare(b);
                                        });
                                        setProdSizes(nextSizes);
                                        if (!isSelected && prodStock[size] === undefined) {
                                          setProdStock({ ...prodStock, [size]: 5 });
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded text-[11px] font-black transition-all cursor-pointer border ${
                                        isSelected 
                                          ? "bg-cyan-500 text-black border-cyan-400" 
                                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Inventory inputs for selected sizes only */}
                          {prodSizes.length > 0 && (
                            <div className="border-t border-zinc-800/60 pt-3">
                              <span className="block font-bold text-zinc-400 text-[10px] uppercase mb-2.5">Definir Quantidades em Estoque</span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {prodSizes.map((size) => (
                                  <div key={size} className="flex flex-col bg-zinc-900 p-2 rounded-lg border border-zinc-850">
                                    <label className="font-bold text-zinc-400 mb-1 text-[10px] flex justify-between">
                                      <span>Tamanho {size}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setProdSizes(prodSizes.filter((s) => s !== size));
                                        }}
                                        className="text-red-500 hover:text-red-400 text-[9px] font-bold cursor-pointer"
                                      >
                                        Remover
                                      </button>
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={prodStock[size] !== undefined ? prodStock[size] : ""}
                                      onChange={(e) => setProdStock({ ...prodStock, [size]: Number(e.target.value) })}
                                      placeholder="0"
                                      className="rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-white outline-none focus:border-cyan-500 text-xs font-bold"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Multiple pictures URLs */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-400 uppercase tracking-wider">Imagens Externas (URLs)</span>
                            <button
                              type="button"
                              onClick={handleAddImageUrl}
                              className="rounded bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1 text-[10px] font-bold text-cyan-400 border border-zinc-800"
                            >
                              + Adicionar Foto
                            </button>
                          </div>

                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {prodImages.map((img, idx) => (
                              <div key={idx} className="flex space-x-2 items-center">
                                <input
                                  type="text"
                                  placeholder="Insira a URL de imagem externa"
                                  value={img}
                                  onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-white outline-none focus:border-cyan-500 text-xs"
                                />
                                <button
                                  type="button"
                                  disabled={prodImages.length === 1}
                                  onClick={() => handleRemoveImageUrl(idx)}
                                  className="text-red-500 hover:text-red-400 disabled:opacity-30 p-1 cursor-pointer"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Submit */}
                        <button
                          type="submit"
                          className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3.5 text-xs font-black uppercase tracking-widest text-black transition-all"
                        >
                          Salvar Alterações
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* ========================================================= */}
            {/* TAB: CATEGORIES */}
            {/* ========================================================= */}
            {activeTab === "categorias" && (
              <div className="space-y-6 max-w-md">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">Gerenciamento de Categorias</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Defina as gavetas de produtos da sua loja streetwear.</p>
                </div>

                <form onSubmit={handleSaveCategory} className="flex gap-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Nova Categoria (Ex: Corta Vento)"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-white outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 font-black uppercase text-black transition-colors cursor-pointer"
                  >
                    Adicionar
                  </button>
                </form>

                <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-4 space-y-2">
                  <span className="block font-bold text-zinc-400 uppercase tracking-widest text-[10px] mb-3">Categorias Ativas</span>
                  
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/60 last:border-0">
                      <span className="font-bold text-zinc-200">{c.name}</span>
                      <button
                        onClick={() => c.id && handleDeleteCategory(c.id)}
                        className="text-zinc-500 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* ========================================================= */}
            {/* TAB: ORDERS (PEDIDOS) */}
            {/* ========================================================= */}
            {activeTab === "pedidos" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">Gerenciamento de Pedidos</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Acompanhe compras, mude status em tempo real e confirme Pix.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3.5">
                  <div className="relative flex-1 text-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar por cliente ou código do pedido..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2 text-white placeholder-zinc-500 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-300 outline-none focus:border-cyan-500"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="shipped">Enviado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Orders Table Panel */}
                  <div className="lg:col-span-2 rounded-xl border border-zinc-850 bg-zinc-900 p-5 text-xs overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-black text-[10px] tracking-wider">
                          <th className="pb-3">Cód.</th>
                          <th className="pb-3">Cliente</th>
                          <th className="pb-3">Canal</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {orders
                          .filter((o) => o.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                          .filter((o) => statusFilter === "all" || o.status === statusFilter)
                          .map((o) => (
                            <tr
                              key={o.id}
                              onClick={() => setSelectedOrderDetail(o)}
                              className={`hover:bg-zinc-850/50 cursor-pointer ${
                                selectedOrderDetail?.id === o.id ? "bg-cyan-950/20 border-l-2 border-cyan-400" : ""
                              }`}
                            >
                              <td className="py-3 font-bold text-cyan-400">#{o.orderNumber}</td>
                              <td className="py-3 font-bold text-zinc-200 truncate max-w-28">{o.customer.name}</td>
                              <td className="py-3">
                                {o.type === "pdv" ? (
                                  <span className="text-[10px] font-bold text-fuchsia-400">Físico/PDV</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-cyan-400">Site</span>
                                )}
                              </td>
                              <td className="py-3">
                                <select
                                  value={o.status}
                                  onClick={(e) => e.stopPropagation()} // stop click detail trigger
                                  onChange={(e) => o.id && handleUpdateOrderStatus(o.id, e.target.value as Order["status"])}
                                  className={`rounded px-1.5 py-0.5 font-bold text-[10px] outline-none border ${
                                    o.status === "paid" ? "bg-emerald-950 text-emerald-400 border-emerald-500/25" :
                                    o.status === "shipped" ? "bg-blue-950 text-blue-400 border-blue-500/25" :
                                    o.status === "cancelled" ? "bg-red-950 text-red-400 border-red-500/25" :
                                    "bg-amber-950 text-amber-400 border-amber-500/25"
                                  }`}
                                >
                                  <option value="pending">Pendente</option>
                                  <option value="paid">Pago</option>
                                  <option value="shipped">Enviado</option>
                                  <option value="cancelled">Cancelado</option>
                                </select>
                              </td>
                              <td className="py-3 font-extrabold text-white">{formatCurrency(o.total)}</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    o.id && handleDeleteOrder(o.id);
                                  }}
                                  className="text-zinc-600 hover:text-red-400 transition-colors"
                                  title="Apagar do histórico"
                                >
                                  <Trash2 className="h-4 w-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Order detail visualizer */}
                  <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-5 text-xs space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-zinc-200">Detalhes do Pedido Selecionado</h3>
                    
                    {selectedOrderDetail ? (
                      <div className="space-y-4">
                        {/* Summary code & status */}
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                          <div>
                            <span className="block text-[10px] text-zinc-500 font-bold uppercase">Código do Pedido</span>
                            <span className="text-base font-black text-white">#{selectedOrderDetail.orderNumber}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] text-zinc-500 font-bold uppercase">Registrado em</span>
                            <span className="font-mono text-zinc-300">{new Date(selectedOrderDetail.createdAt).toLocaleString("pt-BR")}</span>
                          </div>
                        </div>

                        {/* Customer */}
                        <div>
                          <span className="block font-bold text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">Cliente & Contato</span>
                          <p className="font-bold text-white text-sm">{selectedOrderDetail.customer.name}</p>
                          <p className="text-zinc-400 font-semibold">{selectedOrderDetail.customer.phone}</p>
                        </div>

                        {/* Delivery address */}
                        {selectedOrderDetail.type === "online" && (
                          <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-850 text-zinc-400 space-y-0.5">
                            <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Endereço de Entrega</span>
                            <p className="text-zinc-300 font-bold">CEP: {selectedOrderDetail.customer.cep}</p>
                            <p>{selectedOrderDetail.customer.street}, Nº {selectedOrderDetail.customer.number}</p>
                            {selectedOrderDetail.customer.complement && <p>Compl: {selectedOrderDetail.customer.complement}</p>}
                            <p>Bairro: {selectedOrderDetail.customer.neighborhood}</p>
                            <p>{selectedOrderDetail.customer.city} - {selectedOrderDetail.customer.state}</p>
                          </div>
                        )}

                        {/* Items listed */}
                        <div>
                          <span className="block font-bold text-zinc-400 uppercase tracking-wider mb-2 text-[10px]">Itens Comprados</span>
                          <div className="space-y-2">
                            {selectedOrderDetail.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <img src={it.image} alt={it.name} referrerPolicy="no-referrer" className="h-8 w-8 object-cover rounded bg-zinc-900" />
                                  <div>
                                    <span className="block font-bold text-zinc-200 line-clamp-1 w-28">{it.name}</span>
                                    <span className="text-[10px] text-zinc-500">Tamanho: <strong className="text-cyan-400">{it.size}</strong> | Qtd: <strong>{it.quantity}</strong></span>
                                  </div>
                                </div>
                                <span className="font-bold text-zinc-300">{formatCurrency(it.price * it.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Finance values */}
                        <div className="border-t border-zinc-800 pt-3 space-y-1 bg-zinc-950/40 p-2.5 rounded-lg">
                          <div className="flex justify-between text-zinc-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(selectedOrderDetail.subtotal)}</span>
                          </div>
                          {selectedOrderDetail.shippingCost > 0 && (
                            <div className="flex justify-between text-zinc-500">
                              <span>Frete</span>
                              <span>{formatCurrency(selectedOrderDetail.shippingCost)}</span>
                            </div>
                          )}
                          {selectedOrderDetail.discount > 0 && (
                            <div className="flex justify-between text-emerald-400 font-semibold">
                              <span>Desconto</span>
                              <span>-{formatCurrency(selectedOrderDetail.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-white font-extrabold text-sm border-t border-zinc-800/80 mt-1.5 pt-1.5 uppercase">
                            <span>Total</span>
                            <span className="text-cyan-400">{formatCurrency(selectedOrderDetail.total)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-center py-12">Clique em algum pedido na tabela ao lado para visualizar os dados completos.</p>
                    )}
                  </div>

                </div>
              </div>
            )}


            {/* ========================================================= */}
            {/* TAB: PDV (POINT OF SALE) */}
            {/* ========================================================= */}
            {activeTab === "pdv" && (
              <div className="space-y-6 h-full flex flex-col justify-between">
                
                {/* Visual success modal for POS printed receipt */}
                {pdvSuccessReceipt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-zinc-950/95" onClick={() => setPdvSuccessReceipt(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-xl bg-white text-zinc-950 p-6 shadow-2xl space-y-4 font-mono text-xs">
                      <div className="text-center border-b border-zinc-300 pb-3">
                        <span className="block font-black text-sm uppercase tracking-widest text-black">CONEXÃO 011</span>
                        <span className="block text-[10px] text-zinc-500">Av. Oswaldo Cruz, 1594 - Guarujá, SP</span>
                        <span className="block text-[10px] text-zinc-500">WhatsApp: {settings?.whatsapp}</span>
                      </div>

                      <div className="space-y-1">
                        <p><strong>CUPOM NÃO FISCAL</strong></p>
                        <p>Pedido: #{pdvSuccessReceipt.orderNumber}</p>
                        <p>Canal: Presencial (PDV)</p>
                        <p>Data: {new Date(pdvSuccessReceipt.createdAt).toLocaleDateString("pt-BR")} {new Date(pdvSuccessReceipt.createdAt).toLocaleTimeString("pt-BR")}</p>
                        <p>Cliente: {pdvSuccessReceipt.customer.name}</p>
                        {pdvSuccessReceipt.customer.phone !== "Balcão PDV" && <p>Tel: {pdvSuccessReceipt.customer.phone}</p>}
                      </div>

                      <div className="border-t border-b border-dashed border-zinc-400 py-2.5">
                        <p className="grid grid-cols-3 font-bold border-b border-zinc-200 pb-1 mb-1">
                          <span>Item</span>
                          <span className="text-center">Qtd</span>
                          <span className="text-right">Valor</span>
                        </p>
                        {pdvSuccessReceipt.items.map((it, idx) => (
                          <p key={idx} className="grid grid-cols-3 text-[11px] text-zinc-800 py-0.5">
                            <span className="truncate">{it.name} ({it.size})</span>
                            <span className="text-center">x{it.quantity}</span>
                            <span className="text-right">{formatCurrency(it.price * it.quantity)}</span>
                          </p>
                        ))}
                      </div>

                      <div className="space-y-1 text-right">
                        <p>Subtotal: {formatCurrency(pdvSuccessReceipt.subtotal)}</p>
                        {pdvSuccessReceipt.discount > 0 && <p>Desconto: -{formatCurrency(pdvSuccessReceipt.discount)}</p>}
                        <p className="font-extrabold text-sm text-black">TOTAL: {formatCurrency(pdvSuccessReceipt.total)}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Meio Pagto: {pdvSuccessReceipt.paymentMethod.toUpperCase()}</p>
                      </div>

                      <div className="text-center border-t border-dashed border-zinc-400 pt-3 mt-4 text-[10px] text-zinc-500">
                        <p>Obrigado pela preferência!</p>
                        <p>Conexão 011 Streetwear - Itapema</p>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={() => window.print()}
                          className="flex-1 rounded border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 py-1.5 flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          onClick={() => setPdvSuccessReceipt(null)}
                          className="flex-1 rounded bg-black text-white font-bold hover:bg-zinc-800 py-1.5 text-center cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider text-fuchsia-400">Ponto de Venda (PDV)</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Frente de caixa para vendas físicas. Diminui estoque automaticamente.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  
                  {/* Left side: POS Catalog Browser */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Catalog search/filters */}
                    <div className="flex gap-3 text-xs">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Filtre produto pelo nome para o PDV..."
                          value={pdvSearch}
                          onChange={(e) => setPdvSearch(e.target.value)}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-2 text-white placeholder-zinc-500 outline-none focus:border-fuchsia-500"
                        />
                      </div>
                      <select
                        value={pdvCategory}
                        onChange={(e) => setPdvCategory(e.target.value)}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 outline-none focus:border-fuchsia-500"
                      >
                        <option value="all">Categorias</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Simple catalog cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-1">
                      {products
                        .filter((p) => p.name.toLowerCase().includes(pdvSearch.toLowerCase()))
                        .filter((p) => pdvCategory === "all" || p.category === pdvCategory)
                        .map((p) => {
                          const hasStock = Object.values(p.stock).reduce((a,b)=>a+b, 0) > 0;
                          return (
                            <div 
                              key={p.id} 
                              className={`rounded-xl border border-zinc-850 bg-zinc-900/40 p-3.5 flex flex-col justify-between space-y-3.5 ${
                                !hasStock ? "opacity-40" : ""
                              }`}
                            >
                              <div className="flex space-x-3">
                                <img src={p.images[0]} alt={p.name} referrerPolicy="no-referrer" className="h-12 w-12 object-cover rounded bg-zinc-950 flex-shrink-0" />
                                <div className="text-xs">
                                  <h4 className="font-bold text-white line-clamp-1">{p.name}</h4>
                                  <span className="text-[10px] text-fuchsia-400 font-extrabold">{formatCurrency(p.price)}</span>
                                </div>
                              </div>

                              <div>
                                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Escolha o Tamanho:</span>
                                <div className="flex flex-wrap gap-1">
                                  {p.sizes.map((sz) => {
                                    const qty = p.stock[sz] || 0;
                                    return (
                                      <button
                                        key={sz}
                                        disabled={qty <= 0}
                                        onClick={() => handleAddPdvProduct(p, sz)}
                                        className={`px-2 py-1 rounded text-[10px] font-black uppercase border cursor-pointer ${
                                          qty <= 0
                                            ? "border-zinc-850 text-zinc-600 bg-zinc-950 line-through cursor-not-allowed"
                                            : "border-zinc-800 bg-zinc-950 hover:bg-fuchsia-950/30 hover:border-fuchsia-500 text-zinc-300"
                                        }`}
                                        title={`Estoque: ${qty} un.`}
                                      >
                                        {sz} ({qty})
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right side: POS Cart checkout */}
                  <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4.5 space-y-4 text-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-zinc-200 border-b border-zinc-800 pb-2.5 mb-3">Carrinho de PDV</h3>
                      
                      {/* Cart Item lists */}
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                        {pdvCart.length === 0 ? (
                          <p className="text-zinc-500 text-center py-10">Nenhum produto selecionado no PDV.</p>
                        ) : (
                          pdvCart.map((it, idx) => (
                            <div key={`${it.product.id}-${it.size}`} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-850">
                              <div className="space-y-0.5">
                                <span className="block font-bold text-white truncate max-w-28">{it.product.name}</span>
                                <span className="text-[10px] text-zinc-500">Tam: <strong className="text-fuchsia-400">{it.size}</strong> | Un: <strong>{formatCurrency(it.product.price)}</strong></span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleUpdatePdvQty(it.product.id || "", it.size, -1)}
                                  className="h-5 w-5 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 hover:text-white rounded"
                                >
                                  -
                                </button>
                                <span className="font-bold text-white text-[11px] w-4 text-center">{it.quantity}</span>
                                <button
                                  onClick={() => handleUpdatePdvQty(it.product.id || "", it.size, 1)}
                                  className="h-5 w-5 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 hover:text-white rounded"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => handleRemovePdvItem(it.product.id || "", it.size)}
                                  className="text-zinc-600 hover:text-red-500 p-1 rounded hover:bg-zinc-900 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="border-t border-zinc-800 pt-3 space-y-2.5">
                      <span className="block font-bold text-zinc-400 uppercase tracking-widest text-[9px]">Dados do Comprador (Opcional)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nome Comprador"
                          value={pdvCustomerName}
                          onChange={(e) => setPdvCustomerName(e.target.value)}
                          className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-fuchsia-500"
                        />
                        <input
                          type="text"
                          placeholder="Whats/Celular"
                          value={pdvCustomerPhone}
                          onChange={(e) => setPdvCustomerPhone(e.target.value)}
                          className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-fuchsia-500"
                        />
                      </div>
                    </div>

                    {/* PDV Coupon */}
                    <div className="space-y-1.5">
                      <span className="block font-bold text-zinc-400 uppercase tracking-widest text-[9px]">Cupom Desconto</span>
                      {pdvAppliedCoupon ? (
                        <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 p-1.5 rounded">
                          <span className="text-[10px] text-emerald-400 font-bold">{pdvAppliedCoupon.code} aplicado</span>
                          <button
                            onClick={() => {
                              setPdvAppliedCoupon(null);
                              setPdvCouponCode("");
                            }}
                            className="text-[10px] text-zinc-500 underline"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="CÓDIGO"
                            value={pdvCouponCode}
                            onChange={(e) => setPdvCouponCode(e.target.value.toUpperCase())}
                            className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-white font-bold outline-none uppercase"
                          />
                          <button
                            onClick={handleApplyPdvCoupon}
                            className="rounded bg-zinc-800 border border-zinc-750 px-2 text-[10px] font-bold hover:bg-zinc-700"
                          >
                            Aplicar
                          </button>
                        </div>
                      )}
                      {pdvCouponError && <p className="text-[10px] text-red-400">{pdvCouponError}</p>}
                    </div>

                    {/* POS Payment Method Selector */}
                    <div className="space-y-1.5">
                      <span className="block font-bold text-zinc-400 uppercase tracking-widest text-[9px]">Forma de Pagamento</span>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-bold text-[10px]">
                        <button
                          onClick={() => setPdvPaymentMethod("pix")}
                          className={`rounded py-1.5 border cursor-pointer ${
                            pdvPaymentMethod === "pix" ? "border-fuchsia-400 bg-fuchsia-950/30 text-fuchsia-400" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                          }`}
                        >
                          Pix / Transfer
                        </button>
                        <button
                          onClick={() => setPdvPaymentMethod("card")}
                          className={`rounded py-1.5 border cursor-pointer ${
                            pdvPaymentMethod === "card" ? "border-fuchsia-400 bg-fuchsia-950/30 text-fuchsia-400" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                          }`}
                        >
                          Cartão Déb/Créd
                        </button>
                        <button
                          onClick={() => setPdvPaymentMethod("money")}
                          className={`rounded py-1.5 border cursor-pointer ${
                            pdvPaymentMethod === "money" ? "border-fuchsia-400 bg-fuchsia-950/30 text-fuchsia-400" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                          }`}
                        >
                          Dinheiro
                        </button>
                      </div>
                    </div>

                    {/* PDV Totals */}
                    <div className="rounded-lg bg-zinc-950 p-3 space-y-1 border border-zinc-850">
                      <div className="flex justify-between text-zinc-500">
                        <span>Subtotal de itens</span>
                        <span>{formatCurrency(pdvSubtotal)}</span>
                      </div>
                      {pdvDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Desconto Cupom</span>
                          <span>-{formatCurrency(pdvDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white font-extrabold text-sm border-t border-zinc-800 mt-1.5 pt-1.5 uppercase">
                        <span>Total PDV</span>
                        <span className="text-fuchsia-400 text-base">{formatCurrency(pdvTotal)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleFinalizePdvSale}
                      disabled={pdvCart.length === 0}
                      className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:text-white transition-all shadow-lg shadow-fuchsia-500/15 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Registrar Venda & Baixar Estoque
                    </button>
                  </div>

                </div>
              </div>
            )}


            {/* ========================================================= */}
            {/* TAB: COUPONS (CUPONS) */}
            {/* ========================================================= */}
            {activeTab === "cupons" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Cupons de Desconto</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Crie códigos de desconto percentuais ou de valor fixo.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCoupon(null);
                      setCoupCode("");
                      setCoupType("percent");
                      setCoupValue("");
                      setCoupMinPurchase("");
                      setCoupExpiresAt("");
                      setCoupActive(true);
                      setIsCouponFormOpen(true);
                    }}
                    className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase text-black transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4 stroke-[3px]" />
                    <span>Novo Cupom</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {coupons.map((c) => {
                    const isExpired = new Date(c.expiresAt) < new Date();
                    return (
                      <div key={c.id} className="rounded-xl border border-zinc-850 bg-zinc-900 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-base font-black text-cyan-400 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
                            {c.code}
                          </span>
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => handleEditCouponClick(c)}
                              className="text-zinc-500 hover:text-cyan-400 p-1"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => c.code && handleDeleteCoupon(c.code)}
                              className="text-zinc-500 hover:text-red-400 p-1"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-zinc-400 space-y-1">
                          <p>Tipo: <strong className="text-white">{c.type === "percent" ? "Porcentagem (%)" : "Valor Fixo (R$)"}</strong></p>
                          <p>Valor: <strong className="text-white">{c.type === "percent" ? `${c.value}%` : formatCurrency(c.value)}</strong></p>
                          <p>Compra mínima: <strong className="text-white">{formatCurrency(c.minPurchase)}</strong></p>
                          <p>Validade: <strong className={isExpired ? "text-red-400" : "text-white"}>{new Date(c.expiresAt).toLocaleDateString("pt-BR")} {isExpired && "(Expirado)"}</strong></p>
                        </div>

                        <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Status:</span>
                          <span className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                            c.active && !isExpired ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20" : "bg-red-950/50 text-red-400 border border-red-500/20"
                          }`}>
                            {c.active && !isExpired ? "Ativo" : "Inativo / Expirado"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* COUPON DIALOG FORM */}
                {isCouponFormOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-zinc-950/90" onClick={() => setIsCouponFormOpen(false)} />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                          {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
                        </h3>
                        <button
                          onClick={() => setIsCouponFormOpen(false)}
                          className="rounded-full p-1 text-zinc-400 hover:text-white hover:bg-zinc-850 cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveCoupon} className="mt-5 space-y-4 text-xs">
                        <div>
                          <label className="block font-bold text-zinc-400 uppercase">Código do Cupom *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: CONEXAO15"
                            value={coupCode}
                            onChange={(e) => setCoupCode(e.target.value.toUpperCase())}
                            className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500 font-bold uppercase"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block font-bold text-zinc-400 uppercase">Tipo de Desconto *</label>
                            <select
                              value={coupType}
                              onChange={(e) => setCoupType(e.target.value as "percent" | "fixed")}
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                            >
                              <option value="percent">Porcentagem (%)</option>
                              <option value="fixed">Valor Fixo (R$)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-zinc-400 uppercase">Valor *</label>
                            <input
                              type="number"
                              required
                              placeholder="Ex: 15"
                              value={coupValue}
                              onChange={(e) => setCoupValue(e.target.value)}
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block font-bold text-zinc-400 uppercase">Mínimo de Compra (R$) *</label>
                            <input
                              type="number"
                              required
                              placeholder="Ex: 100"
                              value={coupMinPurchase}
                              onChange={(e) => setCoupMinPurchase(e.target.value)}
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-zinc-400 uppercase">Data de Validade *</label>
                            <input
                              type="date"
                              required
                              value={coupExpiresAt}
                              onChange={(e) => setCoupExpiresAt(e.target.value)}
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center space-x-2.5 cursor-pointer text-zinc-300">
                            <input
                              type="checkbox"
                              checked={coupActive}
                              onChange={(e) => setCoupActive(e.target.checked)}
                              className="h-4.5 w-4.5 accent-cyan-500"
                            />
                            <span className="font-bold">Cupom Ativo?</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3.5 text-xs font-black uppercase tracking-widest text-black transition-all"
                        >
                          Salvar Cupom
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* ========================================================= */}
            {/* TAB: SETTINGS (CONFIGURAÇÕES) */}
            {/* ========================================================= */}
            {activeTab === "config" && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">Configurações Gerais da Loja</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Gerencie os contatos, endereços e frete interestadual.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
                  
                  {/* Basic information */}
                  <div className="rounded-xl border border-zinc-850 bg-zinc-900 p-5 space-y-4">
                    <span className="block font-bold text-zinc-300 uppercase tracking-wider mb-2">Informações Básicas</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-zinc-400 uppercase">Nome da Loja</label>
                        <input
                          type="text"
                          required
                          value={setStoreName}
                          onChange={(e) => setSetStoreName(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 uppercase">WhatsApp Oficial (Formatado ex: 5513997124921) *</label>
                        <input
                          type="text"
                          required
                          value={setWhatsapp}
                          onChange={(e) => setSetWhatsapp(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block font-bold text-zinc-400 uppercase">Instagram Link (Ex: @conexao011.oficial)</label>
                        <input
                          type="text"
                          required
                          value={setInstagram}
                          onChange={(e) => setSetInstagram(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 uppercase">Endereço Completo</label>
                      <input
                        type="text"
                        required
                        value={setAddress}
                        onChange={(e) => setSetAddress(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-4 text-xs font-black uppercase tracking-widest text-black transition-all"
                  >
                    Salvar Configurações Globais
                  </button>
                </form>
              </div>
            )}

          </main>
        </div>
      )}

    </div>
  );
}
