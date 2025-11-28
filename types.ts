

export enum GroupageStatus {
  OPEN = 'Ouvert', // Commandes possibles
  CLOSED = 'Fermé', // Plus de commandes
  IN_TRANSIT = 'En Transit',
  ARRIVED = 'Arrivé', // Prêt pour livraison
  COMPLETED = 'Terminé'
}

export enum OrderStatus {
  PENDING = 'En Attente',
  CONFIRMED = 'Confirmé',
  READY = 'Prêt à livrer',
  DELIVERED = 'Livré',
  CANCELLED = 'Annulé'
}

export type Role = 'ADMIN' | 'ASSISTANT';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface SellingOption {
  unit: string;
  price: number;
  isDefault?: boolean; // L'unité préférée pour la vente
}

// Catalogue : Référence produit simplifiée
export interface Article {
  id: string;
  name: string;
  category: string; // Ex: Mode, Électronique
  description?: string; 
  imageUrl?: string; // "Photos"
}

export interface Product {
  id: string;
  groupageId: string;
  name: string;
  buyingPrice: number; // Prix d'achat en FCFA
  buyingUnit: string;
  costPrice: number; // Coût de revient total (Achat + Transport + Douane) en FCFA
  sellingPrice: number; // Prix de référence
  sellingOptions?: SellingOption[]; // Options multiples (Pièce, Carton, Douzaine...)
  customsFee: number;
  transportFee: number;
  quantityTotal: number;
  quantitySold: number;
  imageUrl: string;
  dateAdded?: string; // Date de l'achat
  supplier?: string; // Fournisseur (ex: Alibaba, Fournisseur A...)
}

export interface Groupage {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: GroupageStatus;
  minAdvanceAmount: number; // Montant minimum d'acompte (FCFA)
  isShippingIncluded: boolean; 
  originCountry: string;
  transportMode: string;
  estimatedTransportCost?: number; // Global estimé
  estimatedCustomsCost?: number; // Global estimé
  products: Product[];
}

export interface Client {
  id: string;
  name: string;
  phone: string; // Clé unique
  whatsapp?: string;
  city: string;
  address?: string; // Quartier ou adresse précise
  totalSpent: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number; // Le prix au moment de la vente
  unit: string; // L'unité choisie (Pièce, Carton...)
}

export interface Order {
  id: string;
  clientId: string;
  groupageId?: string; // Devenu optionnel car une commande peut contenir des produits de plusieurs groupages
  date: string;
  items: OrderItem[];
  totalAmount: number;
  advancePaid: number;
  balanceRemaining: number;
  status: OrderStatus;
  isDeliveryPaid: boolean;
  deliveryDriver?: string; // Nom du livreur
  deliveryNote?: string; // Instructions ou notes de livraison
  deliveryDate?: string; // Date effective de livraison
  paymentMethod?: string; // Mode de paiement du solde (Espèces, OM, etc.)
  deliveryFee?: number; // Frais de livraison
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'VENTE' | 'ACHAT_STOCK' | 'TRANSPORT' | 'DOUANE' | 'AUTRE';
  amount: number;
  description: string;
  referenceId?: string;
}

export interface AppData {
  articles: Article[];
  groupages: Groupage[];
  clients: Client[];
  orders: Order[];
  transactions: Transaction[];
}