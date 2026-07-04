import React, { useState, useEffect, useRef } from "react";
import { Product, Category, CartItem, Coupon, StoreSettings } from "./types";
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  seedDatabaseIfEmpty 
} from "./firebase";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import ProductModal from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import AdminPanel from "./components/AdminPanel";
import { 
  Search, 
  Instagram, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  Star,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  // Intro screen states
  const [showIntro, setShowIntro] = useState(true);
  const [introProgress, setIntroProgress] = useState(0);

  // Auto-increment progress bar for 5 seconds (5000ms)
  useEffect(() => {
    if (!showIntro) return;
    
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setIntroProgress(progress);

      if (elapsed >= duration) {
        clearInterval(interval);
        setShowIntro(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [showIntro]);
  // Sync state with database
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Modal & Drawer visibility states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart Management State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Search, categories filter and sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("default");

  const catalogRef = useRef<HTMLDivElement>(null);

  // Seed and Real-time syncing
  useEffect(() => {
    // 1. Seed database with premium streetwear on first startup if empty
    const initDb = async () => {
      await seedDatabaseIfEmpty();
    };
    initDb();

    // 2. Synchronize products in real-time
    const productsCol = collection(db, "products");
    const qProducts = query(productsCol, orderBy("createdAt", "desc"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const prodList: Product[] = [];
      snapshot.forEach((doc) => {
        prodList.push({ ...doc.data() as Product, id: doc.id });
      });
      setProducts(prodList);
    });

    // 3. Synchronize categories in real-time
    const categoriesCol = collection(db, "categories");
    const unsubCategories = onSnapshot(categoriesCol, (snapshot) => {
      const catList: Category[] = [];
      snapshot.forEach((doc) => {
        catList.push({ ...doc.data() as Category, id: doc.id });
      });
      setCategories(catList);
    });

    // 4. Synchronize coupons in real-time
    const couponsCol = collection(db, "coupons");
    const unsubCoupons = onSnapshot(couponsCol, (snapshot) => {
      const coupList: Coupon[] = [];
      snapshot.forEach((doc) => {
        coupList.push({ ...doc.data() as Coupon, id: doc.id });
      });
      setCoupons(coupList);
    });

    // 5. Synchronize settings document in real-time
    const settingsCol = collection(db, "settings");
    const unsubSettings = onSnapshot(settingsCol, (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id === "store_config") {
          setSettings(doc.data() as StoreSettings);
        }
      });
    });

    // 6. Load Cart from localStorage
    const savedCart = localStorage.getItem("conexao011_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart", e);
      }
    }

    return () => {
      unsubProducts();
      unsubCategories();
      unsubCoupons();
      unsubSettings();
    };
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("conexao011_cart", JSON.stringify(cart));
  }, [cart]);

  // Scroll to Catalog Catalog view helper
  const handleScrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cart actions
  const handleAddToCart = (product: Product, size: string, quantity: number) => {
    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.selectedSize === size
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      setCart([...cart, { product, selectedSize: size, quantity }]);
    }
  };

  const handleUpdateCartQty = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId, size);
      return;
    }
    
    // Check stock limit for that product size
    const cartItem = cart.find(it => it.product.id === productId && it.selectedSize === size);
    if (cartItem) {
      const maxStock = cartItem.product.stock[size] || 0;
      if (quantity > maxStock) {
        alert(`Desculpe, o limite de estoque disponível para o tamanho ${size} é ${maxStock} unidades.`);
        return;
      }
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string, size: string) => {
    setCart(cart.filter((item) => !(item.product.id === productId && item.selectedSize === size)));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Total quantity count in Cart
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Filter and Sort calculation for product list
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      if (sortBy === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0; // default (createdAt)
    });

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-[#00f0ff] selection:text-black relative overflow-hidden">
           {/* Luxury Cinematic Entrance Screen */}
      <motion.div
        animate={{
          opacity: showIntro ? 1 : 0,
          scale: showIntro ? 1 : 1.05,
          filter: showIntro ? "blur(0px)" : "blur(12px)",
          pointerEvents: showIntro ? "auto" : "none",
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020202] text-white select-none overflow-hidden"
      >
        {/* Ambient luxury light shifts and background mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-cyan-500/25 to-purple-500/0 blur-[130px]"
          />
          <motion.div
            animate={{
              scale: [1.3, 1, 1.3],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-l from-purple-500/25 to-cyan-500/0 blur-[160px]"
          />
          {/* Subtle tech-luxury grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        {/* Glowing neon background shockwave rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`wave-${i}`}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.8, 2.5], opacity: [0, 0.5, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 1.3,
                ease: "easeOut",
              }}
              className="absolute w-[250px] h-[250px] sm:w-[450px] sm:h-[450px] rounded-full border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
            />
          ))}
        </div>

        {/* Premium cyber particle system */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => {
            const size = Math.random() * 3 + 1;
            return (
              <motion.div
                key={`particle-${i}`}
                initial={{
                  x: Math.random() * 600 - 300,
                  y: Math.random() * 400 + 200,
                  opacity: 0,
                  scale: 0.5,
                }}
                animate={{
                  y: -350,
                  opacity: [0, 0.8, 0.8, 0],
                  scale: [0.5, 1.5, 0.8],
                }}
                transition={{
                  duration: Math.random() * 3.5 + 2.5,
                  repeat: Infinity,
                  delay: Math.random() * 1.5,
                  ease: "easeInOut",
                }}
                className="absolute left-1/2 bottom-12 rounded-full bg-cyan-400/30 blur-[0.5px]"
                style={{ width: size, height: size }}
              />
            );
          })}
        </div>

        {/* Giant Luxury Watermark behind elements */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1.05, opacity: 0.04 }}
          transition={{ duration: 4.5, ease: "easeOut" }}
          className="absolute font-black text-[13rem] sm:text-[24rem] text-white tracking-widest pointer-events-none select-none z-0 filter blur-sm font-sans"
        >
          011
        </motion.div>

        {/* Content Display */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">
          {/* Delicate top element */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="mb-6 flex items-center justify-center space-x-2"
          >
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-cyan-500/50" />
            <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-cyan-500/50" />
          </motion.div>

          {/* Upper Lineage Heading */}
          <motion.span
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, letterSpacing: "0.45em" }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-[0.45em] drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
          >
            HIGH-END STREETWEAR PLATFORM
          </motion.span>

          {/* Majestic store name: CONEXÃO 011 with metallic sheen & high-impact zoom */}
          <div className="mt-4 mb-2 relative overflow-hidden px-4">
            <motion.h1
              initial={{ scale: 0.8, opacity: 0, filter: "blur(12px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl font-black font-sans tracking-[0.18em] leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent uppercase relative"
            >
              CONEXÃO 011
              {/* Luxury dynamic metallic sweep sheen overlay */}
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "200%" }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "linear", repeatDelay: 1.2 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent skew-x-12 mix-blend-screen pointer-events-none"
              />
            </motion.h1>

            {/* Cybernetic glowing line below title */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "90%" }}
              transition={{ delay: 1.0, duration: 1.2, ease: "easeInOut" }}
              className="h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-4 shadow-[0_0_8px_#00f0ff]"
            />
          </div>

          {/* Luxury context tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="text-xs text-zinc-400 max-w-sm leading-relaxed mt-2 tracking-wide font-semibold"
          >
            A melhor curadoria de moda streetwear urbana do litoral de São Paulo para todo o Brasil. Qualidade incomparável, estilo e sofisticação elevada.
          </motion.p>

          {/* 5-second loader mechanism */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="mt-12 w-full max-w-xs space-y-4"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 tracking-widest font-semibold">
              <span className="animate-pulse">LOADING BRAND CORE...</span>
              <span>{Math.round(introProgress)}%</span>
            </div>
            
            {/* Glow progress track */}
            <div className="h-[2px] w-full bg-zinc-950 rounded-full overflow-hidden relative border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 shadow-[0_0_12px_#00f0ff]"
                style={{ width: `${introProgress}%` }}
              />
            </div>
            
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest pt-1">
              GUARUJÁ • SÃO PAULO • EST. 2026
            </div>
          </motion.div>

          {/* Beautiful luxury action skip button */}
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            onClick={() => setShowIntro(false)}
            className="mt-10 inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10 active:scale-95"
          >
            <span>Pular Introdução</span>
            <ChevronRight className="h-3 w-3" />
          </motion.button>
        </div>
      </motion.div>

      {/* Background Ambient Mesh Glows */}
      <div className="absolute top-[-200px] left-[-150px] w-[600px] h-[600px] bg-[#00f0ff] rounded-full blur-[160px] opacity-[0.08] pointer-events-none" />
      <div className="absolute top-[20%] right-[-150px] w-[700px] h-[700px] bg-[#a855f7] rounded-full blur-[180px] opacity-[0.08] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-200px] w-[600px] h-[600px] bg-[#00f0ff] rounded-full blur-[150px] opacity-[0.06] pointer-events-none" />

      {/* Sticky Top Header bar */}
      <Navbar
        settings={settings}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onScrollToCatalog={handleScrollToCatalog}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5 bg-black py-28 sm:py-36">
        {/* Background Image Watermark with high-impact continuous motion */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="w-full h-full bg-cover bg-center opacity-[0.26]"
            style={{ 
              backgroundImage: `url("https://i.postimg.cc/FsT6QcTQ/Chat-GPT-Image-4-de-jul-de-2026-17-38-08.png")`,
            }}
            animate={{
              scale: [1.1, 1.25, 1.15, 1.2, 1.1],
              x: ["-2%", "2%", "-1%", "1%", "-2%"],
              y: ["-2%", "-1%", "2%", "-2%", "-2%"],
              rotate: [0, 1, -1, 0.5, 0]
            }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        </div>
        {/* Radial dark gradient over the image to keep text extremely readable and focus in the center */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#050505_95%)] pointer-events-none" />

        {/* Glow neon balls */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-[#00f0ff]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 h-[350px] w-[350px] rounded-full bg-[#a855f7]/10 blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Subheader tag drop */}
          <div className="inline-flex items-center space-x-1.5 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-4 py-1.5 text-xs font-bold text-[#00f0ff] uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(0,240,255,0.15)] animate-pulse">
            <Sparkles className="h-3 w-3 text-[#00f0ff]" />
            <span>DROP STREETWEAR OUTONO/INVERNO 2026</span>
          </div>

          {/* Majestic Title headings */}
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-7xl uppercase font-sans">
            DO <span className="text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">011</span> PARA O{" "}
            <span className="bg-gradient-to-r from-[#a855f7] via-indigo-500 to-[#00f0ff] bg-clip-text text-transparent">BRASIL</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed font-semibold">
            Kits masculinos premium, Nike Tech Fleece originais e o melhor do streetwear urbano com qualidade absurda e preço justo.
          </p>

          {/* Action Call buttons */}
          <div className="mt-10 flex items-center justify-center gap-x-4">
            <button
              onClick={handleScrollToCatalog}
              className="rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#a855f7] px-6 sm:px-8 py-3.5 sm:py-4 text-xs font-black uppercase tracking-widest text-black hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_35px_rgba(0,240,255,0.5)] active:scale-[0.98] cursor-pointer"
            >
              Ver Catálogo Completo
            </button>
            {settings?.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 sm:px-8 py-3.5 sm:py-4 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center space-x-2 backdrop-blur-sm"
              >
                <Instagram className="h-4 w-4 text-[#a855f7]" />
                <span>Seguir no Instagram</span>
              </a>
            )}
          </div>

        </div>
      </section>

      {/* Strengths Highlights Section */}
      <section className="bg-transparent py-12 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3.5 md:space-y-0 md:space-x-4 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-[#00f0ff]/40 transition-colors">
              <Truck className="h-8 w-8 text-[#00f0ff] shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Envio para Todo Brasil</h3>
                <p className="text-xs text-zinc-400 mt-1">Calculamos frete via CEP e despachamos seu kit no mesmo dia.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3.5 md:space-y-0 md:space-x-4 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-[#a855f7]/40 transition-colors">
              <ShieldCheck className="h-8 w-8 text-[#a855f7] shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Qualidade Premium</h3>
                <p className="text-xs text-zinc-400 mt-1">Acabamento impecável, costura dupla reforçada e caimento streetwear perfeito.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3.5 md:space-y-0 md:space-x-4 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-[#00f0ff]/40 transition-colors">
              <Flame className="h-8 w-8 text-[#00f0ff] shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Compra Segura via WhatsApp</h3>
                <p className="text-xs text-zinc-400 mt-1">Monte seu carrinho, finalize e conclua o pagamento com atendimento personalizado.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Catalog Grid Section */}
      <section ref={catalogRef} id="catalogo" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        
        {/* Header and filters search controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 gap-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Catálogo Streetwear</h2>
            <p className="text-xs text-zinc-400 mt-1">Selecione as melhores peças e garanta o seu drop.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3.5 text-xs">
            {/* Search Input bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar kit, corta vento, camiseta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-[#00f0ff] transition-all"
              />
            </div>

            {/* Price sort option */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-zinc-300 outline-none focus:border-[#00f0ff] transition-all font-semibold"
            >
              <option value="default">Ordenar por: Relevância</option>
              <option value="featured">Destaques Primeiro</option>
              <option value="priceAsc">Menor Preço</option>
              <option value="priceDesc">Maior Preço</option>
            </select>
          </div>
        </div>

        {/* Categories selector pills */}
        <div className="mt-8 flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveCategory("Todos")}
            className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeCategory === "Todos"
                ? "bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-black shadow-lg shadow-[#00f0ff]/20"
                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat.name
                  ? "bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-black shadow-lg shadow-[#00f0ff]/20"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Catalog List items */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 bg-white/5 border border-white/10 rounded-2xl mt-12">
            <Search className="h-10 w-10 text-zinc-600 mb-4" />
            <h3 className="text-sm font-bold text-zinc-400">Nenhum produto encontrado</h3>
            <p className="text-xs text-zinc-500 mt-1">Tente ajustar seus filtros ou buscar por outro termo.</p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}

      </section>

      {/* Core physical address details footer layout */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md py-16 text-xs text-zinc-400 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <span className="text-xl font-black bg-gradient-to-r from-[#00f0ff] to-[#a855f7] bg-clip-text text-transparent font-sans tracking-wider">
              CONEXÃO 011
            </span>
            <p className="text-xs leading-relaxed text-zinc-500 max-w-xs">
              A melhor curadoria de moda streetwear urbana do litoral de São Paulo para todo o Brasil. Qualidade incomparável, estilo e preço justo.
            </p>
            {settings?.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-zinc-300 hover:text-[#a855f7] font-bold transition-colors"
              >
                <Instagram className="h-4 w-4" />
                <span>{settings.instagram}</span>
              </a>
            )}
          </div>

          {/* Delivery & Physical Store location info */}
          <div className="space-y-3.5">
            <span className="block font-bold uppercase tracking-widest text-[10px] text-zinc-300">
              📍 Loja Física & Localização
            </span>
            <div className="space-y-2 text-zinc-500 leading-relaxed font-semibold">
              <p className="flex items-start">
                <MapPin className="h-4 w-4 text-[#00f0ff] mr-2 shrink-0 mt-0.5" />
                <span>
                  {settings?.address || "Av. Oswaldo Cruz, 1594 - Itapema, Guarujá - São Paulo"}
                </span>
              </p>
              <p>🇧🇷 Despachamos para todas as capitais e estados do Brasil.</p>
            </div>
          </div>

          {/* Administrative quick link & hours */}
          <div className="space-y-4 md:text-right flex flex-col md:items-end justify-between">
            <div className="space-y-2">
              <span className="block font-bold uppercase tracking-widest text-[10px] text-zinc-300">
                ⚡ Atendimento On-line
              </span>
              <p className="text-zinc-500">Segunda à Sábado das 10h às 20h</p>
              <p className="text-zinc-500">Suporte pelo WhatsApp: <strong className="text-[#00f0ff]">+{settings?.whatsapp}</strong></p>
            </div>

            {/* Backoffice entry point link */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-[11px] font-bold text-zinc-600 hover:text-[#00f0ff] underline transition-colors cursor-pointer text-left md:text-right"
            >
              Área Administrativa Conexão 011
            </button>
          </div>

        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 text-center text-zinc-600">
          <p>© 2026 Conexão 011 Streetwear. Todos os direitos reservados. Itapema, Guarujá/SP.</p>
        </div>
      </footer>

      {/* Product Detail Modal Popup */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        settings={settings}
      />

      {/* Comprehensive Operational Admin Panel Screen */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        settings={settings}
        products={products}
        categories={categories}
        coupons={coupons}
      />

    </div>
  );
}
