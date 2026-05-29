import { useState, useMemo } from 'react';
import { Cliente, Vehiculo, OrdenTrabajo } from '../types';
import { Users, Search, Plus, Phone, Mail, FileText, Trash2, Edit2, Calendar, MapPin, Car, ArrowUpRight, Lock } from 'lucide-react';

interface ClientsViewProps {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  ordenes: OrdenTrabajo[];
  onAddClient: () => void;
  onEditClient: (c: Cliente) => void;
  onDeleteClient: (id: string) => void;
  onSelectVehicle: (vId: string) => void;
  setView: (view: string) => void;
  isAdmin: boolean;
  onTriggerAdminLogin: () => void;
}

export default function ClientsView({
  clientes,
  vehiculos,
  ordenes,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onSelectVehicle,
  setView,
  isAdmin,
  onTriggerAdminLogin
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Filter clients based on search input
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.cedula.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q)
    );
  }, [searchQuery, clientes]);

  // Selected client
  const activeClient = useMemo(() => {
    if (selectedClientId) {
      return clientes.find(c => c.id === selectedClientId) || null;
    }
    // Only default to first item on desktop screen widths
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return filteredClients.length > 0 ? filteredClients[0] : null;
    }
    return null;
  }, [selectedClientId, filteredClients, clientes]);

  const clientVehicles = useMemo(() => {
    if (!activeClient) return [];
    return vehiculos.filter(v => v.clienteId === activeClient.id);
  }, [activeClient, vehiculos]);

  const clientOrders = useMemo(() => {
    if (!activeClient) return [];
    return ordenes.filter(o => o.clienteId === activeClient.id);
  }, [activeClient, ordenes]);

  const handleSelectVehicleIndex = (vId: string) => {
    onSelectVehicle(vId);
    setView('autos');
  };

  const handleDeleteClick = (id: string) => {
    if (!isAdmin) {
      alert('La eliminación de clientes es un acto administrativo crítico. Inicie sesión para proceder.');
      onTriggerAdminLogin();
      return;
    }
    onDeleteClient(id);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-100/45 select-none font-sans">
      
      {/* Top action header bar */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-900 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Clientes Registrados
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono uppercase tracking-wider">
            Administre propietarios inscritos, datos de afiliación y vincule vehículos.
          </p>
        </div>
        <button
          onClick={onAddClient}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] tracking-wider uppercase transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Client list lookup panel */}
        <div className={`w-full md:w-80 border-r-2 border-slate-900 flex flex-col bg-white flex-shrink-0 ${
          activeClient ? 'hidden md:flex' : 'flex'
        }`}>
          
          <div className="p-4 border-b-2 border-slate-900 bg-slate-50">
            <div className="relative">
              <input
                type="text"
                placeholder="NOMBRE, IDENTIDAD O CONTACTO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-900 rounded-none py-2 pl-9 pr-3 text-xs text-slate-900 font-mono uppercase tracking-wider placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
              <Search className="absolute left-3 top-2.5 text-slate-900 w-4 h-4" />
            </div>
          </div>

          {/* List scroll panel */}
          <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-slate-50/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1.5 block font-mono">
              Lista de Clientes ({filteredClients.length})
            </div>
            {filteredClients.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8 font-mono uppercase">No se encontraron clientes</p>
            ) : (
              filteredClients.map(c => {
                const isActive = activeClient?.id === c.id;
                const totalOwnedCars = vehiculos.filter(v => v.clienteId === c.id).length;

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`w-full text-left p-4 rounded-none border-2 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                        : 'bg-white hover:bg-slate-50 border-slate-900 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-8 h-8 rounded-none flex items-center justify-center font-black text-xs flex-shrink-0 border-2 ${
                        isActive ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-blue-50 text-blue-800 border-slate-900'
                      }`}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <span className={`font-bold text-xs block uppercase truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{c.nombre}</span>
                        <span className={`text-[10px] font-mono block mt-0.5 uppercase ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>Céd: {c.cedula || '—'}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-black shrink-0 font-mono ${
                      isActive ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {totalOwnedCars} {totalOwnedCars === 1 ? 'CAR' : 'CARS'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Profile facts panel */}
        <div className={`flex-1 overflow-y-auto bg-slate-100/30 p-4 sm:p-8 ${
          !activeClient ? 'hidden md:block' : 'block'
        }`}>
          {activeClient ? (
            <div className="space-y-8 max-w-3xl">
              
              {/* Responsive Back Button */}
              <button
                onClick={() => setSelectedClientId(null)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-none text-xs font-bold font-mono tracking-wider text-slate-800 uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-50 mb-4 cursor-pointer"
              >
                ← Volver al listado
              </button>
              
              {/* Profile Card Header */}
              <div className="bg-white border-2 border-slate-900 rounded-none p-6 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 pointer-events-none border-l border-b border-dashed border-slate-200 transform rotate-45 -mr-16 -mt-16"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-none bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-slate-900">
                      {activeClient.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{activeClient.nombre}</h3>
                      <p className="text-[10px] text-blue-600 font-mono font-bold uppercase mt-0.5 tracking-wider">CÓDIGO: {activeClient.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 font-mono">
                    <button
                      onClick={() => onEditClient(activeClient)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Modificar Ficha
                    </button>
                    <button
                      onClick={() => handleDeleteClick(activeClient.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 border-2 border-slate-900 text-red-600 rounded-none cursor-pointer flex items-center justify-center"
                      title="Eliminar cliente"
                    >
                      {isAdmin ? <Trash2 className="w-4 h-4" /> : <Lock className="w-4 h-4 text-red-400" />}
                    </button>
                  </div>
                </div>

                {/* Sub details details mapping */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t-2 border-slate-900 text-xs font-mono uppercase space-y-1 sm:space-y-0 text-slate-800 tracking-wider relative z-10">
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">Teléfono directo</span>
                      <span className="font-bold">{activeClient.telefono || 'No registrado'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">Correo electrónico</span>
                      <span className="truncate block max-w-[180px] font-bold text-slate-800 lowercase" title={activeClient.email}>{activeClient.email || 'No registrado'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">Afiliado desde</span>
                      <span className="font-bold">{activeClient.fechaReg.split('-').reverse().join('/')}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-mono relative z-10 uppercase">
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold mb-1">Cédula de Identidad / RIF</span>
                    <span className="text-slate-900 font-black bg-slate-50 px-2 py-0.5 border border-slate-200">{activeClient.cedula || '—'}</span>
                  </div>
                  {activeClient.nacimiento && (
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold mb-1">Fecha Nacimiento</span>
                      <span className="text-slate-900 font-bold">{activeClient.nacimiento.split('-').reverse().join('/')}</span>
                    </div>
                  )}
                </div>

                {activeClient.direccion && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 items-start text-xs text-slate-700 font-mono relative z-10 uppercase">
                    <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold mb-1">Dirección fiscal / Habitación</span>
                      <p className="leading-relaxed font-bold text-slate-900">{activeClient.direccion}</p>
                    </div>
                  </div>
                )}

                {activeClient.observaciones && (
                  <div className="mt-6 p-4 bg-slate-50 border-2 border-slate-900 rounded-none text-xs text-slate-600 font-mono relative z-10 uppercase">
                    <strong className="text-slate-900 block mb-1">Observaciones / Alertas del Cliente:</strong> {activeClient.observaciones}
                  </div>
                )}
              </div>

              {/* Owned Vehicles lookup card */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2 font-mono">
                  <Car className="w-4 h-4 text-blue-600" />
                  Vehículos a su Nombre ({clientVehicles.length})
                </h4>

                {clientVehicles.length === 0 ? (
                  <div className="p-8 text-center rounded-none bg-white border-2 border-slate-900 border-dashed text-xs text-slate-550 font-mono uppercase">
                    Este cliente no posee automóviles registrados bajo su código.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {clientVehicles.map(v => (
                      <div key={v.id} className="p-4 bg-white border-2 border-slate-900 rounded-none transition-all flex flex-col justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                        <div className="flex justify-between items-start font-mono uppercase">
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block leading-tight">{v.marca} {v.modelo}</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">AÑO: {v.anio || '—'} | KM: {v.km.toLocaleString('es')}</span>
                          </div>
                          <span className="font-mono text-[10px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1">
                            {v.placa}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSelectVehicleIndex(v.id)}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-none transition-all flex items-center justify-center gap-1 font-mono uppercase tracking-wider cursor-pointer"
                        >
                          Historial de Reparaciones
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Services History segment */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2 font-mono">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Ordenes Emitidas bajo su Propietario ({clientOrders.length})
                </h4>

                {clientOrders.length === 0 ? (
                  <div className="p-8 text-center rounded-none bg-white border-2 border-slate-900 border-dashed text-xs text-slate-500 font-mono uppercase">
                    Ninguna orden de servicio vinculada.
                  </div>
                ) : (
                  <div className="bg-white border-2 border-slate-900 rounded-none overflow-hidden divide-y divide-slate-200 font-mono uppercase text-xs">
                    {clientOrders.map(o => {
                      const totalCost = o.repuestos.reduce((s, r) => s + r.precio * r.qty, 0) + o.laborCost;
                      return (
                        <div key={o.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-blue-600 font-black">ORDEN #{o.id}</span>
                              <span className="text-slate-400 text-[9px]">{o.fecha.split('-').reverse().join('/')}</span>
                            </div>
                            <p className="text-slate-700 mt-1 truncate max-w-[320px] font-semibold text-[11px]" title={o.descripcion}>{o.descripcion}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-slate-950 block">${totalCost.toLocaleString('es')}</span>
                            <span className={`inline-block border text-[9px] font-black px-1.5 py-0.5 mt-1 uppercase leading-none tracking-wider ${
                              o.estado === 'terminada' ? 'bg-green-50 border-green-600 text-green-700' :
                              o.estado === 'en_proceso' ? 'bg-blue-50 border-blue-600 text-blue-700' :
                              'bg-amber-50 border-amber-600 text-amber-700'
                            }`}>
                              {o.estado === 'terminada' ? 'Listo' : o.estado === 'en_proceso' ? 'Labores' : 'Ingreso'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 h-full">
              <span className="text-5xl">👤</span>
              <p className="text-sm font-black text-slate-900 uppercase tracking-widest mt-4">Ningún cliente seleccionado</p>
              <p className="text-xs max-w-sm mt-2 font-mono uppercase tracking-wide leading-relaxed">
                Busque en la barra izquierda o presione Nuevo Cliente para ingresar fichas de contacto.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
