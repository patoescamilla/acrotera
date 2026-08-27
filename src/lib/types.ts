export type Role = "customer" | "admin";
export type ProductStatus = "draft" | "active" | "archived";
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  image_path?: string | null;
  image_alt?: string | null;
};

export type SettingType = "text" | "textarea" | "boolean" | "money" | "url";

export type SiteSetting = {
  key: string;
  label: string;
  hint: string | null;
  type: SettingType;
  value: string | null;
  grupo: string;
  sort_order: number;
  updated_at: string;
};

export type SiteImage = {
  slot: string;
  label: string;
  hint: string | null;
  path: string | null;
  alt: string | null;
  sort_order: number;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  path: string;
  alt: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  currency: string;
  sku: string | null;
  stock: number;
  material: string | null;
  dimensions: string | null;
  care: string | null;
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  categories?: Pick<Category, "id" | "name" | "slug"> | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name_snapshot: string;
  price_cents: number;
  quantity: number;
  image_path: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  customer_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  notes: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  paid_at: string | null;
  created_at: string;
  order_items?: OrderItem[];
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string | null;
  quantity: number;
};
