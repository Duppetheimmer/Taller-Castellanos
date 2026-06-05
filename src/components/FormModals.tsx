import { useState, useEffect, FormEvent } from 'react';
import { Cliente, Vehiculo, Repuesto } from '../types';
import { X, Save, User, Phone, Mail, Award, MapPin, Calendar, Clipboard, Tag, ShieldAlert, Plus, Trash2, Car } from 'lucide-react';

export const AVAILABLE_COLORS = [
  { name: 'Negro', hex: '#000000' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Gris Plata', hex: '#6b7280' },
  { name: 'Gris Plomo', hex: '#374151' },
  { name: 'Vinotinto', hex: '#800020' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Azul Marino', hex: '#1e3a8a' },
  { name: 'Morado', hex: '#8b5cf6' },
  { name: 'Marrón', hex: '#92400e' },
];

/* ==========================================
   CLIENTE FORM MODAL
   ========================================== */
interface ClienteModalProps {
  cliente: Cliente | null;
  vehiculos: Vehiculo[];
  onSave: (
    data: Omit<Cliente, 'id' | 'fechaReg'>,
    associatedVehicles?: (Omit<Vehiculo, 'id' | 'clienteId' | 'fechaReg'> & { id?: string })[]
  ) => void;
  onClose: () => void;
}

export function ClienteModal({ cliente, vehiculos, onSave, onClose }: ClienteModalProps) {
  const [nombre, setNombre] = useState(cliente?.nombre || '');
  const [telefono, setTelefono] = useState(cliente?.telefono || '');
  const [email, setEmail] = useState(cliente?.email || '');
  const [cedula, setCedula] = useState(cliente?.cedula || '');
  const [nacimiento, setNacimiento] = useState(cliente?.nacimiento || '');
  const [direccion, setDireccion] = useState(cliente?.direccion || '');
  const [observaciones, setObservaciones] = useState(cliente?.observaciones || '');

  // Associated vehicles state for BOTH new and existing clients
  const [associatedVehicles, setAssociatedVehicles] = useState<any[]>(() => {
    if (cliente) {
      return vehiculos
        .filter(v => v.clienteId === cliente.id)
        .map(v => ({
          id: v.id,
          marca: v.marca,
          modelo: v.modelo,
          placa: v.placa,
          anio: v.anio || '',
          color: v.color || '#6b7280',
          vin: v.vin || '',
          km: v.km || 0,
          observaciones: v.observaciones || '',
        }));
    } else {
      return [
        {
          marca: '',
          modelo: '',
          placa: '',
          anio: '',
          color: '#6b7280',
          vin: '',
          km: 0,
          observaciones: '',
        },
      ];
    }
  });

  const handleAddVehicle = () => {
    setAssociatedVehicles([
      ...associatedVehicles,
      {
        marca: '',
        modelo: '',
        placa: '',
        anio: '',
        color: '#6b7280',
        vin: '',
        km: 0,
        observaciones: '',
      },
    ]);
  };

  const handleRemoveVehicle = (index: number) => {
    setAssociatedVehicles(associatedVehicles.filter((_, i) => i !== index));
  };

  const handleUpdateVehicle = (index: number, field: string, value: any) => {
    setAssociatedVehicles(
      associatedVehicles.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }
    if (!cedula.trim()) {
      alert('La cédula de identidad / RIF es obligatoria');
      return;
    }

    try {
      // If they have associated vehicles, validate them before saving
      const formattedVehicles = associatedVehicles.map((v, idx) => {
        const hasSomeValue =
          v.marca.trim() ||
          v.modelo.trim() ||
          v.placa.trim() ||
          v.vin.trim() ||
          v.observaciones.trim();

        if (hasSomeValue) {
          if (!v.marca.trim() || !v.modelo.trim() || !v.placa.trim()) {
            throw new Error(
              `Por favor complete Marca, Modelo y Placa para el Vehículo #${idx + 1}, o elimine el formulario de vehículo si no desea registrarlo.`
            );
          }
        }

        return {
          id: v.id,
          marca: v.marca.trim(),
          modelo: v.modelo.trim(),
          placa: v.placa.toUpperCase().trim(),
          anio: v.anio === '' ? null : Number(v.anio),
          color: v.color,
          vin: v.vin.toUpperCase().trim(),
          km: v.km === '' ? 0 : Number(v.km),
          observaciones: v.observaciones.trim(),
        };
      });

      // Filter out totally empty vehicles if the user didn't enter anything in them
      const validVehicles = formattedVehicles.filter(
        (v) => v.marca || v.modelo || v.placa
      );

      onSave(
        { nombre, telefono, email, cedula, nacimiento, direccion, observaciones },
        validVehicles
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-[#171b26] border border-[#2d364f] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 bg-[#1e2436] border-b border-[#2d364f] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm uppercase tracking-wider">{cliente ? 'Editar Cliente' : 'Inscribir Nuevo Cliente'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pb-1 border-b border-[#2d364f]/30">
              Datos Personales
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej: Andrés Manuel Castellanos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cédula de Identidad / RIF *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: V-15.342.198"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Número de Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej: 0414-123-4567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej: andres@servicios.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={nacimiento}
                  onChange={(e) => setNacimiento(e.target.value)}
                  className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección de Domicilio o Fiscal</label>
              <textarea
                placeholder="Av. Principal, Qta Dolores, Macaracuay..."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 min-h-[60px] outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Observaciones Generales</label>
              <textarea
                placeholder="Detalles sobre facturación, hábitos de pago, requerimientos adicionales..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 min-h-[60px] outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* CLIENT VEHICLES SECTION */}
          {true && (
            <div className="pt-4 border-t border-[#2d364f]/50 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#2d364f]/30">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-black uppercase text-orange-500 tracking-wider">
                    {cliente ? 'Vehículos Vinculados' : 'Vehículos a Registrar'} ({associatedVehicles.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddVehicle}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-950/40 hover:bg-orange-900 border border-orange-500/10 text-orange-400 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Vehículo
                </button>
              </div>

              {associatedVehicles.length === 0 && (
                <div className="text-center py-6 bg-[#121622] rounded-xl border border-[#2d364f]/30">
                  <p className="text-xs text-gray-400 font-mono">No hay vehículos vinculados en este registro.</p>
                  <button
                    type="button"
                    onClick={handleAddVehicle}
                    className="mt-2 text-xs font-black text-orange-400 hover:text-orange-300"
                  >
                    ➕ Añadir un Vehículo de Inmediato
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {associatedVehicles.map((v, idx) => {
                  const isVehPreset = AVAILABLE_COLORS.some(
                    (c) => c.hex.toLowerCase() === v.color.toLowerCase()
                  );
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-[#141926]/40 rounded-xl border border-[#2d364f] relative space-y-3 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-[#2d364f]/30">
                        <span className="text-[10px] font-extrabold text-orange-400/90 uppercase tracking-widest flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-gray-400" /> VEHÍCULO #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVehicle(idx)}
                          className="p-1 rounded bg-red-950/40 hover:bg-red-900 border border-red-500/15 text-red-400 hover:text-white transition-colors"
                          title="Quitar vehículo de la lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Marca *</label>
                          <input
                            type="text"
                            placeholder="Ej: Toyota"
                            value={v.marca}
                            onChange={(e) => handleUpdateVehicle(idx, 'marca', e.target.value)}
                            className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Modelo *</label>
                          <input
                            type="text"
                            placeholder="Ej: Corolla"
                            value={v.modelo}
                            onChange={(e) => handleUpdateVehicle(idx, 'modelo', e.target.value)}
                            className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Placa / Patente *</label>
                          <input
                            type="text"
                            placeholder="Ej: AB123CD"
                            value={v.placa}
                            onChange={(e) => handleUpdateVehicle(idx, 'placa', e.target.value)}
                            className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-gray-500 font-mono uppercase outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Año</label>
                          <input
                            type="number"
                            placeholder="Ej: 2018"
                            value={v.anio}
                            onChange={(e) =>
                              handleUpdateVehicle(
                                idx,
                                'anio',
                                e.target.value === '' ? '' : Number(e.target.value)
                              )
                            }
                            className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Color Pintura</label>
                          <select
                            value={isVehPreset ? v.color : 'otro'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'otro') {
                                handleUpdateVehicle(idx, 'color', '');
                              } else {
                                handleUpdateVehicle(idx, 'color', val);
                              }
                            }}
                            className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none transition-all"
                          >
                            {AVAILABLE_COLORS.map((c) => (
                              <option key={c.hex} value={c.hex} style={{ backgroundColor: '#171b26' }}>
                                {c.name}
                              </option>
                            ))}
                            <option value="otro" style={{ backgroundColor: '#171b26' }}>
                              Otro color / Personalizado...
                            </option>
                          </select>
                        </div>
                      </div>

                      {!isVehPreset && (
                        <div className="space-y-1 bg-[#1a2030] p-2.5 border border-[#2d364f] rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
                          <label className="text-[9px] font-bold text-orange-400 uppercase tracking-widest block mb-1">
                            Especifique el color personalizado
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Verde Eléctrico, Plateado..."
                            value={v.color}
                            onChange={(e) => handleUpdateVehicle(idx, 'color', e.target.value)}
                            className="w-full bg-[#141926] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            VIN / Nro Chasis (Chapa)
                          </label>
                          <input
                            type="text"
                            placeholder="Nro Serial Chasis"
                            value={v.vin}
                            onChange={(e) => handleUpdateVehicle(idx, 'vin', e.target.value)}
                            className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-gray-500 font-mono outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Km Iniciales</label>
                          <input
                            type="number"
                            placeholder="Ej: 110000"
                            value={v.km}
                            onChange={(e) =>
                              handleUpdateVehicle(
                                idx,
                                'km',
                                e.target.value === '' ? '' : Number(e.target.value)
                              )
                            }
                            className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Inspección / Diagnóstico Inicial
                        </label>
                        <textarea
                          placeholder="Abolladuras, ruidos raros, requerimiento específico..."
                          value={v.observaciones}
                          onChange={(e) => handleUpdateVehicle(idx, 'observaciones', e.target.value)}
                          className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-gray-500 min-h-[50px] outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#1e2436] border-t border-[#2d364f] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-xl transition-all">
            Cancelar
          </button>
          <button type="submit" className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-all">
            <Save className="w-4 h-4" />
            {cliente ? 'Guardar Cambios' : 'Registrar Cliente'}
          </button>
        </div>

      </form>
    </div>
  );
}

/* ==========================================
   VEHÍCULO FORM MODAL
   ========================================== */
interface VehiculoModalProps {
  vehiculo: Vehiculo | null;
  clientes: Cliente[];
  onSave: (data: Omit<Vehiculo, 'id' | 'fechaReg'>) => void;
  onClose: () => void;
}

export function VehiculoModal({ vehiculo, clientes, onSave, onClose }: VehiculoModalProps) {
  const [clienteId, setClienteId] = useState(vehiculo?.clienteId || '');
  const [marca, setMarca] = useState(vehiculo?.marca || '');
  const [modelo, setModelo] = useState(vehiculo?.modelo || '');
  const [anio, setAnio] = useState<number | ''>(vehiculo?.anio || '');
  const [placa, setPlaca] = useState(vehiculo?.placa || '');
  const [color, setColor] = useState(vehiculo?.color || '#6b7280');
  const [vin, setVin] = useState(vehiculo?.vin || '');
  const [km, setKm] = useState<number | ''>(vehiculo?.km || 0);
  const [observaciones, setObservaciones] = useState(vehiculo?.observaciones || '');

  const isPreset = AVAILABLE_COLORS.some(c => c.hex.toLowerCase() === color.toLowerCase());

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!marca.trim() || !modelo.trim() || !placa.trim()) {
      alert('La marca, modelo y placa son campos requeridos.');
      return;
    }
    onSave({
      clienteId,
      marca,
      modelo,
      anio: anio === '' ? null : Number(anio),
      placa: placa.toUpperCase(),
      color,
      vin: vin.toUpperCase(),
      km: km === '' ? 0 : Number(km),
      observaciones
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-[#171b26] border border-[#2d364f] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 bg-[#1e2436] border-b border-[#2d364f] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm uppercase tracking-wider">{vehiculo ? 'Ficha Auto: Editar' : 'Registrar Nuevo Auto'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Propietario / Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
            >
              <option value="">Seleccionar y vincular propietario...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.cedula})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marca *</label>
              <input
                type="text"
                required
                placeholder="Ej: Toyota"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Modelo *</label>
              <input
                type="text"
                required
                placeholder="Ej: Corolla"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Placa / Patente *</label>
              <input
                type="text"
                required
                placeholder="Ej: AB123CD"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 font-mono outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Año</label>
              <input
                type="number"
                placeholder="Ej: 2018"
                value={anio}
                onChange={(e) => setAnio(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Color Pintura</label>
              <select
                value={isPreset ? color : 'otro'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'otro') {
                    setColor('');
                  } else {
                    setColor(val);
                  }
                }}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
              >
                {AVAILABLE_COLORS.map(c => (
                  <option key={c.hex} value={c.hex} style={{ backgroundColor: '#171b26' }}>{c.name}</option>
                ))}
                <option value="otro" style={{ backgroundColor: '#171b26' }}>Otro color / Personalizado...</option>
              </select>
            </div>
          </div>

          {!isPreset && (
            <div className="space-y-1 bg-[#1a2030] p-3.5 border border-[#2d364f] rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="text-xs font-bold text-orange-400 uppercase tracking-widest block mb-1">Especifique el color personalizado</label>
              <input
                type="text"
                required
                placeholder="Ej: Verde Eléctrico, Vinotinto Perlado, Dorado..."
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-[#141926] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">VIN / Nro Chasis (Chapa)</label>
              <input
                type="text"
                placeholder="Nro Serial Chasis"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 font-mono outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Km Iniciales en Taller</label>
              <input
                type="number"
                placeholder="Ej: 110000"
                value={km}
                onChange={(e) => setKm(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inspección de Diagnóstico / Síntomas Iniciales</label>
            <textarea
              placeholder="Indique abolladuras, ruidos raros en tren delantero, mangueras resecas, detalles estéticos..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 min-h-[70px] outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-[#1e2436] border-t border-[#2d364f] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-xl transition-all">
            Cancelar
          </button>
          <button type="submit" className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-all">
            <Save className="w-4 h-4" />
            {vehiculo ? 'Modificar Registro' : 'Inscribir Auto'}
          </button>
        </div>

      </form>
    </div>
  );
}


/* ==========================================
   REPUESTO FORM MODAL
   ========================================== */
interface RepuestoModalProps {
  repuesto: Repuesto | null;
  onSave: (data: Omit<Repuesto, 'id' | 'codigo' | 'fechaIngreso'>) => void;
  onClose: () => void;
}

export function RepuestoModal({ repuesto, onSave, onClose }: RepuestoModalProps) {
  const [nombre, setNombre] = useState(repuesto?.nombre || '');
  const [referencia, setReferencia] = useState(repuesto?.referencia || '');
  const [categoria, setCategoria] = useState(repuesto?.categoria || 'General');
  const [proveedor, setProveedor] = useState(repuesto?.proveedor || '');
  const [cantidad, setCantidad] = useState<number>(repuesto?.cantidad || 0);
  const [stockMin, setStockMin] = useState<number>(repuesto?.stockMin || 2);
  const [precio, setPrecio] = useState<number>(repuesto?.precio || 0);
  const [ubicacion, setUbicacion] = useState(repuesto?.ubicacion || '');

  const categories = [
    'Motor', 'Frenos', 'Suspensión', 'Transmisión', 'Eléctrico',
    'Carrocería', 'Filtros', 'Lubricantes', 'Rodamientos', 'General'
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Debe colocar un nombre descriptivo al repuesto.');
      return;
    }
    onSave({ nombre, referencia, categoria, proveedor, cantidad, stockMin, precio, ubicacion });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-[#171b26] border border-[#2d364f] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 bg-[#1e2436] border-b border-[#2d364f] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm uppercase tracking-wider">{repuesto ? 'Editar Ficha Repuesto' : 'Introducir Nuevo Repuesto'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre del Repuesto *</label>
              <input
                type="text"
                required
                placeholder="Ej: Pastillas Freno Delanteras"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nro de Parte / Referencia</label>
              <input
                type="text"
                placeholder="Ej: SP-543 / 90915"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 font-mono outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría Almacén</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2.5 px-3 text-xs text-white outline-none transition-all"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proveedor Recomendado</label>
              <input
                type="text"
                placeholder="Distribuidora C.A."
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cantidad Inicial</label>
              <input
                type="number"
                min={0}
                required
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alerta Límite Mínimo</label>
              <input
                type="number"
                min={1}
                required
                value={stockMin}
                onChange={(e) => setStockMin(Number(e.target.value))}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Precio de Venta ($) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))}
                className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ubicación Física en Almacén</label>
            <input
              type="text"
              placeholder="Ej: Pasillo A - Estante 2 - Nivel B"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-[#1e2436] border-t border-[#2d364f] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-xl transition-all">
            Cancelar
          </button>
          <button type="submit" className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-all">
            <Save className="w-4 h-4" />
            {repuesto ? 'Modificar Repuesto' : 'Introducir Repuesto'}
          </button>
        </div>

      </form>
    </div>
  );
}


/* ==========================================
   REABASTECER (INFLUX QUANTITY) MODAL
   ========================================== */
interface ReabastecerModalProps {
  repuesto: Repuesto;
  onConfirm: (qty: number, note: string) => void;
  onClose: () => void;
}

export function ReabastecerModal({ repuesto, onConfirm, onClose }: ReabastecerModalProps) {
  const [qtyToAdd, setQtyToAdd] = useState<number>(5);
  const [nota, setNota] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (qtyToAdd <= 0) {
      alert('Debe reabastecer al menos 1 unidad de material.');
      return;
    }
    onConfirm(qtyToAdd, nota);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#171b26] border border-[#2d364f] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-5 py-3.5 bg-[#1e2436] border-b border-[#2d364f] flex items-center justify-between text-white">
          <span className="font-bold text-xs uppercase tracking-wider">Ingreso de Materiales (Stock)</span>
          <button type="button" onClick={onClose} className="p-1 rounded bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-[#1e2436] rounded-xl border border-dashed border-orange-500/20">
            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Material Seleccionado</span>
            <p className="text-xs font-black text-white mt-1 truncate">{repuesto.nombre}</p>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">Stock en bodega actual: {repuesto.cantidad} unidades</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cantidad a Ingresar *</label>
            <input
              type="number"
              min={1}
              required
              value={qtyToAdd}
              onChange={(e) => setQtyToAdd(Number(e.target.value))}
              className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nro de Factura u Origen</label>
            <input
              type="text"
              placeholder="Ej: Factura Compra #1283 — Proveedor XYZ"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full bg-[#1e2436] border border-[#2d364f] focus:border-orange-500 rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[#1e2436] border-t border-[#2d364f] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3.5 py-1.5 bg-gray-850 text-gray-400 hover:text-white font-bold text-xs rounded-xl">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all">
            ✔ Registrar Cierre
          </button>
        </div>

      </form>
    </div>
  );
}
