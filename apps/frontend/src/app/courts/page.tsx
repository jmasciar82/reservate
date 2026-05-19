"use client";

import { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';

export default function CourtsPage() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCourt, setNewCourt] = useState({ name: '', sport: 'padel' });

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

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleCreateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCourt,
          clubId: '60d5ecb8b392d7001f8e4c00', // Mock club ID for now
        }),
      });
      
      if (res.ok) {
        setShowForm(false);
        setNewCourt({ name: '', sport: 'padel' });
        fetchCourts(); // Refresh list
      }
    } catch (error) {
      console.error("Error creating court:", error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Canchas</h1>
          <p className="text-zinc-400">Administra las canchas disponibles en tu club.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-105 transition-transform flex items-center"
        >
          {showForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {showForm ? "Cancelar" : "Añadir Cancha"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border p-6 rounded-2xl mb-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Nueva Cancha</h2>
          <form onSubmit={handleCreateCourt} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre / Número</label>
              <input 
                type="text" 
                required
                placeholder="Ej. Cancha 1"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-4 focus:outline-none focus:border-primary transition-colors"
                value={newCourt.name}
                onChange={(e) => setNewCourt({...newCourt, name: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Deporte</label>
              <select 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-4 focus:outline-none focus:border-primary transition-colors appearance-none"
                value={newCourt.sport}
                onChange={(e) => setNewCourt({...newCourt, sport: e.target.value})}
              >
                <option value="padel">Pádel</option>
                <option value="tennis">Tenis</option>
                <option value="football">Fútbol</option>
                <option value="basketball">Básquet</option>
              </select>
            </div>
            <button type="submit" className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors h-[42px]">
              Guardar
            </button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {courts.map((court: any) => (
            <div key={court._id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                {court.isActive ? (
                  <span className="flex items-center text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3 mr-1" /> Activa
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                    Inactiva
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{court.name}</h3>
              <p className="text-zinc-400 capitalize">{court.sport}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
