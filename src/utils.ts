import { Order } from "./types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export interface CepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCep(cep: string): Promise<CepResult | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.erro) return null;
    return data as CepResult;
  } catch (error) {
    console.error("Error fetching CEP:", error);
    return null;
  }
}

export function generateOrderNumber(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CX-${randomNum}`;
}

export function formatWhatsAppMessage(order: Order, whatsappNumber: string): string {
  const cleanPhone = whatsappNumber.replace(/\D/g, "");
  
  let text = `⚡ *NOVO PEDIDO - CONEXÃO 011* ⚡\n`;
  text += `----------------------------------------\n`;
  text += `*Pedido:* #${order.orderNumber}\n`;
  text += `*Data:* ${new Date(order.createdAt).toLocaleDateString("pt-BR")} às ${new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `----------------------------------------\n\n`;
  
  text += `👤 *DADOS DO CLIENTE*\n`;
  text += `*Nome:* ${order.customer.name}\n`;
  text += `*WhatsApp:* ${order.customer.phone}\n\n`;
  
  text += `📍 *ENDEREÇO DE ENTREGA*\n`;
  text += `*CEP:* ${order.customer.cep}\n`;
  text += `*Rua:* ${order.customer.street}, Nº ${order.customer.number}\n`;
  if (order.customer.complement) {
    text += `*Compl:* ${order.customer.complement}\n`;
  }
  text += `*Bairro:* ${order.customer.neighborhood}\n`;
  text += `*Cidade/UF:* ${order.customer.city} - ${order.customer.state}\n\n`;
  
  text += `👕 *ITENS DO PEDIDO*\n`;
  order.items.forEach((item) => {
    text += `• ${item.quantity}x ${item.name} (${item.size}) - ${formatCurrency(item.price)} cada\n`;
  });
  text += `\n`;
  
  text += `💰 *RESUMO DO FINANCEIRO*\n`;
  text += `*Subtotal:* ${formatCurrency(order.subtotal)}\n`;
  const methodSuffix = order.shippingMethod ? ` (${order.shippingMethod})` : "";
  text += `*Frete:* ${order.shippingCost === 0 ? "GRÁTIS" : formatCurrency(order.shippingCost)}${methodSuffix}\n`;
  if (order.discount > 0) {
    text += `*Desconto:* -${formatCurrency(order.discount)}\n`;
  }
  text += `*TOTAL:* *${formatCurrency(order.total)}*\n\n`;
  
  text += `----------------------------------------\n`;
  text += `📱 _Pedido gerado pelo site Conexão 011_ \n`;
  text += `_Aguardando instruções para pagamento via Pix/Cartão._`;

  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export interface CorreiosRate {
  name: string;
  price: number;
  deliveryTime: string;
}

export function calculateCorreiosRates(uf: string, subtotal: number): { pac: CorreiosRate; sedex: CorreiosRate } {
  const cleanUf = uf.toUpperCase().trim();
  
  let pacPrice = 25.0;
  let sedexPrice = 45.0;
  let pacTime = "7 a 10 dias úteis";
  let sedexTime = "2 a 4 dias úteis";

  if (cleanUf === "SP") {
    pacPrice = 14.90;
    sedexPrice = 19.90;
    pacTime = "3 a 5 dias úteis";
    sedexTime = "1 a 2 dias úteis";
  } else if (["RJ", "MG", "ES"].includes(cleanUf)) {
    pacPrice = 21.90;
    sedexPrice = 32.90;
    pacTime = "5 a 7 dias úteis";
    sedexTime = "2 a 3 dias úteis";
  } else if (["PR", "SC", "RS"].includes(cleanUf)) {
    pacPrice = 23.90;
    sedexPrice = 36.90;
    pacTime = "5 a 8 dias úteis";
    sedexTime = "2 a 4 dias úteis";
  } else if (["DF", "GO", "MS", "MT"].includes(cleanUf)) {
    pacPrice = 26.90;
    sedexPrice = 39.90;
    pacTime = "6 a 9 dias úteis";
    sedexTime = "3 a 5 dias úteis";
  } else if (["BA", "PE", "CE", "RN", "PB", "AL", "SE", "PI", "MA"].includes(cleanUf)) {
    pacPrice = 29.90;
    sedexPrice = 48.90;
    pacTime = "7 a 11 dias úteis";
    sedexTime = "3 a 5 dias úteis";
  } else if (["AM", "PA", "AC", "RO", "RR", "TO", "AP"].includes(cleanUf)) {
    pacPrice = 34.90;
    sedexPrice = 58.90;
    pacTime = "8 a 14 dias úteis";
    sedexTime = "4 a 7 dias úteis";
  }

  // Free shipping above R$ 350 for PAC, or discount R$ 25 off SEDEX!
  if (subtotal >= 350) {
    pacPrice = 0;
    sedexPrice = Math.max(0, sedexPrice - 25);
  }

  return {
    pac: { name: "PAC (Correios)", price: pacPrice, deliveryTime: pacTime },
    sedex: { name: "SEDEX (Correios)", price: sedexPrice, deliveryTime: sedexTime }
  };
}
