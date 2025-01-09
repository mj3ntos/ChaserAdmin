'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ProductModal } from '@/components/ProductModal';
import { v4 as uuidv4 } from 'uuid';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  offerPercentage?: number;
  description?: string;
  colors?: number[];
  sizes?: string[];
  images: string[];
}

export default function Dashboard() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        router.push('/login');
      } else {
        fetchProducts();
      }
    }
  }, [user, authLoading, isAdmin]);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'Products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Błąd podczas pobierania produktów');
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData: Omit<Product, 'id'>, files: File[]) => {
    try {
      // Upload images
      const imageUrls = await Promise.all(
        files.map(async file => {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );

      const productId = uuidv4()

      const newProduct = {
        id: productId,
        ...productData,
        images: imageUrls,
      };

      const docRef = await addDoc(collection(db, 'Products'), {
        id: productId,
        ...productData,
        images: imageUrls
      })
      // await addDoc(collection(db, 'Products', productId), newProduct);
      await fetchProducts();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Błąd podczas dodawania produktu');
    }
  };

  const handleUpdateProduct = async (productId: string, productData: Partial<Product>, files: File[]) => {
    try {
      const productRef = doc(db, 'Products', productId);
      
      // Znajdź aktualny produkt w stanie
      const currentProduct = products.find(p => p.id === productId);
      if (!currentProduct) {
        throw new Error('Product not found');
      }
      
      // Zachowaj istniejące obrazy i dodaj nowe
      let imageUrls = [...(currentProduct.images || [])];
      
      // Dodaj nowe obrazy jeśli są
      if (files.length > 0) {
        const newImageUrls = await Promise.all(
          files.map(async file => {
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            return getDownloadURL(storageRef);
          })
        );
        imageUrls = [...imageUrls, ...newImageUrls];
      }
  
      // Przygotuj dane do aktualizacji
      const updateData = {
        name: productData.name,
        category: productData.category,
        price: Number(productData.price),
        offerPercentage: productData.offerPercentage ? Number(productData.offerPercentage) : 0,
        description: productData.description || '',
        colors: productData.colors || [],
        sizes: productData.sizes || [],
        images: imageUrls,
      };
  
      // Aktualizuj dokument
      await updateDoc(productRef, updateData);
      await fetchProducts(); // Odśwież listę produktów
      setEditingProduct(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Błąd podczas aktualizacji produktu');
    }
  };

  const handleDeleteProduct = async (productId: string, imageUrls: string[]) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten produkt?')) {
      try {
        // Delete images from storage
        await Promise.all(
          imageUrls.map(async url => {
            try {
              const imageRef = ref(storage, url);
              await deleteObject(imageRef);
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          })
        );

        // Delete product document
        await deleteDoc(doc(db, 'Products', productId));
        await fetchProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Błąd podczas usuwania produktu');
      }
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Ładowanie...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const getColorDisplay = (colorNumber: number) => {
    // Opcjonalnie - możesz dodać konwersję liczby na format koloru
    return `#${Math.abs(colorNumber).toString(16).padStart(6, '0')}`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel Produktów</h1>
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Wyszukaj produkt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 whitespace-nowrap"
          >
            Dodaj Produkt
          </button>
        </div>
      </div>

      {searchTerm && (
      <div className="mb-4 text-gray-600">
        Znaleziono {filteredProducts.length} produktów dla "{searchTerm}"
      </div>
    )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 shadow">
            {product.images && product.images.length > 0 && (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-48 object-cover mb-4 rounded"
              />
            )}
            <h3 className="text-xl font-bold">{product.name}</h3>
            <p className="text-gray-600">{product.category}</p>
            <p className="text-lg font-semibold">{product.price} zł</p>
            {product.offerPercentage && (
              <p className="text-green-600">
                Zniżka: {product.offerPercentage}%
              </p>
            )}
            {product.colors && product.colors.length > 0 && (
              <div className="flex gap-2 mt-2">
                {product.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: getColorDisplay(color) }}
                    title={`Color: ${color}`}
                  />
                ))}
              </div>
            )}
            {product.description && (
              <p className="text-gray-700 mt-2">{product.description}</p>
            )}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setIsModalOpen(true);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Edytuj
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id, product.images)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
      <div className="text-center py-10 text-gray-500">
        {searchTerm ? 'Nie znaleziono produktów' : 'Brak produktów'}
      </div>
    )}

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={editingProduct ? 
            (data, files) => handleUpdateProduct(editingProduct.id, data, files) : 
            handleAddProduct
          }
          initialData={editingProduct}
        />
      )}
    </div>
  );
}