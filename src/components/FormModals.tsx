import { useState, useEffect, FormEvent } from 'react';
import { Cliente, Vehiculo, Repuesto } from '../types';
import { X, Save, User, Phone, Mail, Award, MapPin, Calendar, Clipboard, Tag, ShieldAlert } from 'lucide-react';

/* ==========================================
   CLIENTE FORM MODAL
   ========================================== */
interface ClienteModalProps {
  cliente: Cliente | null;
  onSave: (data: Omit<Cliente, 'id' | 'fechaReg'>) => void;
  onClose: () => void;
}

export function ClienteModal({ cliente, onSave, onClose }: ClienteModalProps) {
  const [nombre, setNombre] = useState(cliente?.nombre || '');
  const [telefono, setTelefono] = useState(cliente?.telefono || '');
  const [email, setEmail] = useState(cliente?.email || '');
  const [cedula, setCedula] = useState(cliente?.cedula || '');
  const [nacimiento, setNacimiento] = useState(cliente?.nacimiento || '');
  const [direccion, setDireccion] = useState(cliente?.direccion || '');
  const [observaciones, setObservaciones] = useState(cliente?.observaciones || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }
    onSave({ nombre, telefono, email, cedula, nacimiento, direccion, observaciones });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-[#171b26] border border-[#2d364f] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 bg-[#1e2436] border-b border-[#2d364f] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm uppercase tracking-wider">{cliente ? 'Editar Cliente' : 'Inscribir Nuevo Cliente'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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

  const availableColors = [
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

  const isPreset = availableColors.some(c => c.hex.toLowerCase() === color.toLowerCase());

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
                {availableColors.map(c => (
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
