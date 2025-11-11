export type UserRole = 'CUSTOMER' | 'ADMIN' | 'POS';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  products?: Product[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  images: string[];
  featured: boolean;
  categoryId: number;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  product: Product;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
  total: number;
  createdAt: Date;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  user?: User;
  addressId: number;
  address?: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: number;
  userId: number;
  user?: User;
  productId: number;
  product?: Product;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}
