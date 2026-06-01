"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  DollarSign,
  Package,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useClub } from "@/providers/ClubProvider";

type ProductFormData = {
  name: string;
  price: number;
  icon: string;
  isActive: boolean;
  clubId: string;
};

const initialFormData: ProductFormData = {
  name: "",
  price: 0,
  icon: "🥤",
  isActive: true,
  clubId: "",
};

const EMOJI_PRESETS = ["🥤", "🎒", "🥎", "⚡", "🥪", "🍎", "👟", "👕", "🔑", "🧊", "📦"];

async function fetchJson<T>(url: string): Promise<T> {
  const response = await apiFetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { activeClubId, clubs } = useClub();
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesClub = p.clubId === activeClubId;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClub && matchesSearch;
    });
  }, [products, activeClubId, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchJson<Product[]>("/products");
      setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError("No se pudieron cargar los productos del catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    setFormData((prev) => ({
      ...prev,
      clubId: activeClubId || "",
    }));
  }, [activeClubId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price < 0 || !formData.clubId) {
      setError("Por favor completa todos los campos requeridos correctamente.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingProductId) {
        // Edit product
        const response = await apiFetch(`/products/${editingProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to update product");
        }

        const updated = await response.json();
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProductId ? updated : p))
        );
      } else {
        // Create product
        const response = await apiFetch("/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to create product");
        }

        const created = await response.json();
        setProducts((prev) => [...prev, created]);
      }

      setFormData({ ...initialFormData, clubId: activeClubId || "" });
      setShowForm(false);
      setEditingProductId(null);
    } catch (err: any) {
      console.error("Error saving product:", err);
      setError("No se pudo guardar el producto. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product._id);
    setFormData({
      name: product.name,
      price: product.price,
      icon: product.icon || "🥤",
      isActive: product.isActive,
      clubId: product.clubId,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return;

    try {
      setError(null);
      const response = await apiFetch(`/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("No se pudo eliminar el producto.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50/50 dark:bg-zinc-950/20 p-6 rounded-2xl border border-zinc-200 dark:border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="w-3 h-8 bg-primary rounded-full shadow-[0_0_12px_rgba(57,255,20,0.5)]" />
            Catálogo de Productos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Administra los consumibles, bebidas y alquileres disponibles para las reservas de tu club.
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingProductId(null);
            setFormData({ ...initialFormData, clubId: activeClubId || "" });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-black font-extrabold rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_30px_rgba(57,255,20,0.45)] hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products List (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all duration-200 placeholder:text-zinc-400 shadow-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50/20 dark:bg-zinc-950/10 rounded-2xl border border-dashed border-zinc-200 dark:border-white/5">
              <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">No se encontraron productos</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                {searchQuery ? "Intenta cambiar la búsqueda" : "Crea tu primer producto para comenzar."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className={`relative p-5 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 shadow-md flex items-center justify-between group hover:border-primary/30 transition-all duration-300 ${
                    !product.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl p-3 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200/50 dark:border-white/5 select-none shadow-inner">
                      {product.icon || "📦"}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-zinc-800 dark:text-zinc-100 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        ${product.price.toLocaleString("es-AR")}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                          product.isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-zinc-200 dark:bg-white/5 text-zinc-500 border border-zinc-300 dark:border-white/10"
                        }`}
                      >
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl border border-zinc-200/50 dark:border-white/5 transition-all"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-zinc-200/50 dark:border-white/5 transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Form Container */}
        {showForm && (
          <div className="bg-white/80 dark:bg-zinc-950/40 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-xl space-y-6 h-fit animate-in slide-in-from-right-8 duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200/80 dark:border-white/5">
              <h2 className="text-lg font-black text-zinc-800 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-6 bg-primary rounded-full" />
                {editingProductId ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingProductId(null);
                  setFormData(initialFormData);
                }}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white p-1 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Agua de Litro, Alquiler de Pala Carbono"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Precio (AR$) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-zinc-400">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0.00"
                    value={formData.price || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Emoji Icon Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Ícono representativo</label>
                <div className="flex flex-wrap gap-2 p-3 bg-zinc-100/40 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 rounded-xl">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                      className={`text-xl p-2 rounded-lg border hover:scale-110 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all select-none ${
                        formData.icon === emoji
                          ? "border-primary bg-primary/10 text-primary scale-110 shadow-[0_0_10px_rgba(57,255,20,0.1)]"
                          : "border-zinc-200 dark:border-white/5"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-100/40 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Producto Activo</span>
                  <span className="text-[10px] text-zinc-500">¿Visible en el menú de reservas y consumos?</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-300 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-200/80 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProductId(null);
                    setFormData(initialFormData);
                  }}
                  className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-black font-extrabold rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.2)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.4)] disabled:opacity-50 transition-all text-xs"
                >
                  {saving ? "Guardando..." : editingProductId ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
