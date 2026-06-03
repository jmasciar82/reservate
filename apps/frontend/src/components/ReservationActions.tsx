"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, CircleDollarSign, Edit, MoreVertical, User, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { PaymentStatus, ReservationStatus, Product } from "@/lib/types";
import { useClub } from "@/providers/ClubProvider";

interface ReservationActionsProps {
  reservationId: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  totalPrice?: number;
  depositAmount?: number;
  isRecurring?: boolean;
  recurrenceGroupId?: string;
  isLastOfSeries?: boolean;
  playerName?: string;
  startTime?: string;
  products?: Array<{
    name: string;
    quantity: number;
    price: number;
    total?: number;
  }>;
}

const PRESET_PRODUCTS = [
  { name: "Alquiler de Pala", price: 1500, icon: "🎒" },
  { name: "Tubo de Pelotas", price: 3000, icon: "🥎" },
  { name: "Agua Mineral", price: 1200, icon: "🥤" },
  { name: "Gatorade", price: 2000, icon: "⚡" },
];


export default function ReservationActions({
  reservationId,
  status,
  paymentStatus,
  totalPrice = 0,
  depositAmount = 0,
  isRecurring,
  recurrenceGroupId,
  isLastOfSeries = false,
  playerName = "",
  startTime,
  products = [],
}: ReservationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositInputValue, setDepositInputValue] = useState("");
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showSingleCancelModal, setShowSingleCancelModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(playerName || "");
  const [expandUp, setExpandUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { activeClubId } = useClub();
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [currentProducts, setCurrentProducts] = useState<Array<{ name: string; quantity: number; price: number }>>([]);
  const [customProduct, setCustomProduct] = useState({ name: "", price: "", quantity: "1" });
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (showAddProductsModal && activeClubId) {
      apiFetch(`/products?clubId=${activeClubId}`)
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((data: Product[]) => {
          setAvailableProducts(data.filter(p => p.isActive));
        })
        .catch((err) => console.error("Error fetching products:", err));
    }
  }, [showAddProductsModal, activeClubId]);

  const handleOpenAddProducts = () => {
    setCurrentProducts(products || []);
    setCustomProduct({ name: "", price: "", quantity: "1" });
    setIsOpen(false);
    setShowAddProductsModal(true);
  };

  const addPresetProduct = (preset: { name: string; price: number }) => {
    setCurrentProducts(prev => {
      const existing = prev.find(p => p.name === preset.name);
      if (existing) {
        return prev.map(p => p.name === preset.name ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { name: preset.name, price: preset.price, quantity: 1 }];
    });
  };

  const addCustomProduct = () => {
    if (!customProduct.name.trim() || !customProduct.price) return;
    const priceNum = Number(customProduct.price);
    const qtyNum = Number(customProduct.quantity) || 1;
    if (isNaN(priceNum) || priceNum < 0) return;

    setCurrentProducts(prev => {
      const existing = prev.find(p => p.name.toLowerCase() === customProduct.name.toLowerCase());
      if (existing) {
        return prev.map(p => p.name.toLowerCase() === customProduct.name.toLowerCase() ? { ...p, quantity: p.quantity + qtyNum } : p);
      }
      return [...prev, { name: customProduct.name.trim(), price: priceNum, quantity: qtyNum }];
    });
    setCustomProduct({ name: "", price: "", quantity: "1" });
  };

  const updateProductQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCurrentProducts(prev => prev.filter((_, i) => i !== index));
    } else {
      setCurrentProducts(prev => prev.map((p, i) => i === index ? { ...p, quantity: newQty } : p));
    }
  };

  const removeProduct = (index: number) => {
    setCurrentProducts(prev => prev.filter((_, i) => i !== index));
  };


  useEffect(() => {
    setMounted(true);
  }, []);

  const renderModal = (isOpen: boolean, content: React.ReactNode) => {
    if (!isOpen || !mounted || typeof window === "undefined" || !document.body) return null;
    return createPortal(content, document.body);
  };

  const handleToggle = () => {
    if (!isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let spaceAboveWithinContainer = 999;
      const scrollContainer = menuRef.current.closest('.overflow-x-auto');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        spaceAboveWithinContainer = rect.top - containerRect.top;
      }

      // Solo desplegar hacia arriba si falta espacio abajo Y hay espacio suficiente arriba en el viewport Y dentro del contenedor scrollable
      setExpandUp(spaceBelow < 280 && rect.top > 280 && spaceAboveWithinContainer > 220);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    setNameInputValue(playerName || "");
  }, [playerName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      const card = menuRef.current.closest(".group\\/res, .group") as HTMLElement;
      if (card) {
        const cell = card.parentElement;
        if (isOpen) {
          card.style.zIndex = "9999";
          if (cell) cell.style.zIndex = "9999";
        } else {
          card.style.zIndex = "";
          if (cell) cell.style.zIndex = "";
        }
      }
    }
  }, [isOpen]);

  const handleUpdate = async (payload: {
    status?: ReservationStatus;
    paymentStatus?: PaymentStatus;
    depositAmount?: number;
    cancelSeries?: boolean;
    userId?: string;
    payBlock?: boolean;
    products?: Array<{ name: string; quantity: number; price: number }>;
  }) => {
    setIsOpen(false);
    setShowCancelModal(false);
    setShowDepositModal(false);
    setShowEditNameModal(false);
    setShowAddProductsModal(false);

    try {
      const response = await apiFetch(`/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Error al actualizar la reserva.");
      }
    } catch (error) {
      console.error("Error updating reservation:", error);
      alert("Error al actualizar la reserva.");
    }
  };

  const isPast = startTime ? new Date(startTime) < new Date() : false;
  const showConfirm = status === "pending";
  const showCancel = status !== "cancelled" && !isPast;
  
  const isPartiallyPaid = depositAmount > 0 && depositAmount < totalPrice;
  const showPaymentActions = paymentStatus === "pending" && status !== "cancelled" && !isPartiallyPaid;

  if (!showConfirm && !showPaymentActions && !isPartiallyPaid && !showCancel) {
    return <div className="w-9 h-9" />;
  }

  return (
    <div className={`relative ${isOpen ? "z-30" : ""}`} ref={menuRef}>
      <button
        onClick={handleToggle}
        className="p-2 text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
        title="Acciones de reserva"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl z-50 py-1.5 animate-in fade-in duration-150 ${
          expandUp 
            ? "bottom-full mb-1 slide-in-from-bottom-2" 
            : "top-full mt-1 slide-in-from-top-2"
        }`}>
          {showConfirm && (
            <button
              onClick={() => handleUpdate({ status: "confirmed" })}
              className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Confirmar (sin cobrar)</span>
            </button>
          )}

          {showPaymentActions && (
            <>
              <button
                onClick={() => {
                  const defaultDeposit = Math.round(totalPrice * 0.3);
                  setDepositInputValue(String(defaultDeposit));
                  setIsOpen(false);
                  setShowDepositModal(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
              >
                <CircleDollarSign className="w-4 h-4 text-blue-400" />
                <span>Registrar Pago de Seña</span>
              </button>

              <button
                onClick={() => {
                  if (isRecurring) {
                    const originalTotal = totalPrice * 4;
                    const discountedTotal = Math.round(originalTotal * 0.9);
                    const savings = originalTotal - discountedTotal;
                    if (
                      confirm(
                        `¿Registrar Pago Total del bloque de 4 semanas con un 10% de descuento?\n\n` +
                        `• Total normal (4 sem): $${originalTotal.toLocaleString("es-AR")}\n` +
                        `• Total con 10% OFF: $${discountedTotal.toLocaleString("es-AR")}\n` +
                        `• Ahorro: $${savings.toLocaleString("es-AR")}\n\n` +
                        `Esta acción marcará las 4 semanas de este bloque mensual como pagadas con descuento.`
                      )
                    ) {
                      handleUpdate({
                        status: "confirmed",
                        paymentStatus: "paid",
                        payBlock: true,
                      });
                    }
                  } else {
                    handleUpdate({
                      status: "confirmed",
                      paymentStatus: "paid",
                      depositAmount: totalPrice,
                    });
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
              >
                <CircleDollarSign className="w-4 h-4 text-primary" />
                <span>Registrar Pago Total {isRecurring ? "(4 sem -10%)" : ""}</span>
              </button>
            </>
          )}

          {isPartiallyPaid && (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowBalanceModal(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
            >
              <CircleDollarSign className="w-4 h-4 text-primary animate-pulse" />
              <div className="flex flex-col">
                <span className="font-bold text-zinc-900 dark:text-white">Cobrar Saldo Restante {isRecurring ? "(Bloque)" : ""}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Resta cobrar: ${ (totalPrice * (isRecurring ? 4 : 1) - depositAmount).toLocaleString("es-AR") }
                </span>
              </div>
            </button>
          )}

          {status !== "cancelled" && (
            <>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowEditNameModal(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
              >
                <Edit className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Editar nombre</span>
              </button>

              <button
                onClick={handleOpenAddProducts}
                className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
              >
                <span className="w-4 h-4 flex items-center justify-center text-xs">🎒</span>
                <span>Agregar Consumo / Extra</span>
              </button>
            </>
          )}

          {showCancel && (
            <button
              onClick={() => {
                if (isRecurring && recurrenceGroupId) {
                  setIsOpen(false);
                  setShowCancelModal(true);
                } else {
                  setIsOpen(false);
                  setShowSingleCancelModal(true);
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
            >
              <Ban className="w-4 h-4" />
              <span>Cancelar reserva</span>
            </button>
          )}
        </div>
      )}

      {renderModal(
        showCancelModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Cancelar Turno Recurrente
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Esta reserva forma parte de una serie recurrente semanal. ¿Cómo querés proceder con la cancelación?
                </p>
              </div>
              
              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={() => handleUpdate({ status: "cancelled" })}
                  className="w-full py-2.5 px-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white font-medium rounded-lg border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm shadow-md"
                >
                  Cancelar solo esta fecha
                </button>
                <button
                  onClick={() => handleUpdate({ status: "cancelled", cancelSeries: true })}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all text-sm shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:scale-[1.01]"
                >
                  Cancelar toda la serie (esta y futuras)
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-2 px-4 bg-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all text-xs font-semibold"
                >
                  Volver / Conservar turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderModal(
        showDepositModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDepositModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Registrar Pago de Seña
              </h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amount = Number(depositInputValue);
                if (isNaN(amount) || amount <= 0 || amount > totalPrice) {
                  alert(`Por favor ingresá un monto válido (máximo $${totalPrice.toLocaleString()}).`);
                  return;
                }
                handleUpdate({
                  status: "confirmed",
                  paymentStatus: "paid",
                  depositAmount: amount,
                });
                setShowDepositModal(false);
              }}
              className="p-6 space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-primary" />
                  Monto pagado como seña ($)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 2000"
                  value={depositInputValue}
                  onChange={(e) => setDepositInputValue(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold text-lg"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500 italic mt-1 leading-relaxed">
                  El valor total de la reserva es de <strong className="text-zinc-600 dark:text-zinc-300">${totalPrice.toLocaleString("es-AR")}</strong>.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-sm"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {renderModal(
        showBalanceModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowBalanceModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                {isRecurring ? "Cobrar Saldo Restante (Bloque)" : "Cobrar Saldo Restante"}
              </h3>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Valor Total {isRecurring ? "(4 sem)" : ""}:</span>
                  <span className="text-zinc-900 dark:text-white">${(totalPrice * (isRecurring ? 4 : 1)).toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Seña Pagada:</span>
                  <span className="text-blue-400">${depositAmount.toLocaleString("es-AR")}</span>
                </div>
                <div className="border-t border-zinc-200/80 dark:border-white/5 pt-2 flex justify-between text-sm font-bold text-zinc-600 dark:text-zinc-200">
                  <span>Saldo Restante:</span>
                  <span className="text-primary text-base drop-shadow-[0_0_6px_rgba(57,255,20,0.3)]">
                    ${(totalPrice * (isRecurring ? 4 : 1) - depositAmount).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
 
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed font-semibold">
                {isRecurring 
                  ? "¿Confirmás el cobro del saldo restante del bloque completo de 4 semanas? Todas las reservas de este mes quedarán marcadas como totalmente pagadas."
                  : "¿Confirmás el cobro del saldo restante? La reserva quedará marcada como totalmente pagada."}
              </p>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdate({
                      status: "confirmed",
                      paymentStatus: "paid",
                      payBlock: isRecurring ? true : undefined,
                      depositAmount: isRecurring ? undefined : totalPrice,
                    });
                    setShowBalanceModal(false);
                  }}
                  className="flex-1 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-sm"
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {renderModal(
        showEditNameModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowEditNameModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Editar Jugador
              </h3>
              <button
                onClick={() => setShowEditNameModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmedValue = nameInputValue.trim();
                if (!trimmedValue) {
                  alert("Por favor ingresá un nombre válido.");
                  return;
                }
                handleUpdate({
                  userId: trimmedValue,
                });
              }}
              className="p-6 space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nombre del jugador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nameInputValue}
                  onChange={(e) => setNameInputValue(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold text-base"
                  autoFocus
                />
                {isRecurring && (
                  <p className="text-[10px] text-zinc-500 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2 mt-2 leading-relaxed flex items-start gap-1.5">
                    <span className="text-indigo-400 shrink-0 font-extrabold text-[11px]">🔁</span>
                    <span>
                      Al ser un <strong>turno fijo recurrente</strong>, el nuevo nombre se aplicará automáticamente a esta reserva y a todas las futuras fechas de la serie.
                    </span>
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renderModal(
        showSingleCancelModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowSingleCancelModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                Cancelar Reserva
              </h3>
              <button
                onClick={() => setShowSingleCancelModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 space-y-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed text-center font-medium">
                  ¿Estás seguro de que querés cancelar esta reserva? Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingleCancelModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Volver / Conservar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdate({ status: "cancelled" });
                    setShowSingleCancelModal(false);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.45)] transition-all text-sm"
                >
                  Sí, Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderModal(
        showAddProductsModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowAddProductsModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Agregar Consumo / Extra
              </h3>
              <button
                onClick={() => setShowAddProductsModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-2">
                {(availableProducts.length > 0 ? availableProducts : PRESET_PRODUCTS).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => addPresetProduct(preset)}
                    className="flex items-center justify-between p-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-white/[0.08] active:scale-95 transition-all duration-200 text-left text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{'icon' in preset ? preset.icon : '📦'}</span>
                      <span className="truncate">{preset.name}</span>
                    </span>
                    <span className="font-bold text-primary shrink-0">${preset.price.toLocaleString("es-AR")}</span>
                  </button>
                ))}
              </div>

              {/* Custom item input */}
              <div className="space-y-2 pt-2 border-t border-zinc-200/80 dark:border-white/5">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Agregar ítem personalizado</span>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nombre (ej. Grip)"
                    value={customProduct.name}
                    onChange={(e) => setCustomProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    placeholder="Precio"
                    value={customProduct.price}
                    onChange={(e) => setCustomProduct(prev => ({ ...prev, price: e.target.value }))}
                    className="w-16 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={addCustomProduct}
                    className="px-3 py-1.5 bg-primary text-black font-extrabold text-xs rounded-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    ➕
                  </button>
                </div>
              </div>

              {/* List of currently added products */}
              {currentProducts.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-zinc-200/80 dark:border-white/5">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Consumos Cargados</span>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {currentProducts.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-100/50 dark:bg-white/[0.03] border border-zinc-200/55 dark:border-white/[0.05] text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{p.name}</span>
                          <span className="text-[10px] text-zinc-500">${p.price.toLocaleString("es-AR")} c/u</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-zinc-200 dark:bg-white/10 rounded-md">
                            <button
                              type="button"
                              onClick={() => updateProductQty(idx, p.quantity - 1)}
                              className="px-2 py-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-white/15 rounded-l-md transition-colors"
                            >
                              -
                            </button>
                            <span className="px-2.5 text-xs font-black text-zinc-800 dark:text-zinc-200">{p.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateProductQty(idx, p.quantity + 1)}
                              className="px-2 py-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-white/15 rounded-r-md transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(idx)}
                            className="text-red-500 hover:text-red-400 p-1"
                            title="Eliminar"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Summary */}
              <div className="bg-zinc-100/50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Precio de Cancha:</span>
                  <span>${(totalPrice - (products?.reduce((s, p) => s + p.price * p.quantity, 0) || 0)).toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Total Consumos Cargados:</span>
                  <span>${currentProducts.reduce((sum, p) => sum + p.price * p.quantity, 0).toLocaleString("es-AR")}</span>
                </div>
                <div className="border-t border-zinc-200/80 dark:border-white/5 pt-2 flex justify-between text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  <span>Nuevo Total General:</span>
                  <span className="text-primary text-base drop-shadow-[0_0_6px_rgba(57,255,20,0.3)]">
                    ${((totalPrice - (products?.reduce((s, p) => s + p.price * p.quantity, 0) || 0)) + currentProducts.reduce((sum, p) => sum + p.price * p.quantity, 0)).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductsModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate({ products: currentProducts })}
                  className="flex-1 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-sm"
                >
                  Confirmar Consumos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

