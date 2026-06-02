import { useState, useMemo, FormEvent } from 'react';
import { OrdenTrabajo, Cliente, Vehiculo, Trabajador, Repuesto, SolicitudRepuesto } from '../types';
import { Wrench, Search, Plus, Printer, RefreshCw, Calendar, Filter, Lock, User, CheckCircle, PackageOpen, ClipboardSignature } from 'lucide-react';

interface OrdersViewProps {
  ordenes: OrdenTrabajo[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  onAddOrden: () => void;
  onVerTicket: (id: string) => void;
  onAvanzarEstado: (id: string) => void;
  onDeleteOrden: (id: string) => void;
  isAdmin: boolean;
  onTriggerAdminLogin: () => void;
  
  // Role based interactive props
  userRole: 'administrador' | 'recepcionista' | 'trabajador';
  trabajadores: Trabajador[];
  solicitudes: SolicitudRepuesto[];
  activeWorkerId: string;
  onAcceptOrder: (orderId: string) => void;
  onDiagnosticUpdate: (orderId: string, diagnosticText: string) => void;
  onRequestRepuesto: (orderId: string, repuestoId: string, qty: number) => void;
  repuestosInventario: Repuesto[];
  onChangeActiveWorkerId?: (id: string) => void;
}

export default function OrdersView({
  ordenes,
  clientes,
  vehiculos,
  onAddOrden,
  onVerTicket,
  onAvanzarEstado,
  onDeleteOrden,
  isAdmin,
  onTriggerAdminLogin,
  userRole,
  trabajadores,
  solicitudes,
  activeWorkerId,
  onAcceptOrder,
  onDiagnosticUpdate,
  onRequestRepuesto,
  repuestosInventario,
  onChangeActiveWorkerId
}: OrdersViewProps) {
  const [filterState, setFilterState] = useState<'Todas' | 'abierta' | 'en_proceso' | 'terminada'>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Worker-specific tab state and statistics
  const openJobsCount = useMemo(() => {
    return ordenes.filter(o => !o.trabajadorId && o.estado !== 'terminada').length;
  }, [ordenes]);

  const myActiveJobsCount = useMemo(() => {
    return ordenes.filter(o => o.trabajadorId === activeWorkerId && o.estado !== 'terminada').length;
  }, [ordenes, activeWorkerId]);

  const [workerTab, setWorkerTab] = useState<'disponibles' | 'mios' | 'todos'>(() => {
    const activeCount = ordenes.filter(o => o.trabajadorId === activeWorkerId && o.estado !== 'terminada').length;
    const availCount = ordenes.filter(o => !o.trabajadorId && o.estado !== 'terminada').length;
    if (activeCount > 0) return 'mios';
    if (availCount > 0) return 'disponibles';
    return 'todos';
  });

  // Diagnostic editor state
  const [editingDiagOrderId, setEditingDiagOrderId] = useState<string | null>(null);
  const [diagnosticInput, setDiagnosticInput] = useState('');

  // Request part state
  const [requestPartOrderId, setRequestPartOrderId] = useState<string | null>(null);
  const [selectedRepuestoId, setSelectedRepuestoId] = useState('');
  const [requestedQty, setRequestedQty] = useState(1);
  const [partRequestSearch, setPartRequestSearch] = useState('');

  // Real-time filter for spare parts requested by mechanic
  const filteredRepuestosInventario = useMemo(() => {
    const q = partRequestSearch.toLowerCase().trim();
    if (!q) return repuestosInventario;
    return repuestosInventario.filter(part => 
      part.nombre.toLowerCase().includes(q) ||
      part.codigo.toLowerCase().includes(q) ||
      (part.referencia && part.referencia.toLowerCase().includes(q)) ||
      (part.categoria && part.categoria.toLowerCase().includes(q))
    );
  }, [partRequestSearch, repuestosInventario]);

  // Find details for rows
  const clientOf = (cId: string) => clientes.find(c => c.id === cId);
  const vehicleOf = (aId: string) => vehiculos.find(v => v.id === aId);
  const workerOf = (wId?: string) => trabajadores.find(t => t.id === wId);

  // Filter combined
  const filteredOrders = useMemo(() => {
    let list = [...ordenes].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    
    // Support worker specific tab filter
    if (userRole === 'trabajador') {
      if (workerTab === 'disponibles') {
        list = list.filter(o => !o.trabajadorId && o.estado !== 'terminada');
      } else if (workerTab === 'mios') {
        list = list.filter(o => o.trabajadorId === activeWorkerId);
      }
    }

    if (filterState !== 'Todas') {
      list = list.filter(o => o.estado === filterState);
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(o => {
        const client = clientOf(o.clienteId)?.nombre || '';
        const vehicle = vehicleOf(o.autoId);
        const autoName = vehicle ? `${vehicle.marca} ${vehicle.modelo}` : '';
        const plateStr = vehicle ? vehicle.placa : '';
        const diagStr = o.diagnostico || '';

        return (
          o.id.toLowerCase().includes(q) ||
          o.descripcion.toLowerCase().includes(q) ||
          diagStr.toLowerCase().includes(q) ||
          client.toLowerCase().includes(q) ||
          autoName.toLowerCase().includes(q) ||
          plateStr.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [ordenes, filterState, searchQuery, clientes, vehiculos, userRole, workerTab, activeWorkerId]);

  // Translate status text
  const stateLabel = (s: string) => {
    const labels: Record<string, string> = {
      abierta: 'Abierta / Diagnóstico',
      en_proceso: 'Taller / Reparación',
      terminada: 'Completada',
    };
    return labels[s] || s;
  };

  const handleDeleteClick = (id: string) => {
    if (!isAdmin) {
      alert('La eliminación de órdenes de trabajo es un acto administrativo crítico. Inicie sesión como admin para proceder.');
      onTriggerAdminLogin();
      return;
    }
    onDeleteOrden(id);
  };

  // Submit diagnostic update
  const handleSaveDiag = (orderId: string) => {
    onDiagnosticUpdate(orderId, diagnosticInput.trim());
    setEditingDiagOrderId(null);
    setDiagnosticInput('');
    alert('Diagnóstico/Avance actualizado de forma exitosa.');
  };

  // Submit part request
  const handleRequestPartSubmit = (e: FormEvent, orderId: string) => {
    e.preventDefault();
    if (!selectedRepuestoId) {
      alert('Debe elegir un repuesto de la lista.');
      return;
    }
    if (requestedQty < 1) {
      alert('Cantidad inválida.');
      return;
    }

    onRequestRepuesto(orderId, selectedRepuestoId, requestedQty);
    setRequestPartOrderId(null);
    setSelectedRepuestoId('');
    setRequestedQty(1);
    setPartRequestSearch('');
  };

  // Current worker's profile
  const activeWorker = workerOf(activeWorkerId);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100/45 text-slate-900 select-none font-sans">
      
      {/* Top Header */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-900 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            {userRole === 'trabajador' ? 'Órdenes Activas en Taller' : 'Órdenes de Trabajo & Diagnósticos'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono uppercase tracking-wider">
            {userRole === 'trabajador' 
              ? `Vista del operario mecánico: ${activeWorker?.nombre || 'General'} | Consulte autos asignados y solicite repuestos.` 
              : 'Gestione ingresos, asigne mecánicos a cargo, solicite repuestos y despache boletas.'}
          </p>
        </div>
        
        {userRole !== 'trabajador' && (
          <button
            onClick={onAddOrden}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] tracking-wider uppercase transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Orden de Ingreso
          </button>
        )}
      </div>

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* OPERATOR WORKFLOW SUB-TABS */}
        {userRole === 'trabajador' && (
          <div className="space-y-4">
            
            {/* COMPACT ELECTRONIC INDUSTRIAL ROSTER BADGES */}
            <div className="bg-slate-900 border-2 border-slate-950 p-4 font-mono text-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
              
              {/* WARNING INDUSTRIAL ROW HEAD */}
              <div className="bg-amber-500 text-slate-950 p-2.5 text-[10px] font-black uppercase tracking-wider flex flex-col sm:flex-row items-center justify-between gap-1 border-b-2 border-slate-950">
                <span className="flex items-center gap-1.5 font-sans">
                  <span className="inline-block bg-slate-950 text-amber-500 px-1.5 py-0.5 text-[9px] font-mono font-black">MÓDULO TALLER</span>
                  <span>PREVENCIÓN DE ERRORES: VERIFIQUE SU IDENTIDAD ANTES DE OPERAR</span>
                </span>
                <span className="bg-slate-950 text-white px-2 py-0.5 font-mono text-[9px] tracking-widest font-bold">DISPOSITIVO COMPARTIDO</span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                      🛠️ SELECCIONE SU NOMBRE DE LA LISTA:
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    Toque su tarjeta para activarse como operador activo de la sesión.
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {trabajadores.map(trab => {
                    const isActive = trab.id === activeWorkerId;
                    const activeJobs = ordenes.filter(o => o.trabajadorId === trab.id && o.estado !== 'terminada').length;
                    return (
                      <button
                        key={trab.id}
                        type="button"
                        onClick={() => {
                          if (onChangeActiveWorkerId) {
                            onChangeActiveWorkerId(trab.id);
                          }
                        }}
                        className={`flex flex-col items-center justify-between p-3.5 rounded-none border-2 transition-all cursor-pointer select-none text-center ${
                          isActive
                            ? 'bg-blue-600/10 border-blue-500 scale-[1.01] shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] text-white'
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex flex-col items-center w-full">
                          {/* Worker avatar tag style */}
                          <div className={`w-9 h-9 rounded-none flex items-center justify-center font-black text-xs uppercase mb-2 border-2 ${
                            isActive ? 'bg-blue-600 text-white border-blue-400 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {trab.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>

                          <span className="font-extrabold text-[11px] uppercase tracking-tight block truncate max-w-full leading-tight text-white mb-0.5">
                            {trab.nombre}
                          </span>
                          
                          <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 border ${
                            isActive ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            {trab.especialidad}
                          </span>
                        </div>

                        <div className="mt-4 pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-1.5 text-[9px]">
                          <span className={`w-2 h-2 rounded-none shrink-0 ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`}></span>
                          <span className="font-bold">
                            {isActive ? 'SESIÓN ACTIVA' : 'INACTIVO'}
                          </span>
                          <span className="text-slate-500 font-normal">
                             ({activeJobs} trab)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* MAIN WORKER TABS: MY WORK vs OPEN TO TAKE */}
            <div className="bg-slate-900 border-2 border-slate-950 p-4 font-mono text-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
                    Bandeja De Tareas Para: <span className="text-blue-400 font-extrabold">{activeWorker?.nombre || 'Técnico de Turno'}</span>
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase font-bold bg-slate-950 px-2 py-0.5 border border-slate-850">
                  Especialidad: {activeWorker?.especialidad || 'General'}
                </span>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              
              <button
                type="button"
                onClick={() => setWorkerTab('mios')}
                className={`flex items-center justify-between gap-3 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  workerTab === 'mios'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🛠️</span>
                  <span>Mis Trabajos Asignados</span>
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold ${workerTab === 'mios' ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-300'}`}>
                  {myActiveJobsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWorkerTab('disponibles')}
                className={`flex items-center justify-between gap-3 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative ${
                  workerTab === 'disponibles'
                    ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                {openJobsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <span>⭐</span>
                  <span>Tomar Nuevo Trabajo</span>
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold ${workerTab === 'disponibles' ? 'bg-slate-950 text-amber-500' : 'bg-slate-800 text-slate-300'}`}>
                  {openJobsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWorkerTab('todos')}
                className={`flex items-center justify-between gap-3 px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  workerTab === 'todos'
                    ? 'bg-[#1e293b] border-slate-700 text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>👥</span>
                  <span>Ver Todos los Trabajos</span>
                </span>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px] font-bold">
                  {ordenes.length}
                </span>
              </button>

            </div>
          </div>
        </div>
        )}

        {/* Controls block filter */}
        <div className="p-4 sm:p-6 bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col lg:flex-row gap-5 items-center justify-between">
          
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="BUSCAR ORDEN, PLACA, FALLA, PARTE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-900 rounded-none py-2.5 pl-10 pr-4 text-xs text-slate-900 font-mono uppercase tracking-wider placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
            <Search className="absolute left-3.5 top-3.5 text-slate-900 w-4 h-4" />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto font-mono text-[10px] uppercase">
            <span className="text-slate-400 font-bold tracking-widest flex items-center gap-1 leading-none">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Ver Categoría:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(['Todas', 'abierta', 'en_proceso', 'terminada'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterState(st)}
                  className={`px-3 py-1.5 border-2 text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer ${
                    filterState === st
                      ? 'bg-slate-900 border-slate-900 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'Todas' ? 'Todas' : stateLabel(st)}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Master list of orders render */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white border-2 border-slate-900 p-16 text-center text-slate-500 text-xs font-mono uppercase tracking-widest leading-relaxed">
              No hay órdenes de servicio con las condiciones especificadas.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredOrders.map(o => {
                const client = clientOf(o.clienteId);
                const vehicle = vehicleOf(o.autoId);
                const assignedWorker = workerOf(o.trabajadorId);
                
                const subPartsSum = o.repuestos.reduce((s, r) => s + r.precio * r.qty, 0);
                const totalInvoice = subPartsSum + (o.laborCost || 0);

                const isAssignedToMe = o.trabajadorId === activeWorkerId;
                const isAssignedToOther = o.trabajadorId && o.trabajadorId !== activeWorkerId;

                const needsTechnician = !o.trabajadorId;

                return (
                  <div 
                    key={o.id} 
                    className={`bg-white border-2 rounded-none divide-y-2 divide-slate-100 flex flex-col text-slate-900 transition-all ${
                      needsTechnician
                        ? 'border-amber-400 shadow-[5px_5px_0px_0px_rgba(245,158,11,1)]'
                        : isAssignedToMe
                        ? 'border-blue-600 shadow-[5px_5px_0px_0px_rgba(37,99,235,1)] ring-4 ring-blue-50/70'
                        : 'border-slate-950 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)]'
                    }`}
                  >
                    {/* Header: ID, Status Badge & Mechanic info */}
                    <div className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-700 ${
                      needsTechnician ? 'bg-amber-50 text-amber-900' : isAssignedToMe ? 'bg-blue-50 text-blue-950' : 'bg-slate-50'
                    }`}>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1">
                          {o.id}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] bg-white border-2 text-slate-800 font-bold uppercase tracking-wider font-mono ${
                          o.estado === 'terminada' ? 'border-emerald-600 text-emerald-800 bg-emerald-50' :
                          o.estado === 'en_proceso' ? 'border-blue-600 text-blue-800 bg-blue-550/5' :
                          'border-amber-500 text-amber-800 bg-amber-50'
                        }`}>
                          ● {stateLabel(o.estado)}
                        </span>
                        
                        {/* Worker Badge */}
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-500">Técnico Asignado:</span>
                          {assignedWorker ? (
                            <strong className="text-slate-950 bg-blue-50 px-2 py-0.5 border border-blue-200">
                              {assignedWorker.nombre} ({assignedWorker.especialidad})
                            </strong>
                          ) : (
                            <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200">
                              Por asignar
                            </strong>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Fecha: {o.fecha.split('-').reverse().join('/')}</span>
                      </div>
                    </div>

                    {/* Active Assignment Operator Action Box */}
                    {needsTechnician && (
                      <div className="p-4 sm:px-6 bg-amber-500/10 border-b-2 border-amber-400 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
                        <div className="space-y-1">
                          <h4 className="font-extrabold uppercase text-amber-800 flex items-center gap-1.5 leading-none">
                            ⭐ ¡SERVICIO LIBRE DISPONIBLE EN EL TALLER!
                          </h4>
                          <p className="text-[10px] text-amber-700 font-medium">
                            Ningún técnico tiene asignado este automóvil. Presione el botón de la derecha para hacerse responsable de esta orden.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Confirma que desea tomar la reparación de este vehículo ${vehicle ? `${vehicle.marca} (${vehicle.placa})` : ''}?`)) {
                              onAcceptOrder(o.id);
                            }
                          }}
                          className="w-full md:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 font-black text-[11px] uppercase border-2 border-slate-950 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] cursor-pointer text-slate-950 flex items-center justify-center gap-2 active:translate-y-0.5 transition-all shrink-0"
                        >
                          <span>🙋 ¡TOMAR TRABAJO Y EMPEZAR!</span>
                        </button>
                      </div>
                    )}

                    {isAssignedToMe && o.estado !== 'terminada' && (
                      <div className="p-4 sm:px-6 bg-blue-500/5 border-b-2 border-blue-400/30 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
                        <div className="space-y-1">
                          <h4 className="font-extrabold uppercase text-blue-900 flex items-center gap-1.5 leading-none">
                            ⚙️ USTED ES EL TÉCNICO A CARGO DE ESTA UNIDAD
                          </h4>
                          <p className="text-[10px] text-blue-700 font-medium">
                            Escriba anotaciones de avance técnica periódicamente o solicite insumos al almacén desde los botones inferiores.
                          </p>
                        </div>
                        <span className="text-[9px] bg-blue-600 text-white font-extrabold px-3 py-1 uppercase tracking-wider border border-blue-700">
                          Operando incide
                        </span>
                      </div>
                    )}

                    {isAssignedToOther && o.estado !== 'terminada' && (
                      <div className="p-4 sm:px-6 bg-rose-500/10 border-b-2 border-rose-400 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
                        <div className="space-y-1">
                          <h4 className="font-extrabold uppercase text-rose-800 flex items-center gap-1.5 leading-none">
                            🚫 OPERADO POR OTRO TÉCNICO: {assignedWorker?.nombre?.toUpperCase() || 'OTRO OPERADOR'}
                          </h4>
                          <p className="text-[10px] text-rose-700 font-medium font-sans">
                            Esta reparación está asignada a su colega. Para evitar errores o duplicaciones, use la barra de selección azul al principio de la página para cambiar a su firma si planea operar este auto.
                          </p>
                        </div>
                        <span className="text-[9px] bg-rose-700 text-white font-black px-3 py-1 uppercase tracking-widest border border-rose-950 shrink-0">
                          PERFIL AJENO
                        </span>
                      </div>
                    )}

                    {/* Content Section: 3 Columns split */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-slate-800">
                      
                      {/* Col 1: Customer & Vehicle */}
                      <div className="space-y-3 border-r-0 md:border-r border-dashed border-slate-200 pr-0 md:pr-4">
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Propietario & Auto</h4>
                        
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">{client ? client.nombre : '—'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 lowercase font-medium">Tlf: {client?.telefono || 'sin número'}</p>
                        </div>

                        <div className="pt-2">
                          <span className="text-xs font-black text-slate-900 block uppercase">
                            🚗 {vehicle ? `${vehicle.marca} ${vehicle.modelo}` : '—'}
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[9px] bg-slate-950 text-white font-black px-1.5 py-0.5 uppercase">
                              Placa: {vehicle?.placa || 'S/N'}
                            </span>
                            <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 border border-slate-200">
                              Km: {(o.kmIngreso || 0).toLocaleString('es')} km
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Service Description & Diagnostic */}
                      <div className="space-y-3 md:col-span-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reporte Técnico Inicial</h4>
                          <p className="text-xs font-bold text-slate-900 uppercase leading-snug whitespace-pre-line">
                            {o.descripcion}
                          </p>
                          {o.observaciones && (
                            <p className="text-[10px] text-slate-400 italic">
                              Observaciones recepcionista: {o.observaciones}
                            </p>
                          )}
                        </div>

                        {/* WORKER DIAGNOSTIC LOG FIELD */}
                        <div className="p-3 bg-slate-50 border border-slate-200 mt-3">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                            <ClipboardSignature className="w-3.5 h-3.5 text-blue-500" />
                            Bitácora del Mecánico a Cargo:
                          </h5>
                          {o.diagnostico ? (
                            <p className="text-[10px] font-bold text-slate-800 uppercase leading-relaxed italic">
                              &ldquo;{o.diagnostico}&rdquo;
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">La unidad no cuenta con diagnósticos agregados por el mecánico asignado.</p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Order costs recap list drawer */}
                    {o.repuestos.length > 0 && (
                      <div className="px-4 sm:px-6 py-3 bg-slate-50/50 border-t border-slate-100 font-mono text-[10.5px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Insumos y Repuestos Cargados:</span>
                        <div className="flex flex-wrap gap-2">
                          {o.repuestos.map((p, idx) => (
                            <span key={idx} className="bg-white border border-slate-300 text-slate-750 px-2 py-0.5 uppercase font-bold">
                              📦 {p.nombre} (x{p.qty}) — ${p.precio.toLocaleString('es')} c/u
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Operational Actions Area based on role */}
                    <div className="p-4 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                      
                      {/* Price cost summary */}
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] uppercase text-slate-400"> Costos Operativos:</div>
                        <div className="font-mono text-sm font-black text-slate-900">
                          Total: <strong className="text-slate-950 font-black">${totalInvoice.toLocaleString('es')}</strong>
                          <span className="text-[9px] text-slate-500 font-medium ml-2">(${o.laborCost} Mano de Obra)</span>
                        </div>
                      </div>

                      {/* ROLE-AWARE OPERATIONS */}
                      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                        
                        {/* --- MECHANIC WORKER WORKFLOW CONTROLS --- */}
                        {userRole === 'trabajador' && (
                          <>
                            {/* Claim/Accept Order */}
                            {!o.trabajadorId && o.estado !== 'terminada' && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Confirma que desea tomar la reparación de este vehículo de forma inmediata?`)) {
                                    onAcceptOrder(o.id);
                                  }
                                }}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 border-2 border-slate-950 text-slate-950 font-black uppercase text-[10px] tracking-wider cursor-pointer transition-all active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                              >
                                🙋 ¡TOMAR TRABAJO!
                              </button>
                            )}

                            {isAssignedToOther && o.estado !== 'terminada' && (
                              <button
                                onClick={() => {
                                  if (confirm(`⚠️ ATENCIÓN DE SEGURIDAD:\nEsta orden está asignada actualmente a: ${assignedWorker?.nombre?.toUpperCase() || 'OTRO OPERADOR'}.\n\n¿Estás seguro de que deseas reasignártela a ti mismo (${activeWorker?.nombre?.toUpperCase()})?`)) {
                                    onAcceptOrder(o.id);
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border-2 border-rose-300 font-extrabold uppercase text-[10px] tracking-wider cursor-pointer transition-all active:translate-y-0.5"
                              >
                                🔄 Reasignarme Trabajo
                              </button>
                            )}

                            {/* Assigned to me: Allow diagnositcs & request parts */}
                            {isAssignedToMe && o.estado !== 'terminada' && (
                              <div className="flex flex-wrap gap-2">
                                {/* Update diagnostics */}
                                <button
                                  onClick={() => {
                                    setEditingDiagOrderId(o.id);
                                    setDiagnosticInput(o.diagnostico || '');
                                  }}
                                  className="px-3 py-1.5 bg-slate-900 border-2 border-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase cursor-pointer"
                                  title="Actualizar hoja de diagnóstico"
                                >
                                  📝 Anotar Avance
                                </button>

                                {/* Request part */}
                                <button
                                  onClick={() => {
                                    setRequestPartOrderId(o.id);
                                    setSelectedRepuestoId('');
                                    setRequestedQty(1);
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 border-2 border-slate-900 text-slate-950 font-black text-[10px] uppercase flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                                >
                                  <span>📦 Solicitar Repuesto</span>
                                </button>

                                {/* Advance job state checkbox link */}
                                <button
                                  onClick={() => onAvanzarEstado(o.id)}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 cursor-pointer flex items-center justify-center"
                                  title="Cambiar estatus de reparación"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                              </div>
                            )}

                            {isAssignedToOther && (
                              <span className="text-[10px] text-slate-400 uppercase italic font-bold">
                                Asignada a {assignedWorker?.nombre}
                              </span>
                            )}

                            {isAssignedToMe && o.estado === 'terminada' && (
                              <span className="text-[10px] text-emerald-600 uppercase font-black flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                Trabajo Terminado / Cerrado
                              </span>
                            )}
                          </>
                        )}


                        {/* --- EXCLUSIVE RECEPCIONIST & ADMIN CONTROLS --- */}
                        {userRole !== 'trabajador' && (
                          <div className="flex items-center gap-1.5">
                            {/* Ver boleta / factura */}
                            <button
                              onClick={() => onVerTicket(o.id)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-800 text-[10px] font-black transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 cursor-pointer"
                              title="Imprimir boleta"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" />
                              Ver Boleta
                            </button>

                            {/* Avanzar fase */}
                            <button
                              onClick={() => onAvanzarEstado(o.id)}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 cursor-pointer flex items-center justify-center"
                              title="Avanzar Fase de Trabajo"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            {/* Eliminar (critical) */}
                            <button
                              onClick={() => handleDeleteClick(o.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border-2 border-slate-900 text-red-650 text-red-600 cursor-pointer flex items-center justify-center text-[10px]"
                              title="Eliminar Orden"
                            >
                              {isAdmin ? '🗑' : <Lock className="w-3.5 h-3.5 text-red-400" />}
                            </button>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Inline Diagnostic Update Drawer */}
                    {editingDiagOrderId === o.id && (
                      <div className="p-4 bg-slate-50 border-t border-slate-900 space-y-3 animate-in fade-in duration-200">
                        <h4 className="text-[10.5px] uppercase font-bold text-slate-700">📝 Actualizar diagnóstico mecánico actual</h4>
                        <textarea
                          rows={3}
                          value={diagnosticInput}
                          onChange={(e) => setDiagnosticInput(e.target.value)}
                          placeholder="Escriba los desperfectos, fallas, repuestos necesarios identificados o progresos de mano de obra..."
                          className="w-full bg-white border-2 border-slate-900 p-2 text-xs focus:ring-0 focus:outline-none uppercase font-mono"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setEditingDiagOrderId(null); setDiagnosticInput(''); }}
                            className="px-3 py-1 border-2 border-slate-900 text-slate-700 text-[10px] font-bold uppercase transition-all bg-white"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveDiag(o.id)}
                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white border-2 border-slate-900 font-bold text-[10px] uppercase shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                          >
                            Guardar Bitácora
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Part Request Form Drawer */}
                    {requestPartOrderId === o.id && (
                      <form 
                        onSubmit={(e) => handleRequestPartSubmit(e, o.id)}
                        className="p-4 bg-slate-50 border-t border-slate-900 space-y-3 animate-in fade-in duration-200"
                      >
                        <h4 className="text-[10.5px] uppercase font-bold text-slate-700 flex items-center gap-1.5">
                          🔑 Solicitar Repuestos de la Estantería a Recepcionistas
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold text-slate-500 block">🔍 Buscador Rápido de Repuestos</label>
                            
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Escriba código, nombre, o aplicación..."
                                value={partRequestSearch}
                                onChange={(e) => setPartRequestSearch(e.target.value)}
                                className="w-full bg-white border-2 border-slate-900 p-1.5 pr-8 text-xs focus:ring-0 focus:outline-none focus:border-blue-600 font-mono"
                              />
                              {partRequestSearch && (
                                <button
                                  type="button"
                                  onClick={() => setPartRequestSearch('')}
                                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-900 text-xs font-bold"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Real-time autocomplete suggestions */}
                            {partRequestSearch.trim() !== '' && (
                              <div className="bg-white border-2 border-slate-900 rounded-none max-h-40 overflow-y-auto divide-y divide-slate-200 mt-1 relative z-10">
                                {filteredRepuestosInventario.length === 0 ? (
                                  <div className="p-2 text-[10px] text-slate-500 italic">No se hallaron repuestos con "{partRequestSearch}"</div>
                                ) : (
                                  filteredRepuestosInventario.slice(0, 5).map(part => (
                                    <button
                                      key={part.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedRepuestoId(part.id);
                                        setPartRequestSearch('');
                                      }}
                                      className={`w-full text-left p-2 hover:bg-slate-50 flex justify-between items-center transition-all ${
                                        selectedRepuestoId === part.id ? 'bg-slate-100 font-bold border-l-4 border-blue-600' : 'text-slate-700'
                                      }`}
                                    >
                                      <div className="text-[10px]">
                                        <span className="font-bold text-slate-900 block leading-tight">{part.nombre}</span>
                                        <span className="text-[9px] text-slate-500 block font-mono">
                                          Código: {part.codigo} {part.referencia ? `| Ref: ${part.referencia}` : ''}
                                        </span>
                                      </div>
                                      <div className="text-right text-[10px] font-mono leading-none">
                                        <span className="text-blue-600 font-bold block mb-0.5">${part.precio.toFixed(2)}</span>
                                        <span className="text-slate-500 text-[9px] block">Disponibles: {part.cantidad}</span>
                                      </div>
                                    </button>
                                  ))
                                )}
                                {filteredRepuestosInventario.length > 5 && (
                                  <div className="p-1 px-2.5 text-center text-[9px] text-blue-600 bg-slate-50 border-t border-slate-200 uppercase tracking-widest font-mono">
                                    + mostrando {filteredRepuestosInventario.slice(0, 5).length} de {filteredRepuestosInventario.length} coincidencias.
                                  </div>
                                )}
                              </div>
                            )}

                            <label className="text-[9px] uppercase font-bold text-slate-500 block pt-1">Repuesto a Solicitar *</label>
                            <select
                              required
                              value={selectedRepuestoId}
                              onChange={(e) => setSelectedRepuestoId(e.target.value)}
                              className="w-full bg-white border-2 border-slate-900 p-2 text-xs focus:ring-0 focus:outline-none focus:border-blue-600"
                            >
                              <option value="">-- SELECCIONAR REPUESTO --</option>
                              {filteredRepuestosInventario.map(part => (
                                <option key={part.id} value={part.id}>
                                  {part.nombre} (${part.precio} | Stock: {part.cantidad})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-500">Cantidad Técnica Necesaria *</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={requestedQty}
                              onChange={(e) => setRequestedQty(parseInt(e.target.value) || 1)}
                              className="w-full bg-white border-2 border-slate-900 p-1.5 text-xs focus:ring-0 focus:outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => { setRequestPartOrderId(null); setSelectedRepuestoId(''); setRequestedQty(1); setPartRequestSearch(''); }}
                            className="px-3 py-1 border-2 border-slate-900 text-slate-700 text-[10px] font-bold uppercase transition-all bg-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 border-2 border-slate-900 font-extrabold text-[10px] uppercase shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                          >
                            Enviar Solicitud a Recepción
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
