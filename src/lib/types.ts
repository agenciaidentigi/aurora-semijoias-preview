export type Role = "customer" | "seller" | "admin" | "editor" | "analyst";
export type ProductStatus = "draft" | "pending_review" | "approved" | "rejected" | "published" | "archived";
export type SaleType = "internal" | "affiliate";
export type SellerStatus = "pending" | "under_review" | "approved" | "rejected" | "suspended";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  email_verified_at?: string | null;
  role: Role;
  roles: Role[];
  is_active: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  current_price: number | null;
  old_price: number | null;
  installments: string | null;
  discount_percent: number | null;
  material: string | null;
  plating: string | null;
  stone: string | null;
  color: string | null;
  sizes: string[] | null;
  main_image_url: string | null;
  badge: string | null;
  is_featured: boolean;
  is_new: boolean;
  is_promo: boolean;
  display_order: number;
  original_url: string | null;
  affiliate_url: string | null;
  estimated_commission: number | null;
  seo_title: string | null;
  seo_description: string | null;
  status: ProductStatus;
  category_id: string | null;
  subcategory_id: string | null;
  collection_id: string | null;
  affiliate_partner_id: string | null;
  seller_id?: string | null;
  store_id?: string | null;
  sale_type?: SaleType;
  stock_quantity?: number;
  approval_status?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminModule = {
  key: string;
  title: string;
  table: string;
  description: string;
  writeRoles: Role[];
  columns: { key: string; label: string; type?: "text" | "number" | "textarea" | "select" | "checkbox" | "url" | "email" | "color" | "date"; options?: string[] }[];
};
