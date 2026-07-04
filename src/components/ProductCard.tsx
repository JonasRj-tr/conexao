import React from "react";
import { Product } from "../types";
import { formatCurrency } from "../utils";
import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const totalStock = (Object.values(product.stock) as number[]).reduce((a, b) => a + b, 0);
  const discountPercent = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#00f0ff]/50 hover:shadow-[0_0_25px_rgba(0,240,255,0.1)] transition-all duration-300 cursor-pointer h-full p-4"
    >
      {/* Product Image Wrapper */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#111] mb-3">
        <img
          src={product.images[0] || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600"}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105"
        />
        
        {/* Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {product.featured && (
            <span className="rounded-md bg-black/60 border border-white/10 px-2 py-1 text-[10px] font-bold text-[#00f0ff] uppercase tracking-wider">
              Destaque
            </span>
          )}
          {discountPercent > 0 && (
            <span className="rounded-md bg-fuchsia-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {totalStock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xs">
            <span className="rounded border border-red-500/30 bg-red-950/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a855f7]">
            {product.category}
          </p>
          
          <h3 className="mt-1 text-sm font-bold text-zinc-100 group-hover:text-[#00f0ff] transition-colors line-clamp-1 uppercase">
            {product.name}
          </h3>
        </div>

        {/* Bottom Call to Action and Pricing */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[#00f0ff] font-black text-base drop-shadow-[0_0_8px_rgba(0,240,255,0.2)]">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[10px] text-zinc-500 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            disabled={totalStock === 0}
            className={`px-3 py-2 rounded-lg transition-all text-xs font-bold flex items-center gap-1 ${
              totalStock === 0
                ? "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5"
                : "bg-white/10 text-white hover:bg-[#00f0ff] hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            }`}
          >
            <ShoppingBag className="h-3 w-3" />
            <span>{totalStock === 0 ? "Off" : "Ver"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
