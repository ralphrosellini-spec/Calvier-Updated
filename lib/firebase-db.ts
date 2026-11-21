import { db } from './firebase';
import {
  collection, getDocs, doc, getDoc, query, where, limit, onSnapshot,
  addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import type { Product, Collection, Category, Order, Testimonial } from '@/types';

// ==========================================
// PRODUCTS — READ
// ==========================================

export async function getProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Product;
  return null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(collection(db, 'products'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }
  return null;
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const q = query(collection(db, 'products'), where('categoryId', '==', categoryId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getProductsByCollection(collectionId: string): Promise<Product[]> {
  const q = query(collection(db, 'products'), where('collectionId', '==', collectionId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const q = query(collection(db, 'products'), where('isFeatured', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

// ==========================================
// PRODUCTS — WRITE
// ==========================================

export async function addProduct(data: Omit<Product, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const productRef = doc(db, 'products', id);
  await updateDoc(productRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

// ==========================================
// COLLECTIONS — READ
// ==========================================

export async function getCollections(): Promise<Collection[]> {
  const snapshot = await getDocs(collection(db, 'collections'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const q = query(collection(db, 'collections'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Collection;
  }
  return null;
}

// ==========================================
// CATEGORIES — READ
// ==========================================

export async function getCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, 'categories'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
}

// ==========================================
// TESTIMONIALS — READ
// ==========================================

export async function getTestimonials(): Promise<Testimonial[]> {
  const snapshot = await getDocs(collection(db, 'testimonials'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
}

// ==========================================
// TESTIMONIALS — WRITE
// ==========================================

export async function addTestimonial(data: Omit<Testimonial, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'testimonials'), data);
  return ref.id;
}

export async function deleteTestimonial(id: string): Promise<void> {
  await deleteDoc(doc(db, 'testimonials', id));
}

// Real-time listener for products (Admin)
export function subscribeToProducts(callback: (products: Product[]) => void) {
  return onSnapshot(collection(db, 'products'), (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    callback(products);
  });
}

// ==========================================
// ORDERS — READ
// ==========================================

export async function getOrders(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, 'orders'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const docRef = doc(db, 'orders', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Order;
  return null;
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

// Real-time listener for orders (Admin)
export function subscribeToOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(collection(db, 'orders'), (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    callback(orders);
  });
}

// ==========================================
// ORDERS — WRITE
// ==========================================

export async function createOrder(data: Omit<Order, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
  await updateDoc(doc(db, 'orders', id), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, 'orders', id));
}

// ==========================================
// SITE CONTENT
// ==========================================

export async function getSiteContent(docId: string): Promise<Record<string, unknown> | null> {
  const docRef = doc(db, 'site_content', docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as Record<string, unknown>;
  return null;
}

export async function setSiteContent(docId: string, data: Record<string, unknown>): Promise<void> {
  await setDoc(doc(db, 'site_content', docId), data);
}

// ==========================================
// USER PROFILE
// ==========================================

export async function getUserProfile(uid: string): Promise<Record<string, unknown> | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as Record<string, unknown>;
  return null;
}

export async function createOrUpdateUserProfile(
  uid: string,
  data: Record<string, unknown>
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ==========================================
// ADMIN CUSTOMERS AGGREGATION
// ==========================================

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  lastSeen?: string;
  orders: Order[];
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  try {
    const [ordersSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'users'))
    ]);

    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    const usersMap = new Map<string, Record<string, unknown>>();
    usersSnap.docs.forEach(d => usersMap.set(d.id, { id: d.id, ...d.data() }));

    const customerMap = new Map<string, AdminCustomer>();

    orders.forEach(order => {
      const email = (order.shippingAddress?.email || order.userId || 'guest').toLowerCase();
      const existing = customerMap.get(email);
      const orderTotal = Number(order.total) || 0;
      const orderDate = order.createdAt || new Date().toISOString();
      const city = order.shippingAddress?.city || 'Unknown';
      const name = order.shippingAddress?.name || 'Customer';

      if (!existing) {
        customerMap.set(email, {
          id: order.userId || email,
          name,
          email,
          city,
          totalOrders: 1,
          totalSpent: orderTotal,
          lastOrderDate: orderDate,
          lastSeen: orderDate,
          orders: [order]
        });
      } else {
        existing.totalOrders += 1;
        existing.totalSpent += orderTotal;
        existing.orders.push(order);
        if (new Date(orderDate) > new Date(existing.lastOrderDate || 0)) {
          existing.lastOrderDate = orderDate;
          existing.lastSeen = orderDate;
          if (name !== 'Customer') existing.name = name;
          if (city !== 'Unknown') existing.city = city;
        }
      }
    });

    return Array.from(customerMap.values());
  } catch (err) {
    console.error('Failed to get admin customers:', err);
    return [];
  }
}

// ==========================================
// ADMIN USER MANAGEMENT & ACCESS CONTROL
// ==========================================

export const MASTER_ADMIN_EMAIL = 'cavaxioglobals@gmail.com';
export const MASTER_ADMIN_EMAILS = [
  'cavaxioglobals@gmail.com',
  'ralph.rosellini@gmail.com',
];

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return MASTER_ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'master_admin' | 'super_admin' | 'admin' | 'manager';
  active: boolean;
  addedBy?: string;
  addedAt: string;
  isMaster?: boolean;
}

export async function getAdmins(): Promise<AdminUser[]> {
  try {
    const snapshot = await getDocs(collection(db, 'admins'));
    const list: AdminUser[] = [];
    const foundEmails = new Set<string>();

    snapshot.docs.forEach((d) => {
      const data = d.data();
      const email = (data.email || d.id || '').toLowerCase();
      if (data.active !== false) {
        const isMaster = isMasterAdminEmail(email);
        if (isMaster) foundEmails.add(email);
        list.push({
          id: d.id,
          email,
          name: data.name || (email === 'cavaxioglobals@gmail.com' ? 'Cavaxio Admin' : isMaster ? 'Ralph Rosellini' : email.split('@')[0]),
          role: isMaster ? 'master_admin' : (data.role || 'admin'),
          active: true,
          addedBy: data.addedBy || 'System',
          addedAt: data.addedAt || new Date().toISOString(),
          isMaster,
        });
      }
    });

    // Always include Master Admin (cavaxioglobals@gmail.com) even if not yet saved in Firestore
    MASTER_ADMIN_EMAILS.forEach((masterEmail) => {
      if (!foundEmails.has(masterEmail.toLowerCase())) {
        list.unshift({
          id: masterEmail.toLowerCase(),
          email: masterEmail.toLowerCase(),
          name: masterEmail === 'cavaxioglobals@gmail.com' ? 'Cavaxio Admin' : 'Ralph Rosellini',
          role: 'master_admin',
          active: true,
          addedBy: 'System Pre-configured',
          addedAt: new Date().toISOString(),
          isMaster: true,
        });
      }
    });

    return list;
  } catch (err) {
    console.error('Failed to fetch admins:', err);
    return [
      {
        id: MASTER_ADMIN_EMAIL.toLowerCase(),
        email: MASTER_ADMIN_EMAIL.toLowerCase(),
        name: 'Cavaxio Admin',
        role: 'master_admin',
        active: true,
        addedBy: 'System Pre-configured',
        addedAt: new Date().toISOString(),
        isMaster: true,
      },
    ];
  }
}

export function subscribeToAdmins(callback: (admins: AdminUser[]) => void) {
  return onSnapshot(collection(db, 'admins'), (snapshot) => {
    const list: AdminUser[] = [];
    const foundEmails = new Set<string>();

    snapshot.docs.forEach((d) => {
      const data = d.data();
      const email = (data.email || d.id || '').toLowerCase();
      if (data.active !== false) {
        const isMaster = isMasterAdminEmail(email);
        if (isMaster) foundEmails.add(email);
        list.push({
          id: d.id,
          email,
          name: data.name || (email === 'cavaxioglobals@gmail.com' ? 'Cavaxio Admin' : isMaster ? 'Ralph Rosellini' : email.split('@')[0]),
          role: isMaster ? 'master_admin' : (data.role || 'admin'),
          active: true,
          addedBy: data.addedBy || 'System',
          addedAt: data.addedAt || new Date().toISOString(),
          isMaster,
        });
      }
    });

    MASTER_ADMIN_EMAILS.forEach((masterEmail) => {
      if (!foundEmails.has(masterEmail.toLowerCase())) {
        list.unshift({
          id: masterEmail.toLowerCase(),
          email: masterEmail.toLowerCase(),
          name: masterEmail === 'cavaxioglobals@gmail.com' ? 'Cavaxio Admin' : 'Ralph Rosellini',
          role: 'master_admin',
          active: true,
          addedBy: 'System Pre-configured',
          addedAt: new Date().toISOString(),
          isMaster: true,
        });
      }
    });

    callback(list);
  });
}

export async function addAdminEmail(
  email: string,
  role: 'super_admin' | 'admin' | 'manager' = 'admin',
  name?: string,
  addedBy?: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Invalid email address');
  }

  await setDoc(
    doc(db, 'admins', normalizedEmail),
    {
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0],
      role,
      active: true,
      addedBy: addedBy || 'Admin',
      addedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function removeAdminEmail(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (isMasterAdminEmail(normalizedEmail)) {
    throw new Error('The master administrator account cannot be removed.');
  }

  // Delete from admins collection
  await deleteDoc(doc(db, 'admins', normalizedEmail));
}

export async function syncUserProfile(
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    phoneNumber?: string | null;
  },
  isAdmin: boolean
): Promise<void> {
  if (!user.uid) return;

  try {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);

    const nameParts = (user.displayName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload: Record<string, unknown> = {
      id: user.uid,
      uid: user.uid,
      email: (user.email || '').toLowerCase(),
      displayName: user.displayName || user.email || 'Customer',
      firstName,
      lastName,
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      role: isAdmin ? 'admin' : 'customer',
      lastLoginAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      payload.createdAt = new Date().toISOString();
      payload.addresses = [];
      payload.wishlist = [];
      payload.orders = [];
    }

    await setDoc(userRef, payload, { merge: true });
  } catch (err) {
    console.error('Error syncing user profile to Firestore users folder:', err);
  }
}


