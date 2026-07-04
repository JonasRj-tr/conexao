import React from "react";
import { ShoppingBag, User, Instagram, MapPin } from "lucide-react";
import { StoreSettings } from "../types";

interface NavbarProps {
  settings: StoreSettings | null;
  cartCount: number;
  onOpenCart: () => void;
  onScrollToCatalog: () => void;
}

export default function Navbar({
  settings,
  cartCount,
  onOpenCart,
  onScrollToCatalog,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo / Branding */}
        <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img 
            src="https://i.postimg.cc/FsT6QcTQ/Chat-GPT-Image-4-de-jul-de-2026-17-38-08.png" 
            alt="Conexão 011" 
            className="h-12 sm:h-16 w-auto object-contain transition-transform hover:scale-105 duration-250"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Navigation Center links (desktop) */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-widest text-zinc-300">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="hover:text-[#a855f7] transition-colors border-b-2 border-transparent hover:border-[#a855f7]/30 pb-1"
          >
            Início
          </button>
          <button 
            onClick={onScrollToCatalog}
            className="hover:text-[#a855f7] transition-colors border-b-2 border-transparent hover:border-[#a855f7]/30 pb-1"
          >
            Coleções
          </button>
          {settings?.instagram && (
            <a 
              href={`https://instagram.com/${settings.instagram.replace("@", "")}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 hover:text-[#a855f7] transition-colors border-b-2 border-transparent hover:border-[#a855f7]/30 pb-1"
            >
              <Instagram className="h-4 w-4" />
              <span>{settings.instagram}</span>
            </a>
          )}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-4">
          
          {/* Shipping highlight banner on desktop */}
          <div className="hidden lg:flex items-center space-x-1 text-xs text-zinc-400">
            <MapPin className="h-3 w-3 text-[#00f0ff]" />
            <span>Enviamos para todo o Brasil 🇧🇷</span>
          </div>

          {/* Cart Icon with badge */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 px-4 py-2.5 rounded-full text-zinc-200 hover:bg-[#00f0ff]/20 hover:border-[#00f0ff]/50 transition-all cursor-pointer group"
          >
            <ShoppingBag className="h-4 w-4 text-[#00f0ff] group-hover:scale-105 transition-transform" />
            <span className="hidden sm:inline text-xs font-black uppercase tracking-widest text-[#00f0ff]">Carrinho</span>
            <span className="bg-[#00f0ff] text-black text-[10px] px-1.5 py-0.5 rounded-full font-black min-w-[18px] text-center">
              {cartCount}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
