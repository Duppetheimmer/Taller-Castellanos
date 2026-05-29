import { useState, FormEvent, useMemo } from 'react';
import { Trabajador, OrdenTrabajo, Vehiculo } from '../types';
import { Users, Plus, Trash2, Phone, Briefcase, Calendar, ShieldAlert, Edit2 } from 'lucide-react';

interface TrabajadoresViewProps {
  trabajadores: Trabajador[];
  ordenes: OrdenTrabajo[];
  vehiculos: Vehiculo[];
  onAddTrabajador: (data: Omit<Trabajador, 'id' | 'fechaIngreso'>) => void;
  onUpdateTrabajador: (id: string, data: Omit<Trabajador, 'id' | 'fechaIngreso'>) => void;
  onDeleteTrabajador: (id: string) => void;
}

export default function TrabajadoresView({
  trabajadores,
  ordenes,
  vehiculos,
  onAddTrabajador,
  onUpdateTrabajador,
  onDeleteTrabajador
}: TrabajadoresViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('Mecánica General');
  const [telefono, setTelefono] = useState('');

  const activeOrdersByWorker = useMemo(() => {
    const map: Record<string, OrdenTrabajo[]> = {};
    ordenes.forEach(o => {
      if (o.trabajadorId) {
        if (!map[o.trabajadorId]) map[o.trabajadorId] = [];
        map[o.trabajadorId].push(o);
      }
    });
    return map;
  }, [ordenes]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      alert('Por favor complete todos los datos.');
      return;
    }

    if (editingWorkerId) {
      onUpdateTrabajador(editingWorkerId, {
        nombre: nombre.trim(),
        especialidad,
        telefono: telefono.trim()
      });
      setEditingWorkerId(null);
    } else {
      onAddTrabajador({
        nombre: nombre.trim(),
        especialidad,
        telefono: telefono.trim()
      });
    }

    setNombre('');
    setTelefono('');
    setEspecialidad('Mecánica General');
    setShowAddForm(false);
  };

  const handleStartEdit = (worker: Trabajador) => {
    setEditingWorkerId(worker.id);
    setNombre(worker.nombre);
    setEspecialidad(worker.especialidad);
    setTelefono(worker.telefono);
    setShowAddForm(true);
  };

  const handleToggleForm = () => {
    if (showAddForm) {
      setEditingWorkerId(null);
      setNombre('');
      setTelefono('');
      setEspecialidad('Mecánica General');
      setShowAddForm(false);
    } else {
      setShowAddForm(true);
    }
  };

  const getVehiclePlaca = (autoId: string) => {
    const found = vehiculos.find(v => v.id === autoId);
    return found ? found.placa : 'S/N';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100/45 text-slate-900 select-none font-sans">
      {/* Header */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-900 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Control del Personal Técnico
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono uppercase tracking-wider">
            Gestión de trabajadores y cargas de órdenes activas
          </p>
        </div>
        <button
          onClick={handleToggleForm}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 border-2 border-white text-white rounded-none font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] active:translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cerrar Formulario' : 'Registrar Trabajador'}
        </button>
      </div>

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Form Overlay in page */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-6 bg-white border-2 border-slate-950 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4 max-w-xl animate-in slide-in-from-top-4 duration-200">
            <h3 className="font-black text-sm text-slate-900 uppercase border-b border-dashed border-slate-300 pb-2 flex items-center gap-2 font-mono">
              {editingWorkerId ? `✏️ Editar Técnico ${editingWorkerId}` : '⚙️ Ficha de Nuevo Trabajador'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Pedro Pérez"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-none p-2 text-xs focus:bg-white focus:ring-0 focus:outline-none font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Teléfono Móvil *</label>
                <input
                  type="text"
                  required
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="Ej: 0412-1234567"
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-none p-2 text-xs focus:bg-white focus:ring-0 focus:outline-none font-sans"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">Especialidad Principal *</label>
              <select
                value={especialidad}
                onChange={e => setEspecialidad(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-900 rounded-none p-2 text-xs focus:bg-white focus:ring-0 focus:outline-none font-sans"
              >
                <option value="Mecánica General">Mecánica General</option>
                <option value="Sistemas Eléctricos">Sistemas Eléctricos</option>
                <option value="Alineación y Balanceo">Alineación y Balanceo</option>
                <option value="Latonería y Pintura">Latonería y Pintura</option>
                <option value="Diagnóstico de Escáner">Diagnóstico de Escáner</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingWorkerId(null);
                  setNombre('');
                  setTelefono('');
                  setEspecialidad('Mecánica General');
                  setShowAddForm(false);
                }}
                className="px-3 py-1.5 border-2 border-slate-950 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-2 border-slate-950 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              >
                {editingWorkerId ? 'Actualizar Ficha' : 'Guardar Ficha'}
              </button>
            </div>
          </form>
        )}

        {/* Worker roster cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trabajadores.map(worker => {
            const assigned = activeOrdersByWorker[worker.id] || [];
            const activeOnes = assigned.filter(o => o.estado !== 'terminada');
            const completedOnes = assigned.filter(o => o.estado === 'terminada');

            // Load exchange rate dynamically
            const tasaUSDT = (() => {
              try {
                const saved = localStorage.getItem('castellanos_tasa_usdt');
                return parseFloat(saved || '44.50') || 44.50;
              } catch {
                return 44.50;
              }
            })();

            // Calculate total labor produced
            const totalUSD = completedOnes.reduce((sum, o) => sum + (o.laborCost || 0), 0);
            const totalVES = totalUSD * tasaUSDT;

            return (
              <div
                key={worker.id}
                className="bg-white border-2 border-slate-950 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] divide-y-2 divide-slate-150 flex flex-col"
              >
                {/* ID & Title */}
                <div className="p-4 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] bg-slate-900 text-white px-2 py-0.5 font-bold uppercase">
                      {worker.id}
                    </span>
                    <span className="font-sans font-bold text-xs text-slate-800">
                      Técnico Registrado
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(worker)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-600/20 transition-all cursor-pointer"
                      title="Editar Datos Básicos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTrabajador(worker.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-600/20 transition-all cursor-pointer"
                      title="Eliminar Trabajador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4 space-y-2.5 flex-1">
                  <h4 className="font-black text-sm text-slate-900 uppercase">
                    {worker.nombre}
                  </h4>
                  <div className="space-y-1.5 font-mono text-[10px] text-slate-600 uppercase">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      <span>Especialidad: <strong className="text-slate-800">{worker.especialidad}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      <span>Teléfono: <strong className="text-slate-800">{worker.telefono}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>F. Ingreso: <strong className="text-slate-800">{worker.fechaIngreso}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Labor production financial dashboard metrics */}
                <div className="p-4 bg-emerald-50/50 border-t border-b border-dashed border-emerald-900/10 font-mono text-[10px] flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-emerald-800 font-extrabold uppercase block tracking-wider">Mano de Obra Producida</span>
                    <span className="text-[8px] text-slate-500 block">Acumulado de {completedOnes.length} trabajos completados</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-900 font-black text-xs block">
                      Bs. {totalVES.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8px] text-emerald-700 font-bold block italic">
                      Ref: ${totalUSD.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </span>
                  </div>
                </div>

                {/* Workloads status */}
                <div className="p-4 bg-slate-50/60 font-mono text-[10px] space-y-2">
                  <div className="flex items-center justify-between font-bold text-[9px] uppercase tracking-wider text-slate-500 pb-1 border-b border-dashed border-slate-200">
                    <span>Historial y Cargas de Trabajo</span>
                    <span className={`px-1.5 py-0.2 rounded-none text-white font-mono text-[8.5px] ${
                      activeOnes.length > 2 ? 'bg-orange-600' : activeOnes.length > 0 ? 'bg-blue-600' : 'bg-slate-500'
                    }`}>
                      {activeOnes.length} Activas
                    </span>
                  </div>
                  {assigned.length === 0 ? (
                    <p className="text-slate-400 italic text-[10px] py-1">Sin historial de órdenes asignadas</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {assigned.map(ord => {
                        const jobVES = (ord.laborCost || 0) * tasaUSDT;
                        return (
                          <div key={ord.id} className="p-2 bg-white border border-slate-200 text-slate-700 space-y-1">
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="font-bold text-slate-900">{ord.id} (Placa: {getVehiclePlaca(ord.autoId)})</span>
                              <span className={`uppercase text-[8px] font-black px-1 ${
                                ord.estado === 'terminada' ? 'bg-emerald-100 text-emerald-800' : ord.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                              }`}>{ord.estado === 'terminada' ? 'Terminado' : ord.estado === 'en_proceso' ? 'En Proceso' : 'Abierta'}</span>
                            </div>
                            <p className="text-[8.5px] leading-relaxed text-slate-500 line-clamp-2 font-sans">{ord.descripcion}</p>
                            <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono pt-1 border-t border-slate-100 border-dashed">
                              <span>F: {ord.fecha}</span>
                              <span className="text-slate-800 font-extrabold text-[8.5px]">
                                Bs. {jobVES.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-slate-500 font-normal"> (${(ord.laborCost || 0).toLocaleString('es')} USD)</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {trabajadores.length === 0 && (
            <div className="col-span-full py-12 bg-white border-2 border-dashed border-slate-300 text-center text-slate-500 space-y-3">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs uppercase font-mono font-bold tracking-wider">No hay trabajadores registrados en la base de datos.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-mono font-bold hover:bg-slate-800 active:translate-y-0.5"
              >
                Añadir Primer Integrante
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
