import React, { useState } from "react";
import { Product } from "../types";
import { formatCurrency } from "../utils";
import { X, ShoppingBag, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
}

export default function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  if (!product) return null;

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const imagesList = product.images.length > 0 ? product.images : [
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600"
  ];

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % imagesList.length);
  };

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    onAddToCart(product, selectedSize, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 1500);
  };

  const totalStock = (Object.values(product.stock) as number[]).reduce((a, b) => a + b, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm"
        />

        {/* Modal content box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-4xl rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl overflow-hidden shadow-2xl shadow-[#00f0ff]/5 my-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 hover:border-[#00f0ff]/50 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left side: Images display */}
            <div className="relative p-6 flex flex-col justify-between bg-black/30 border-r border-white/10">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
                <img
                  src={imagesList[activeImageIdx]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover object-center transition-all duration-300"
                />

                {/* Arrow navigation for images */}
                {imagesList.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                    <button
                      onClick={handlePrevImage}
                      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950/80 text-white hover:bg-cyan-500 hover:text-black border border-zinc-800 transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950/80 text-white hover:bg-cyan-500 hover:text-black border border-zinc-800 transition-all"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail indicator list */}
              {imagesList.length > 1 && (
                <div className="mt-4 flex gap-2.5 overflow-x-auto py-1">
                  {imagesList.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border transition-all ${
                        idx === activeImageIdx
                          ? "border-cyan-400 ring-2 ring-cyan-500/20"
                          : "border-zinc-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} alt="Thumbnail" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Product purchasing interface */}
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                {/* Category & Name */}
                <span className="text-xs font-bold uppercase tracking-widest text-[#00f0ff]">
                  {product.category}
                </span>
                <h2 className="mt-1 text-2xl font-black text-white leading-tight">
                  {product.name}
                </h2>

                {/* Price panel */}
                <div className="mt-3 flex items-baseline space-x-3">
                  <span className="text-2xl font-black text-white">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-zinc-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                  {product.originalPrice > product.price && (
                    <span className="rounded-md bg-fuchsia-950/50 border border-fuchsia-500/30 px-2 py-0.5 text-xs font-extrabold text-fuchsia-400">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-5 text-sm text-zinc-400 leading-relaxed">
                  {product.description}
                </p>

                {/* Size selection */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Selecione o Tamanho
                    </span>
                    {selectedSize && (
                      <span className="text-xs font-medium text-cyan-400">
                        {product.stock[selectedSize] > 0
                          ? `Disponível (${product.stock[selectedSize]} itens em estoque)`
                          : "Esgotado neste tamanho"}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {product.sizes.map((size) => {
                      const stockAvailable = product.stock[size] || 0;
                      const isOutOfStock = stockAvailable === 0;
                      const isSelected = selectedSize === size;

                      return (
                        <button
                          key={size}
                          disabled={isOutOfStock}
                          onClick={() => {
                            setSelectedSize(size);
                            setQuantity(1);
                          }}
                          className={`relative min-w-12 h-11 flex items-center justify-center rounded-lg border text-sm font-bold uppercase transition-all duration-150 cursor-pointer ${
                            isOutOfStock
                              ? "border-white/5 text-zinc-600 bg-black/40 line-through cursor-not-allowed"
                              : isSelected
                              ? "border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff] shadow-md shadow-[#00f0ff]/10"
                              : "border-white/10 hover:border-[#a855f7]/50 bg-white/5 text-zinc-300 hover:text-white"
                          }`}
                        >
                          {size}
                          
                          {/* FOMO banner (urgency) */}
                          {!isOutOfStock && stockAvailable <= 2 && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-fuchsia-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* low stock warning message */}
                  {selectedSize && product.stock[selectedSize] <= 2 && product.stock[selectedSize] > 0 && (
                    <p className="mt-2 text-xs font-medium text-fuchsia-400 animate-pulse">
                      ⚡ Corra! Restam apenas {product.stock[selectedSize]} unidade{product.stock[selectedSize] > 1 ? "s" : ""} no tamanho selecionado!
                    </p>
                  )}
                </div>

                {/* Quantity selector */}
                {selectedSize && product.stock[selectedSize] > 0 && (
                  <div className="mt-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Quantidade
                    </span>
                    <div className="mt-2.5 flex items-center space-x-3">
                      <div className="flex items-center rounded-lg bg-black/50 border border-white/10">
                        <button
                          type="button"
                          disabled={quantity <= 1}
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="px-3.5 py-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-black text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={quantity >= (product.stock[selectedSize] || 1)}
                          onClick={() => setQuantity((q) => q + 1)}
                          className="px-3.5 py-2 text-[#00f0ff] hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase action area */}
              <div className="mt-8 border-t border-white/5 pt-6">
                {totalStock === 0 ? (
                  <div className="w-full rounded-xl bg-black border border-red-500/20 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-red-400">
                    Sem estoque temporariamente
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || addedAnimation}
                    className={`flex w-full items-center justify-center space-x-3.5 rounded-xl py-4 text-sm font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                      addedAnimation
                        ? "bg-green-500 text-black shadow-lg shadow-green-500/20"
                        : !selectedSize
                        ? "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5"
                        : "bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-black font-black hover:brightness-110 shadow-lg shadow-[#00f0ff]/20 active:scale-[0.99]"
                    }`}
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="h-5 w-5 stroke-[3px]" />
                        <span>Adicionado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        <span>
                          {selectedSize ? "Adicionar ao Carrinho" : "Selecione o Tamanho"}
                        </span>
                      </>
                    )}
                  </button>
                )}
                
                <p className="mt-3 text-center text-[11px] text-zinc-500">
                  🔒 Compra garantida & envio imediato via Conexão 011.
                </p>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
