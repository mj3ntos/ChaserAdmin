'use client';
import { useState } from 'react';
import type { Product } from '@/types';

interface ProductFormProps {
  onSubmit: (productData: Omit<Product, 'id'>, files: File[]) => Promise<void>;
  initialData?: Product;
}

export default function ProductForm({ onSubmit, initialData }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    price: initialData?.price || 0,
    offerPercentage: initialData?.offerPercentage || 0,
    description: initialData?.description || '',
    colors: initialData?.colors?.join(', ') || '',
    sizes: initialData?.sizes?.join(', ') || '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productData = {
        ...formData,
        colors: formData.colors 
        ? formData.colors.split(',')
          .map(c => c.trim())
          .filter(c => c)
          .map(c => Number(c))
          .filter(c => !isNaN(c))
        : [],
        sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()) : [],
        images: initialData?.images || [], // zostanie zaktualizowane przez komponent nadrzędny
      };

      await onSubmit(productData, files);
      // Reset form
      setFormData({
        name: '',
        category: '',
        price: 0,
        offerPercentage: 0,
        description: '',
        colors: '',
        sizes: '',
      });
      setFiles([]);
    } catch (err) {
      setError('Wystąpił błąd podczas zapisywania produktu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Nazwa</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Kategoria</label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Cena</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          step="0.01"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Zniżka (%)</label>
        <input
          type="number"
          value={formData.offerPercentage}
          onChange={(e) => setFormData({...formData, offerPercentage: parseFloat(e.target.value)})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          min="0"
          max="100"
          step="0.1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Opis</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Kolory (oddzielone przecinkami)</label>
        <input
          type="text"
          value={formData.colors}
          onChange={(e) => setFormData({...formData, colors: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="np. 123456, -16763649, 76364"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Rozmiary (oddzielone przecinkami)</label>
        <input
          type="text"
          value={formData.sizes}
          onChange={(e) => setFormData({...formData, sizes: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="S, M, L, XL"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Zdjęcia</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="mt-1 block w-full"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? 'Zapisywanie...' : 'Zapisz produkt'}
      </button>
    </form>
  );
}