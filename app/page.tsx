"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Heart, MapPin, Minus, Plus, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

const STORE_CONFIG = {
  whatsappNumber: "",
  instagramUrl: "https://www.instagram.com/deseos.y.tesoros/",
  currency: "DOP",
  locale: "es-DO",
};

type Product = {
  id: string;
  name: string;
  category: "Joyería" | "Portacredenciales" | "Llaveros" | "Organizadores";
  description: string;
  price: number | null;
  image: string;
  position: string;
  detailImage?: string;
  variants?: { label: string; options: string[] };
};

const PRODUCTS: Product[] = [
  { id: "joyero-floral", name: "Joyero floral", category: "Organizadores", description: "Caja decorativa para guardar anillos, dijes y pequeños tesoros.", price: null, image: "/brand/catalogo-b.jpeg", position: "100% 20%", variants: { label: "Acabado", options: ["Flores rosadas", "Detalles dorados"] } },
  { id: "portacredencial-floral", name: "Portacredencial floral", category: "Portacredenciales", description: "Retráctil redondo con diseño floral y clip posterior.", price: null, image: "/brand/catalogo-b.jpeg", position: "50% 38%", detailImage: "/brand/portacredencial-floral-azul.jpeg", variants: { label: "Diseño", options: ["Floral azul", "Floral durazno", "Floral rojo"] } },
  { id: "cinta-portacredencial", name: "Cinta portacredencial", category: "Portacredenciales", description: "Cinta con porta tarjeta y enganche metálico para llevar tus credenciales.", price: null, image: "/brand/catalogo-b.jpeg", position: "0% 57%", variants: { label: "Diseño", options: ["Cerezas", "Lazo rosa"] } },
  { id: "llavero-cubos", name: "Llavero cubos pastel", category: "Llaveros", description: "Llavero compacto con cubos en tonos pastel y herraje metálico.", price: null, image: "/brand/catalogo-b.jpeg", position: "50% 57%" },
  { id: "llavero-estrellas", name: "Llavero de estrellas", category: "Llaveros", description: "Accesorio transparente con estrellas y detalles en blanco.", price: null, image: "/brand/catalogo-b.jpeg", position: "100% 57%" },
  { id: "llavero-auriculares", name: "Llavero auriculares", category: "Llaveros", description: "Diseño llamativo en tonos celestes con detalles colgantes.", price: null, image: "/brand/catalogo-b.jpeg", position: "0% 75%" },
  { id: "alhajero-plateado", name: "Alhajero clásico", category: "Organizadores", description: "Caja ornamental plateada para conservar accesorios pequeños.", price: null, image: "/brand/catalogo-b.jpeg", position: "50% 75%" },
  { id: "collar-floral", name: "Collar floral", category: "Joyería", description: "Cadena fina con dije floral, ideal para usar todos los días.", price: null, image: "/brand/perfil.jpeg", position: "100% 94%" },
];

type CartItem = { key: string; productId: string; variant: string; quantity: number };

function InstagramGlyph({ size = 18 }: { size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>;
}

function ProductImage({ product, hero = false }: { product: Product; hero?: boolean }) {
  const image = product.detailImage || product.image;
  const style = product.detailImage
    ? { backgroundImage: `url(${image})`, backgroundSize: "100% auto", backgroundPosition: "center 48%" }
    : { backgroundImage: `url(${image})`, backgroundSize: "300% auto", backgroundPosition: product.position };
  return <div role="img" aria-label={`Fotografía real de ${product.name}`} className={hero ? "product-image hero-product-image" : "product-image"} style={style} />;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(STORE_CONFIG.locale, { style: "currency", currency: STORE_CONFIG.currency, maximumFractionDigits: 0 }).format(value);
}

function priceText(product: Product, quantity = 1) {
  return product.price === null ? "Precio a confirmar" : formatMoney(product.price * quantity);
}

export default function Home() {
  const [category, setCategory] = useState("Todos");
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("deseos-y-tesoros-cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {
      window.localStorage.removeItem("deseos-y-tesoros-cart");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("deseos-y-tesoros-cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    setSelectedVariant(selected?.variants?.options[0] || "");
    setQuantity(1);
  }, [selected]);

  useEffect(() => {
    type ToolInput = { productId?: string; variant?: string; quantity?: number };
    type ModelContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: ToolInput) => object }) => void | Promise<void> };
    const context = (document as unknown as { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "stage_catalog_item",
        title: "Agregar producto al carrito",
        description: "Agrega una cantidad de un producto real al carrito visible. No confirma ni envía el pedido.",
        inputSchema: {
          type: "object",
          properties: {
            productId: { type: "string", enum: PRODUCTS.map((product) => product.id) },
            variant: { type: "string" },
            quantity: { type: "integer", minimum: 1, maximum: 20 },
          },
          required: ["productId", "quantity"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          const product = PRODUCTS.find((item) => item.id === input.productId);
          if (!product) throw new Error("Producto no encontrado");
          const amount = Number(input.quantity);
          if (!Number.isInteger(amount) || amount < 1 || amount > 20) throw new Error("Cantidad inválida");
          const variant = input.variant || "";
          if (product.variants && !product.variants.options.includes(variant)) throw new Error("Elegí una variante válida");
          addToCart(product, variant, amount);
          return { staged: true, productId: product.id, variant, quantity: amount };
        },
      })).catch(() => undefined);
    } catch {
      return;
    }
    return () => lifecycle.abort();
  }, []);

  const categories = ["Todos", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];
  const filtered = category === "Todos" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasUnknownPrices = cart.some((item) => PRODUCTS.find((p) => p.id === item.productId)?.price === null);
  const total = cart.reduce((sum, item) => {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);
  const detailedCart = useMemo(() => cart.map((item) => ({ ...item, product: PRODUCTS.find((p) => p.id === item.productId)! })), [cart]);

  function addToCart(product: Product, variant = "", amount = 1) {
    if (product.variants && !variant) { setSelected(product); return; }
    const key = `${product.id}::${variant}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + amount } : item);
      return [...current, { key, productId: product.id, variant, quantity: amount }];
    });
    toast.success(`${product.name} se agregó al carrito`);
  }

  function updateQuantity(key: string, next: number) {
    if (next < 1) return;
    setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: next } : item));
  }

  function removeItem(key: string) {
    setCart((current) => current.filter((item) => item.key !== key));
  }

  function sendWhatsApp() {
    if (!cart.length) { toast.error("Agregá al menos un producto antes de enviar el pedido."); return; }
    if (!STORE_CONFIG.whatsappNumber) { toast.error("El número de WhatsApp todavía no fue configurado."); return; }
    const lines = detailedCart.map(({ product, quantity: amount, variant }) => `• ${amount} × ${product.name}${variant ? ` — ${variant}` : ""} — ${priceText(product, amount)}`);
    const totalText = hasUnknownPrices ? "A confirmar" : formatMoney(total);
    const message = `¡Hola! Quiero consultar por este pedido:\n${lines.join("\n")}\nTotal de productos: ${totalText}\n¿Me confirman disponibilidad y cómo coordinar el pago y la entrega?`;
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  const heroProduct = PRODUCTS[0];
  return (
    <main>
      <Toaster position="top-center" richColors />
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Deseos y Tesoros, inicio"><span className="brand-mark"><Sparkles size={16} /></span><span><strong>Deseos y Tesoros</strong><small>Jewelry & Beauty</small></span></a>
        <nav aria-label="Navegación principal"><a href="#productos">Productos</a><a href="#marca">La marca</a><a href="#contacto">Contacto</a></nav>
        <div className="header-actions">
          <a className="icon-button" href={STORE_CONFIG.instagramUrl} target="_blank" rel="noreferrer" aria-label="Abrir Instagram"><InstagramGlyph size={19} /></a>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild><button className="cart-button" aria-label={`Abrir carrito, ${itemCount} productos`}><ShoppingBag size={19} /><span>Carrito</span><b>{itemCount}</b></button></SheetTrigger>
            <CartSheet items={detailedCart} total={total} unknownPrices={hasUnknownPrices} onUpdate={updateQuantity} onRemove={removeItem} onSend={sendWhatsApp} />
          </Sheet>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy"><p className="eyebrow"><span /> Accesorios elegidos con intención</p><h1>Pequeños tesoros que hablan de vos.</h1><p className="hero-text">Joyería y accesorios personales para regalar, coleccionar y llevar cada día.</p><div className="hero-actions"><a className="primary-button" href="#productos">Ver productos <ChevronDown size={17} /></a><span><MapPin size={16} /> Santo Domingo, R. D.</span></div></div>
        <div className="hero-visual"><div className="hero-frame"><ProductImage product={heroProduct} hero /></div><div className="hero-note"><Heart size={16} fill="currentColor" /><span>Detalles que se vuelven<br />parte de tu historia.</span></div><span className="hero-flower">✿</span></div>
      </section>

      <section className="catalog-section" id="productos">
        <div className="section-heading"><div><p className="eyebrow"><span /> Catálogo</p><h2>Encontrá tu próximo tesoro</h2></div><p>Elegí tus favoritos y armá el pedido. La disponibilidad, el pago y la entrega se confirman por WhatsApp.</p></div>
        <div className="category-list" aria-label="Filtrar por categoría">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}</div>
        <div className="product-grid">{filtered.map((product) => <article className="product-card" key={product.id}><button className="product-photo" onClick={() => setSelected(product)} aria-label={`Ver ${product.name}`}><ProductImage product={product} /><span>Ver detalle</span></button><div className="product-info"><p>{product.category}</p><h3>{product.name}</h3><strong>{priceText(product)}</strong><button onClick={() => product.variants ? setSelected(product) : addToCart(product)}><ShoppingBag size={17} /> Agregar al carrito</button></div></article>)}</div>
      </section>

      <section className="brand-story" id="marca"><div className="story-mark"><span>✦</span><strong>D&amp;T</strong><small>Desde Santo Domingo</small></div><div><p className="eyebrow light"><span /> Nuestra esencia</p><h2>Accesorios para guardar, usar y regalar.</h2></div><p>Deseos y Tesoros es una tienda virtual de belleza y accesorios personales. Cada pieza se presenta con cuidado para que encontrar un detalle especial sea simple.</p></section>

      <footer id="contacto"><div className="footer-brand"><strong>Deseos y Tesoros</strong><span>Jewelry & Beauty</span></div><div><p>¿Querés consultar por un producto?</p><a href={STORE_CONFIG.instagramUrl} target="_blank" rel="noreferrer"><InstagramGlyph /> @deseos.y.tesoros</a></div><div><p>Ubicación</p><span>Santo Domingo, República Dominicana</span></div><small>Los pedidos se confirman personalmente por WhatsApp.</small></footer>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && <DialogContent className="product-dialog" aria-describedby="product-description"><div className="dialog-photo"><ProductImage product={selected} hero /></div><div className="dialog-copy"><DialogHeader><p className="dialog-category">{selected.category}</p><DialogTitle>{selected.name}</DialogTitle><DialogDescription id="product-description">{selected.description}</DialogDescription></DialogHeader><strong className="dialog-price">{priceText(selected)}</strong>{selected.variants && <fieldset className="variant-field"><legend>{selected.variants.label}</legend><div>{selected.variants.options.map((option) => <button key={option} className={selectedVariant === option ? "selected" : ""} onClick={() => setSelectedVariant(option)}>{selectedVariant === option && <Check size={14} />} {option}</button>)}</div></fieldset>}<div className="dialog-bottom"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Quitar uno"><Minus size={17} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Agregar uno"><Plus size={17} /></button></div><button className="dialog-add" onClick={() => { addToCart(selected, selectedVariant, quantity); setSelected(null); }}>Agregar <ShoppingBag size={17} /></button></div><p className="availability-note">Disponibilidad, pago y entrega se coordinan por WhatsApp.</p></div></DialogContent>}
      </Dialog>
      <button className="mobile-cart" onClick={() => setCartOpen(true)} aria-label={`Abrir carrito, ${itemCount} productos`}><ShoppingBag size={19} /><span>Ver carrito</span><b>{itemCount}</b></button>
    </main>
  );
}

function CartSheet({ items, total, unknownPrices, onUpdate, onRemove, onSend }: { items: Array<CartItem & { product: Product }>; total: number; unknownPrices: boolean; onUpdate: (key: string, quantity: number) => void; onRemove: (key: string) => void; onSend: () => void; }) {
  return <SheetContent className="cart-sheet"><SheetHeader className="cart-header"><SheetTitle>Tu selección</SheetTitle><SheetDescription>Revisá los productos antes de consultar.</SheetDescription></SheetHeader><div className="cart-items">{!items.length ? <div className="empty-cart"><ShoppingBag size={30} /><h3>Tu carrito está vacío</h3><p>Explorá el catálogo y agregá tus favoritos.</p></div> : items.map(({ product, key, quantity, variant }) => <article className="cart-item" key={key}><div className="cart-thumb"><ProductImage product={product} /></div><div className="cart-item-copy"><h3>{product.name}</h3>{variant && <p>{variant}</p>}<strong>{priceText(product, quantity)}</strong><div className="cart-item-actions"><div className="quantity-control small"><button onClick={() => onUpdate(key, quantity - 1)} disabled={quantity === 1} aria-label="Quitar uno"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => onUpdate(key, quantity + 1)} aria-label="Agregar uno"><Plus size={15} /></button></div><button className="remove-button" onClick={() => onRemove(key)} aria-label={`Eliminar ${product.name}`}><Trash2 size={16} /></button></div></div></article>)}</div><SheetFooter className="cart-footer"><div className="total-row"><span>Total de productos</span><strong>{items.length ? (unknownPrices ? "A confirmar" : formatMoney(total)) : formatMoney(0)}</strong></div><button className="whatsapp-button" onClick={onSend} disabled={!items.length || !STORE_CONFIG.whatsappNumber}>Enviar pedido por WhatsApp</button>{!STORE_CONFIG.whatsappNumber && <p>WhatsApp pendiente de configuración.</p>}<small>Enviar la consulta no confirma el pedido ni vacía el carrito.</small></SheetFooter></SheetContent>;
}
