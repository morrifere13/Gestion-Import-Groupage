
import { AppData, GroupageStatus, OrderStatus } from './types';

export const MOCK_DATA: AppData = {
  articles: [
    {
      id: 'a1', name: 'Sac à main Luxe', category: 'Mode & Accessoires', description: 'Cuir véritable, finition dorée',
      imageUrl: 'https://picsum.photos/200/200?random=1'
    },
    {
      id: 'a2', name: 'Montre Connectée', category: 'Électronique', description: 'Série 8 Ultra, étanche',
      imageUrl: 'https://picsum.photos/200/200?random=2'
    },
    {
      id: 'a3', name: 'Talon Aiguille Rouge', category: 'Chaussures', description: 'Taille 38-42, Velours',
      imageUrl: 'https://picsum.photos/200/200?random=3'
    },
    {
      id: 'a4', name: 'Tissu Bazin Riche', category: 'Textile & Tissus', description: 'Qualité supérieure, 5 yards',
      imageUrl: 'https://picsum.photos/200/200?random=4'
    }
  ],
  groupages: [
    {
      id: 'g1', name: 'Chine Octobre', startDate: '2025-10-01', endDate: '2025-10-30',
      status: GroupageStatus.ARRIVED, minAdvanceAmount: 5000, isShippingIncluded: false,
      originCountry: 'Chine', transportMode: 'Bateau', estimatedTransportCost: 500000, estimatedCustomsCost: 200000,
      products: [
        { 
          id: 'p1', groupageId: 'g1', name: 'Sac à main Luxe', buyingPrice: 4500, buyingUnit: 'Pièce',
          costPrice: 6000, sellingPrice: 12000, 
          sellingOptions: [{unit: 'Pièce', price: 12000, isDefault: true}, {unit: 'Douzaine', price: 130000}],
          customsFee: 500, transportFee: 1250, quantityTotal: 50, quantitySold: 45, 
          imageUrl: 'https://picsum.photos/200/200?random=1',
          dateAdded: '2025-10-02', supplier: 'Guangzhou Bags'
        },
        { 
          id: 'p3', groupageId: 'g1', name: 'Montre Connectée', buyingPrice: 7000, buyingUnit: 'Pièce',
          costPrice: 9000, sellingPrice: 18000, 
          sellingOptions: [{unit: 'Pièce', price: 18000, isDefault: true}],
          customsFee: 800, transportFee: 1000, quantityTotal: 100, quantitySold: 20, 
          imageUrl: 'https://picsum.photos/200/200?random=2',
          dateAdded: '2025-10-05', supplier: 'Shenzhen Tech'
        }
      ]
    },
    {
      id: 'g2', name: 'Dubai Express Nov', startDate: '2025-11-01', endDate: '2025-11-15',
      status: GroupageStatus.OPEN, minAdvanceAmount: 10000, isShippingIncluded: true,
      originCountry: 'Dubaï', transportMode: 'Avion', estimatedTransportCost: 0, estimatedCustomsCost: 0,
      products: []
    }
  ],
  clients: [
    { id: 'c1', name: 'Amina Diallo', phone: '90112233', whatsapp: '90112233', city: 'Niamey', address: 'Quartier Plateau, Rue 12', totalSpent: 150000 },
    { id: 'c2', name: 'Moussa Koné', phone: '99887766', whatsapp: '', city: 'Maradi', address: 'Grand Marché, Boutique 45', totalSpent: 45000 },
  ],
  orders: [
    { 
      id: 'o1', clientId: 'c1', groupageId: 'g1', date: '2025-10-15', 
      items: [{ productId: 'p1', quantity: 2, unitPrice: 12000, unit: 'Pièce' }], 
      totalAmount: 24000, advancePaid: 7200, balanceRemaining: 0, status: OrderStatus.DELIVERED, isDeliveryPaid: true,
      deliveryFee: 2000, deliveryDriver: 'Ali Moto', deliveryDate: '2025-10-16'
    },
    {
      id: 'o2', clientId: 'c2', groupageId: 'g1', date: '2025-10-16',
      items: [{ productId: 'p1', quantity: 5, unitPrice: 12000, unit: 'Pièce' }], 
      totalAmount: 60000, advancePaid: 18000, balanceRemaining: 42000, status: OrderStatus.READY, isDeliveryPaid: false
    },
    {
      id: 'o3', clientId: 'c1', groupageId: 'g1', date: '2025-10-20',
      items: [{ productId: 'p3', quantity: 1, unitPrice: 18000, unit: 'Pièce' }], 
      totalAmount: 18000, advancePaid: 18000, balanceRemaining: 0, status: OrderStatus.READY, isDeliveryPaid: false
    }
  ],
  transactions: [
    { id: 't1', date: '2025-10-01', type: 'EXPENSE', category: 'ACHAT_STOCK', amount: 500000, description: 'Achat Stock Chine' },
    { id: 't2', date: '2025-10-15', type: 'INCOME', category: 'VENTE', amount: 7200, description: 'Acompte Amina' },
  ]
};