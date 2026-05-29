import { useState, FormEvent } from 'react';
import { Cliente, Vehiculo, Repuesto, RepuestoUtilizado, Trabajador } from '../types';
import { X, Save, FileText, Plus, User, Car, Tag, ShieldAlert } from 'lucide-react';

interface OrderFormModalProps {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  repuestos: Repuesto[];
  trabajadores: Trabajador[];
  onSave: (data: {
    clienteId: string;
    autoId: string;
    fecha: string;
    descripcion: string;
    repuestos: RepuestoUtilizado[];
    observaciones: string;
    laborCost: number;
    kmIngreso: number;
    estado: 'abierta' | 'en_proceso' | 'terminada';
    trabajadorId?: string;
  }) => void;
  onClose: () => void;
}

export default function OrderFormModal({ clientes, vehiculos, repuestos, trabajadores, onSave, onClose }: OrderFormModalProps) {
  const [clienteId, setClienteId] = useState('');
  const [autoId, setAutoId] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [laborCost, setLaborCost] = useState<number>(0);
  const [kmIngreso, setKmIngreso] = useState<number>(0);
  const [estado, setEstado] = useState<'abierta' | 'en_proceso' | 'terminada'>('abierta');
  const [trabajadorId, setTrabajadorId] = useState('');

  // Spare parts select helper state
  const [selectedParts, setSelectedParts] = useState<RepuestoUtilizado[]>([]);
  const [currentPartId, setCurrentPartId] = useState('');
  const [currentQty, setCurrentQty] = useState<number>(1);

  // Filter vehicles specifically registered under that customer
  const filteredVehicles = vehiculos.filter(v => v.clienteId === clienteId);

  // Available spare parts with actual stock > 0
  const availablePartsInStock = repuestos.filter(r => r.cantidad > 0);

  const handleClientChange = (cId: string) => {
    setClienteId(cId);
    setAutoId(''); // Reset vehicle selection
  };

  const handleAddPart = () => {
    if (!currentPartId) return;
    const part = repuestos.find(r => r.id === currentPartId);
    if (!part) return;

    if (currentQty <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (currentQty > part.cantidad) {
      alert(`Lo sentimos, solo hay ${part.cantidad} unidades disponibles en stock.`);
      return;
    }

    // Check if the part is already added to lists
    const existingIndex = selectedParts.findIndex(item => item.id === currentPartId);
    if (existingIndex > -1) {
      const updated = [...selectedParts];
      const newTotalQty = updated[existingIndex].qty + currentQty;
      if (newTotalQty > part.cantidad) {
        alert(`No es posible agregar más de las ${part.cantidad} unidades registradas en bodega.`);
        return;
      }
      updated[existingIndex].qty = newTotalQty;
      setSelectedParts(updated);
    } else {
      setSelectedParts([
        ...selectedParts,
        {
          id: part.id,
          nombre: part.nombre,
          qty: currentQty,
          precio: part.precio
        }
      ]);
    }

    // Reset part selectors
    setCurrentPartId('');
    setCurrentQty(1);
  };

  const handleRemovePart = (partId: string) => {
    setSelectedParts(selectedParts.filter(p => p.id !== partId));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clienteId || !autoId || !descripcion.trim()) {
      alert('Por favor complete todos los campos obligatorios: Cliente, Vehículo y Descripción.');
      return;
    }

    onSave({
      clienteId,
      autoId,
      fecha,
      descripcion,
      repuestos: selectedParts,
      observaciones,
      laborCost,
      kmIngreso,
      estado,
      trabajadorId: trabajadorId || undefined
    });
  };

  const itemSubtotal = selectedParts.reduce((sum, item) => sum + item.precio * item.qty, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-[#171b26] border border-[#2d364f] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#1e2436] border-b border-[#2d364f] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm uppercase tracking-wider">Emitir Orden de Trabajo / Recepción</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto w-full text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Client selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-orange-500/85" />
                Cliente / Propietario *
              </label>
              <select
                required
                value={clienteId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2.5 px-3 text-xs text-white outline-none transition-all"
              >
                <option value="">Seleccione el propietario...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} (ID: {c.cedula})</option>
                ))}
              </select>
            </div>

            {/* Vehicle selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-orange-500/85" />
                Auto Registrado *
              </label>
              <select
                required
                disabled={!clienteId}
                value={autoId}
                onChange={(e) => setAutoId(e.target.value)}
                className={`w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2.5 px-3 text-xs text-white outline-none transition-all ${
                  !clienteId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {!clienteId ? (
                  <option value="">Primero elija un cliente</option>
                ) : filteredVehicles.length === 0 ? (
                  <option value="">Este cliente no posee autos registrados.</option>
                ) : (
                  <>
                    <option value="">Seleccione el automóvil...</option>
                    {filteredVehicles.map(v => (
                       <option key={v.id} value={v.id}>{v.marca} {v.modelo} [Placa: {v.placa}]</option>
                    ))}
                  </>
                )}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha de Emisión</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estado Técnico Inicial</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2.5 px-3 text-xs text-white outline-none transition-all"
              >
                <option value="abierta">Abierta (Por evaluar / Diagnóstico)</option>
                <option value="en_proceso">En Proceso (Mecánicos laborando)</option>
                <option value="terminada">Completada (Lista para retiro)</option>
              </select>
            </div>
          </div>

          {/* New row: Technician assignment */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asignación Directa de Técnico</label>
            <select
              value={trabajadorId}
              onChange={(e) => setTrabajadorId(e.target.value)}
              className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2.5 px-3 text-xs text-white outline-none transition-all"
            >
              <option value="">-- SIN ASIGNAR (PERMITIR AUTOACERDACIÓN DE MECANICOS DESDE SU INTERFAZ) --</option>
              {trabajadores.map(trab => (
                <option key={trab.id} value={trab.id}>
                  {trab.nombre} — {trab.especialidad}
                </option>
              ))}
            </select>
          </div>

          {/* Job description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descripción del Trabajo / Fallas Reportadas *</label>
            <textarea
              required
              rows={3}
              placeholder="Indique los síntomas reportados por el cliente, las labores mecánicas a efectuar y reparaciones detalladas..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Add Replaced Parts directly from general stock */}
          <div className="space-y-2.5 p-4 rounded-xl bg-[#1d2334] border border-[#2d364f]">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Acoplar Repuestos desde Almacén</span>
            
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Repuesto Disponible</label>
                <select
                  value={currentPartId}
                  onChange={(e) => setCurrentPartId(e.target.value)}
                  className="w-full bg-[#141926] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-3 text-xs text-white outline-none transition-all"
                >
                  <option value="">Seleccione un repuesto...</option>
                  {availablePartsInStock.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} — Stock disponible: {r.cantidad} — ${r.precio.toFixed(2)} c/u
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-20 space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Cant.</label>
                <input
                  type="number"
                  min={1}
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                  className="w-full bg-[#141926] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-3 text-xs text-white outline-none transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleAddPart}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-lg transition-all"
              >
                + Acoplar
              </button>
            </div>

            {/* Selected parts table summary */}
            <div className="mt-3 divide-y divide-[#262c3e]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-1.5 block">Piezas conectadas a esta reparacion:</div>
              {selectedParts.length === 0 ? (
                <p className="text-xs italic text-gray-500 py-2">Ningún repuesto de bodega acoplado todavía. Puede añadirlos arriba.</p>
              ) : (
                <div className="space-y-1.5 pt-2">
                  {selectedParts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-[#151a27] px-3 py-2 rounded border border-gray-800">
                      <div>
                        <span className="font-medium text-gray-200">{p.nombre}</span>
                        <span className="text-gray-500 ml-2 text-[10px]">x{p.qty} a ${p.precio.toFixed(2)} c/u</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-orange-400">${(p.precio * p.qty).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(p.id)}
                          className="text-red-400 hover:text-red-300 font-bold px-1 rounded hover:bg-red-500/10"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-[11px] text-gray-400 pt-1">
                    Subtotal Repuestos: <strong className="text-white">${itemSubtotal.toLocaleString('es')}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Costo Mano de Obra ($)</label>
              <input
                type="number"
                min={0}
                required
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kilometraje al Recibir (KM) *</label>
              <input
                type="number"
                min={0}
                required
                placeholder="Ej: 112500"
                value={kmIngreso}
                onChange={(e) => setKmIngreso(Number(e.target.value))}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-[#d97706] rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Observations and suggestions */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Anotaciones Técnicas o Recomendaciones</label>
            <textarea
              rows={2}
              placeholder="Indique sugerencias de repuestos para el próximo servicio, observaciones de fugas menores detectadas..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-[#d97706] rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all resize-none"
            />
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-[#1e2436] border-t border-[#2d364f] flex justify-end gap-2 text-xs">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold rounded-xl transition-all">
            Cancelar
          </button>
          <button type="submit" className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-950/20">
            <Save className="w-4 h-4" />
            Emitir Órden & Ver Factura
          </button>
        </div>

      </form>
    </div>
  );
}
