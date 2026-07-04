import React, { useState, useEffect } from "react";
import { CartItem, Coupon, StoreSettings, Order } from "../types";
import { formatCurrency, fetchAddressByCep, generateOrderNumber, formatWhatsAppMessage, calculateCorreiosRates } from "../utils";
import { X, ShoppingBag, Plus, Minus, Trash2, Send, Ticket, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, doc, getDoc, db } from "../firebase";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, size: string, quantity: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onClearCart: () => void;
  settings: StoreSettings | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  settings,
}: CartDrawerProps) {
  if (!isOpen) return null;

  // Checkout Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"pac" | "sedex">("pac");
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  // General checkout states
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Subtotal calculation
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Correios shipping options lookup
  const rates = state ? calculateCorreiosRates(state, subtotal) : {
    pac: { name: "PAC (Correios)", price: 0, deliveryTime: "" },
    sedex: { name: "SEDEX (Correios)", price: 0, deliveryTime: "" }
  };

  const shippingCost = state ? (shippingMethod === "sedex" ? rates.sedex.price : rates.pac.price) : 0;

  // Coupon validation & discount
  const getDiscountValue = () => {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.minPurchase) return 0;

    if (appliedCoupon.type === "percent") {
      return (subtotal * appliedCoupon.value) / 100;
    } else {
      return appliedCoupon.value;
    }
  };
  const discount = getDiscountValue();

  // Final Total
  const total = Math.max(0, subtotal + shippingCost - discount);

  // Fetch CEP information automatically
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      const getCepDetails = async () => {
        setLoadingCep(true);
        setCepError("");
        setCalculatingShipping(true);
        const result = await fetchAddressByCep(cleanCep);
        setLoadingCep(false);
        if (result) {
          setStreet(result.logradouro);
          setNeighborhood(result.bairro);
          setCity(result.localidade);
          setState(result.uf);
          // Simulation of Correios web service calculation delay
          setTimeout(() => {
            setCalculatingShipping(false);
          }, 800);
        } else {
          setCepError("CEP não encontrado. Digite o endereço manualmente.");
          setCalculatingShipping(false);
        }
      };
      getCepDetails();
    }
  }, [cep]);

  // Apply Coupon code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoadingCoupon(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const codeUpper = couponCode.trim().toUpperCase();
      const docRef = doc(db, "coupons", codeUpper);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Coupon;
        // Verify expiry
        const isExpired = new Date(data.expiresAt) < new Date();
        
        if (!data.active) {
          setCouponError("Este cupom está inativo.");
        } else if (isExpired) {
          setCouponError("Este cupom já expirou.");
        } else if (subtotal < data.minPurchase) {
          setCouponError(`Compra mínima para este cupom é ${formatCurrency(data.minPurchase)}.`);
        } else {
          setAppliedCoupon({ ...data, id: docSnap.id });
          setCouponError("");
        }
      } else {
        setCouponError("Cupom inválido.");
      }
    } catch (error) {
      console.error("Error fetching coupon:", error);
      setCouponError("Erro ao validar o cupom.");
    } finally {
      setLoadingCoupon(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // Checkout process submit
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!name || !phone || !cep || !street || !number || !neighborhood || !city || !state) {
      alert("Por favor, preencha todos os campos obrigatórios do endereço.");
      return;
    }

    setIsCheckingOut(true);

    try {
      const orderNumber = generateOrderNumber();
      const orderData: Omit<Order, "id"> = {
        orderNumber,
        customer: {
          name,
          phone,
          cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
        },
        items: cart.map((item) => ({
          productId: item.product.id || "",
          name: item.product.name,
          size: item.selectedSize,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0] || "",
        })),
        subtotal,
        shippingCost,
        shippingMethod: shippingMethod.toUpperCase(),
        discount,
        total,
        status: "pending",
        paymentMethod: "whatsapp_payment",
        type: "online",
        createdAt: new Date().toISOString(),
      };

      // 1. Save order to Firestore
      const ordersCol = collection(db, "orders");
      await addDoc(ordersCol, orderData);

      // 2. Generate WhatsApp redirect message URL
      const whatsappUrl = formatWhatsAppMessage(
        { ...orderData, id: "" } as Order,
        settings?.whatsapp || "5513997124921"
      );

      // 3. Clear cart and close drawer
      onClearCart();
      setIsCheckingOut(false);
      onClose();

      // 4. Redirect to WhatsApp
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Houve um erro ao processar seu pedido. Tente novamente.");
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs"
        />

        {/* Sliding Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative z-10 flex h-full w-full max-w-lg flex-col bg-black/60 border-l border-white/10 backdrop-blur-xl shadow-2xl overflow-y-auto"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-5 sticky top-0 bg-black/80 backdrop-blur-md z-20">
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                Seu Carrinho
              </h2>
              <span className="rounded-full bg-[#00f0ff]/10 px-2 py-0.5 text-xs font-semibold text-[#00f0ff] border border-[#00f0ff]/20">
                {cart.length} item{cart.length !== 1 ? "ns" : ""}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {cart.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <ShoppingBag className="h-12 w-12 text-zinc-700 mb-4 animate-bounce" />
                <p className="text-sm font-bold text-zinc-400">Seu carrinho está vazio</p>
                <p className="text-xs text-zinc-500 mt-1">Navegue pelas coleções e adicione kits insanos!</p>
                <button
                  onClick={onClose}
                  className="mt-5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#a855f7] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-black hover:brightness-110 transition-all cursor-pointer"
                >
                  Voltar para a Loja
                </button>
              </div>
            ) : (
              <>
                {/* Product List */}
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.product.id}-${item.selectedSize}-${idx}`}
                      className="flex items-center space-x-4 rounded-xl border border-white/5 bg-black/40 p-3.5"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-lg object-cover bg-zinc-900"
                      />

                      {/* Product Details & Qty adjustments */}
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-zinc-200 line-clamp-1">{item.product.name}</h4>
                        <div className="flex items-center space-x-2 mt-0.5 text-xs text-zinc-500">
                          <span>Tam: <strong className="text-cyan-400">{item.selectedSize}</strong></span>
                          <span>•</span>
                          <span>Unit: <strong>{formatCurrency(item.product.price)}</strong></span>
                        </div>

                        {/* Adjust qty buttons */}
                        <div className="flex items-center space-x-2.5 mt-2.5">
                          <button
                            onClick={() => onUpdateQty(item.product.id || "", item.selectedSize, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer text-xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-zinc-300 w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQty(item.product.id || "", item.selectedSize, item.quantity + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 border border-white/10 text-[#00f0ff] hover:text-white hover:bg-white/10 cursor-pointer text-xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total Price and Trash delete */}
                      <div className="text-right flex flex-col justify-between items-end h-16">
                        <button
                          onClick={() => onRemoveItem(item.product.id || "", item.selectedSize)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-extrabold text-white">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Coupon Area */}
                <div className="border-t border-zinc-800/60 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Cupom de Desconto
                  </span>
                  
                  {appliedCoupon ? (
                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-2.5">
                      <div className="flex items-center space-x-2">
                        <Ticket className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">
                          {appliedCoupon.code} aplicado (
                          {appliedCoupon.type === "percent"
                            ? `${appliedCoupon.value}%`
                            : formatCurrency(appliedCoupon.value)}{" "}
                          OFF)
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-zinc-400 hover:text-red-400 cursor-pointer underline"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex space-x-2">
                      <input
                        type="text"
                        placeholder="Ex: CONEXAO10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={loadingCoupon}
                        className="rounded-lg bg-white/10 hover:bg-[#00f0ff] hover:text-black px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer border border-white/10 flex items-center"
                      >
                        {loadingCoupon ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Aplicar"
                        )}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="mt-1.5 text-xs text-red-400">{couponError}</p>}
                </div>

                {/* Delivery address & checkout form */}
                <form onSubmit={handleCheckout} className="border-t border-zinc-800/60 pt-4 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center space-x-1">
                    <span>Informações de Entrega</span>
                  </span>

                  <div className="grid grid-cols-1 gap-3 text-xs">
                    {/* Customer Full Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como deseja ser chamado?"
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                      />
                    </div>

                    {/* Customer WhatsApp Phone */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase">Celular / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: (13) 99712-4921"
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                      />
                    </div>

                    {/* Zip Code (CEP) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase">CEP *</label>
                        <div className="relative mt-1.5">
                          <input
                            type="text"
                            required
                            maxLength={9}
                            value={cep}
                            onChange={(e) => setCep(e.target.value)}
                            placeholder="00000-000"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                          />
                          {loadingCep && (
                            <span className="absolute right-3 top-2.5 text-zinc-500">
                              <Loader2 className="h-4 w-4 animate-spin text-[#00f0ff]" />
                            </span>
                          )}
                        </div>
                        {cepError && <p className="mt-1 text-[10px] text-red-400">{cepError}</p>}
                      </div>

                      {/* State (Uf) - Disabled because ViaCep fetches it */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase">Estado (UF) *</label>
                        <input
                          type="text"
                          required
                          readOnly
                          value={state}
                          placeholder="Fórmula pelo CEP"
                          className="mt-1.5 w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2.5 text-zinc-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Street & Number */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase">Rua / Logradouro *</label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Av / Rua"
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase">Número *</label>
                        <input
                          type="text"
                          required
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          placeholder="123"
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                        />
                      </div>
                    </div>

                    {/* Complement & Neighborhood */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase">Complemento</label>
                        <input
                          type="text"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          placeholder="Apto / Bloco"
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase">Bairro *</label>
                        <input
                          type="text"
                          required
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          placeholder="Bairro"
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                        />
                      </div>
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase">Cidade *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cidade"
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-[#00f0ff] outline-none"
                      />
                    </div>
                  </div>

                  {/* Correios Shipping Selector */}
                  {state && (
                    <div className="space-y-2 mt-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Forma de Envio (Correios) *</label>
                      {calculatingShipping ? (
                        <div className="rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/5 p-4 flex items-center justify-center space-x-2 text-xs text-zinc-300">
                          <Loader2 className="h-4 w-4 animate-spin text-[#00f0ff]" />
                          <span>Calculando frete automático via Correios...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setShippingMethod("pac")}
                            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                              shippingMethod === "pac"
                                ? "border-[#00f0ff] bg-[#00f0ff]/5"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <span className="text-[11px] font-black text-white uppercase">PAC (Correios)</span>
                            <span className="text-[10px] text-zinc-400 mt-1">{rates.pac.deliveryTime}</span>
                            <span className="text-xs font-black text-[#00f0ff] mt-2.5">
                              {rates.pac.price === 0 ? "GRÁTIS" : formatCurrency(rates.pac.price)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShippingMethod("sedex")}
                            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                              shippingMethod === "sedex"
                                ? "border-[#00f0ff] bg-[#00f0ff]/5"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <span className="text-[11px] font-black text-white uppercase">SEDEX (Correios)</span>
                            <span className="text-[10px] text-zinc-400 mt-1">{rates.sedex.deliveryTime}</span>
                            <span className="text-xs font-black text-[#00f0ff] mt-2.5">
                              {rates.sedex.price === 0 ? "GRÁTIS" : formatCurrency(rates.sedex.price)}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial recap box */}
                  <div className="rounded-xl bg-black/60 border border-white/5 p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Itens Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Frete {state ? `(${shippingMethod.toUpperCase()} - ${state.toUpperCase()})` : ""}</span>
                      <span>
                        {!state
                          ? "Insira o CEP"
                          : calculatingShipping
                          ? "Calculando..."
                          : shippingCost === 0
                          ? "GRÁTIS"
                          : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Desconto Cupom</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-white/5 my-2 pt-2 flex justify-between text-sm font-extrabold text-white">
                      <span className="uppercase tracking-wider">Total</span>
                      <span className="text-[#00f0ff] text-base drop-shadow-[0_0_8px_rgba(0,240,255,0.3)] font-black">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Submit checkout button */}
                  <button
                    type="submit"
                    disabled={isCheckingOut}
                    className="w-full rounded-xl bg-[#25D366] hover:bg-[#128C7E] py-4 text-xs font-black uppercase tracking-widest text-white transition-all flex items-center justify-center space-x-2.5 shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] active:scale-[0.99] cursor-pointer"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Enviando Pedido...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-white fill-white" />
                        <span>Finalizar & Enviar WhatsApp</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-zinc-500 text-center">
                    Ao clicar em finalizar, seu pedido será salvo no banco e você será direcionado para o WhatsApp oficial da Conexão 011 para concluir o pagamento via Pix.
                  </p>
                </form>
              </>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
