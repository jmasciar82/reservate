"use client";

import { useState, useEffect } from 'react';
import { Plus, Check, X, Pencil, Trash2, Home, Sun, DollarSign, Shield } from 'lucide-react';

interface Court {
  _id: string;
  name: string;
  sport: string;
  isActive: boolean;
  isCovered: boolean;
  clubId: string;
  pricePerHour: number;
}

interface Club {
  _id: string;
  name: string;
}

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sport: 'padel',
    isCovered: false,
    isActive: true,
    clubId: '',
    pricePerHour: 10000,
  });

  const fetchCourts = async () => {
    try {
      const res = await fetch('http://localhost:3001/courts');
      const data = await res.json();
      setCourts(data);
    } catch (error) {
      console.error("Error fetching courts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await fetch('http://localhost:3001/clubs');
      const data = await res.json();
      setClubs(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, clubId: prev.clubId || data[0]._id }));
      }
    } catch (error) {
      console.error("Error fetching clubs:", error);
    }
  };

  useEffect(() => {
    fetchCourts();
    fetchClubs();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCourtId 
        ? `http://localhost:3001/courts/${editingCourtId}`
        : 'http://localhost:3001/courts';
        
      const method = editingCourtId ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        setShowForm(false);
        setEditingCourtId(null);
        setFormData({
          name: '',
          sport: 'padel',
          isCovered: false,
          isActive: true,
          clubId: clubs.length > 0 ? clubs[0]._id : '',
          pricePerHour: 10000,
        });
        fetchCourts();
      }
    } catch (error) {
      console.error("Error saving court:", error);
    }
  };

  const handleEditClick = (court: Court) => {
    setEditingCourtId(court._id);
    setFormData({
      name: court.name,
      sport: court.sport,
      isCovered: court.isCovered || false,
      isActive: court.isActive,
      clubId: court.clubId,
      pricePerHour: court.pricePerHour || 0,
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (courtId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cancha? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/courts/${courtId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCourts();
      } else {
        console.error("Error deleting court");
      }
    } catch (error) {
      console.error("Error deleting court:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCourtId(null);
    setFormData({
      name: '',
      sport: 'padel',
      isCovered: false,
      isActive: true,
      clubId: clubs.length > 0 ? clubs[0]._id : '',
      pricePerHour: 10000,
    });
  };

  const clubMap = clubs.reduce((acc, club) => {
    acc[club._id] = club.name;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="flex-1 overflow-y-auto p-8 z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Canchas</h1>
          <p className="text-zinc-400">Administra las canchas disponibles en tu club.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) {
              handleCancel();
            } else {
              setShowForm(true);
            }
          }}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-105 transition-transform flex items-center"
        >
          {showForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {showForm ? "Cancelar" : "Añadir Cancha"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border p-6 rounded-2xl mb-8 shadow-lg max-w-4xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h2 className="text-xl font-bold mb-4">{editingCourtId ? 'Editar Cancha' : 'Nueva Cancha'}</h2>
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre / Número</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Cancha 1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Deporte</label>
                <div className="relative">
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    value={formData.sport}
                    onChange={(e) => setFormData({...formData, sport: e.target.value})}
                  >
                    <option value="padel">Pádel</option>
                    <option value="tennis">Tenis</option>
                    <option value="football">Fútbol</option>
                    <option value="basketball">Básquet</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo de Cancha</label>
                <div className="relative">
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    value={formData.isCovered ? "true" : "false"}
                    onChange={(e) => setFormData({...formData, isCovered: e.target.value === "true"})}
                  >
                    <option value="false">Descubierta (Outdoor)</option>
                    <option value="true">Techada (Indoor)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Club Asocidado</label>
                <div className="relative">
                  <select 
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    value={formData.clubId}
                    onChange={(e) => setFormData({...formData, clubId: e.target.value})}
                  >
                    {clubs.length === 0 ? (
                      <option value="">Cargando clubes...</option>
                    ) : (
                      clubs.map((club) => (
                        <option key={club._id} value={club._id}>{club.name}</option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Precio por Hora ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500">$</span>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="100"
                    placeholder="Ej. 12000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({...formData, pricePerHour: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input 
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                Cancha Activa / Disponible
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all"
              >
                {editingCourtId ? 'Guardar Cambios' : 'Crear Cancha'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Cargando canchas...</p>
      ) : courts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500">Aún no hay canchas creadas en este club.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courts.map((court: Court) => (
            <div key={court._id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group relative overflow-hidden flex flex-col justify-between h-56">
              {/* Header Badges */}
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{court.name}</h3>
                    <span className="text-xs text-zinc-400 capitalize">{court.sport}</span>
                    <span className="text-xs text-zinc-500 font-mono mt-1">
                      {clubMap[court.clubId] || 'Club deportivo'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {court.isActive ? (
                      <span className="flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        <Check className="w-2.5 h-2.5 mr-1" /> Activa
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                        Inactiva
                      </span>
                    )}
                    
                    {court.isCovered ? (
                      <span className="flex items-center text-[10px] font-semibold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">
                        <Home className="w-2.5 h-2.5 mr-1" /> Techada
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Sun className="w-2.5 h-2.5 mr-1" /> Descubierta
                      </span>
                    )}
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-4 flex items-center gap-1.5 text-zinc-300 bg-zinc-950/40 py-1.5 px-3 rounded-lg border border-zinc-800/40 w-fit">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    <strong className="text-white font-bold">${court.pricePerHour?.toLocaleString('es-AR')}</strong> / hora
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={() => handleEditClick(court)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  title="Editar cancha"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteClick(court._id)}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Eliminar cancha"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
