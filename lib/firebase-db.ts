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

// ==========================================
// ORDERS — READ
// ==========================================

export async function getOrders(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, 'orders'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
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
