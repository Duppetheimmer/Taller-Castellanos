import { useState } from 'react';
import { Cliente, Vehiculo, Repuesto, OrdenTrabajo } from '../types';
import { Package, Users, Wrench, Plus, Search, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  repuestos: Repuesto[];
  ordenes: OrdenTrabajo[];
  setView: (view: string) => void;
  setSelectedVehiculoId: (id: string | null) => void;
  onOpenNewOrder: () => void;
  onOpenNewVehicle: () => void;
  onOpenNewClient: () => void;
  onVerTicket: (id: string) => void;
}

export default function DashboardView({
  clientes,
  vehiculos,
  repuestos,
  ordenes,
  setView,
  setSelectedVehiculoId,
  onOpenNewOrder,
  onOpenNewVehicle,
  onOpenNewClient,
  onVerTicket
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Stats calculate
  const totalRepuestos = repuestos.length;
  const totalClientes = clientes.length;
  const ordenesHoy = ordenes.filter(o => o.fecha === new Date().toISOString().split('T')[0]).length;
  const ordenesAbiertas = ordenes.filter(o => o.estado === 'abierta').length;
  const ordenesEnProceso = ordenes.filter(o => o.estado === 'en_proceso').length;
  const repuestosBajos = repuestos.filter(r => r.cantidad <= r.stockMin);

  // Filtered list of vehicles based on instant quick plate search
  const searchedVehicles = searchTerm.trim() 
    ? vehiculos.filter(v => {
        const owner = clientes.find(c => c.id === v.clienteId)?.nombre || '';
        const term = searchTerm.toLowerCase();
        return (
          v.placa.toLowerCase().includes(term) ||
          v.marca.toLowerCase().includes(term) ||
          v.modelo.toLowerCase().includes(term) ||
          v.vin.toLowerCase().includes(term) ||
          owner.toLowerCase().includes(term)
        );
      })
    : [];

  const handleSelectVehicle = (vId: string) => {
    setSelectedVehiculoId(vId);
    setView('autos');
    setSearchTerm('');
  };

  // Recent 5 orders
  const recentOrders = [...ordenes]
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100/50 text-slate-900 select-none">
      
      {/* Header bar */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-900 border-b-2 border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase">Panel de Control</h2>
          <p className="text-xs text-slate-300 mt-1 font-mono uppercase tracking-wider">
            Resumen de operaciones del taller y estadísticas consolidadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3.5 py-2 border border-slate-705 font-mono uppercase tracking-wider">
            🕒 UTC: {new Date().toISOString().replace('T', ' ').slice(0, 16)}
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        
        {/* BIG SEARCH BOX FOR VEHICLE HISTORY - CUSTOM CORE REQUIREMENT */}
        <div className="relative bg-white border-2 border-slate-900 rounded-none p-4 sm:p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 pointer-events-none -mr-16 -mt-16 border-l border-b border-dashed border-slate-200 transform rotate-45"></div>
          
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <Search className="w-5 h-5 text-blue-600" />
              Buscador Rápido de Historial Vehicular
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed font-mono">
              Consulte la hoja clínica, mantenimientos mecánicos y reparaciones hechas de inmediato filtrando por <strong className="text-blue-600 font-bold uppercase">Placa, Propietario, Marca, Modelo o Chasis VIN</strong>.
            </p>

            <div className="relative">
              <input
                type="text"
                placeholder="Introduzca la Placa (Ej: ABC-1234), marca o propietario del vehículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-slate-900 rounded-none py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 text-xs font-mono uppercase tracking-wide focus:outline-none focus:border-blue-600"
              />
              <Search className="absolute left-4 top-4 text-slate-900 w-5 h-5" />
            </div>

            {/* Live Autocomplete search results */}
            {searchTerm.trim() !== '' && (
              <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-slate-900 rounded-none shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden z-30 max-h-72 overflow-y-auto divide-y-2 divide-slate-900">
                <div className="bg-slate-900 px-4 py-2 text-[10px] font-bold text-white uppercase tracking-wider font-mono flex justify-between">
                  <span>Vehículos coincidentes ({searchedVehicles.length})</span>
                  <span className="text-blue-400 font-bold uppercase">Haga clic para ver historial de servicios</span>
                </div>
                {searchedVehicles.length > 0 ? (
                  searchedVehicles.map(v => {
                    const owner = clientes.find(c => c.id === v.clienteId);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVehicle(v.id)}
                        className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono bg-blue-100 text-blue-800 font-bold px-2.5 py-1 text-xs border border-blue-300">
                            {v.placa}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-600 transition-colors uppercase">
                              {v.marca || '—'} {v.modelo} <span className="text-slate-400 font-mono">({v.anio})</span>
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 block mt-0.5 uppercase">
                              Propietario: {owner ? owner.nombre : 'Sin propietario'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 group-hover:text-blue-600 font-black uppercase tracking-wider font-mono transition-all">
                          <span>Cargar Historial</span>
                          <ArrowRight className="w-3.5 h-3.5 mt-0.5" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs font-mono uppercase">
                    Ningún vehículo coincide con <strong className="text-slate-950">"{searchTerm}"</strong>. 
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Warning Alert Banner block */}
        {repuestosBajos.length > 0 && (
          <div className="p-4 bg-orange-50 border-2 border-orange-500 rounded-none flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 text-white rounded-none">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm text-slate-900 uppercase font-black">¡Alerta de Stock Crítico!</strong>
                <p className="text-xs text-slate-600 mt-0.5 font-mono">
                  Hay {repuestosBajos.length} repuesto(s) con existencias iguales o menores al límite mínimo recomendado en el almacén.
                </p>
              </div>
            </div>
            <button
              onClick={() => setView('inventario')}
              className="text-xs font-black text-orange-600 hover:text-orange-850 uppercase tracking-widest font-mono shrink-0 transition-all hover:underline cursor-pointer"
            >
              Ir a Bodega →
            </button>
          </div>
        )}

        {/* Stats Grid Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 bg-white border-2 border-slate-900 rounded-none shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase font-mono">Inventario</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{totalRepuestos}</div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mt-1">Repuestos diferentes</p>
            </div>
          </div>

          <div className="p-5 bg-white border-2 border-slate-900 rounded-none shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase font-mono">Clientes</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{totalClientes}</div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mt-1">Suscritos al sistema</p>
            </div>
          </div>

          <div className="p-5 bg-white border-2 border-slate-900 rounded-none shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase font-mono">Ordenes Hoy</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{ordenesHoy}</div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mt-1">Ingresos de vehículos hoy</p>
            </div>
          </div>

          <div className="p-5 bg-white border-2 border-slate-900 rounded-none shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase font-mono">Atenciones</span>
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                {ordenesAbiertas} / <span className="text-blue-600 font-black">{ordenesEnProceso}</span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mt-1">Mano de Obra (Pend/Prog)</p>
            </div>
          </div>

        </div>

        {/* Quick Action Bento Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-blue-600 font-mono uppercase tracking-widest block mb-1">Módulo 01 // Servicios</span>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Nueva Orden de Trabajo</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Asigne un vehículo, diagnostique, rebaje piezas del inventario automáticamente y fije tarifas de mano de obra.
              </p>
            </div>
            <button
              onClick={onOpenNewOrder}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 border-2 border-slate-900 text-white font-black text-xs rounded-none transition-all uppercase tracking-wider mt-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Abrir Orden de Trabajo
            </button>
          </div>

          <div className="p-6 bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block mb-1">Módulo 02 // Bodega</span>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Registrar Automóvil</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Añada datos específicos del automóvil (Chasis VIN, Placa, Año, Color, Propietario) para vigilar su historial.
              </p>
            </div>
            <button
              onClick={onOpenNewVehicle}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 border-2 border-slate-900 text-white font-black text-xs rounded-none transition-all uppercase tracking-wider mt-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              Registrar Automóvil
            </button>
          </div>

          <div className="p-6 bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block mb-1">Módulo 03 // Clientes</span>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Inscribir Propietario</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Inscriba un nuevo propietario con cédula, teléfono y datos de contacto para asociarlo a las órdenes.
              </p>
            </div>
            <button
              onClick={onOpenNewClient}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 font-black text-xs rounded-none transition-all uppercase tracking-wider mt-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              Inscribir Cliente
            </button>
          </div>
        </div>

        {/* Recent Work Orders and Low Stock Tables Dual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white border-2 border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="px-6 py-4 border-b-2 border-slate-900 flex justify-between items-center bg-slate-900 text-white">
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                Órdenes de Trabajo Recientes
              </h4>
              <button
                onClick={() => setView('ordenes')}
                className="text-xs text-blue-400 hover:text-blue-300 font-black uppercase tracking-wider hover:underline font-mono"
              >
                Ver Todas →
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono uppercase tracking-wider">
                Todavía no se han registrado órdenes de servicio.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-900 font-medium">
                  <thead className="bg-slate-100 border-b-2 border-slate-900 font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-6 py-3 border-r border-slate-200">Ref</th>
                      <th className="px-6 py-3 border-r border-slate-200">Particular del Auto</th>
                      <th className="px-6 py-3 border-r border-slate-200">Ficha Cliente</th>
                      <th className="px-6 py-3 border-r border-slate-200">Fecha</th>
                      <th className="px-6 py-3 border-r border-slate-200 text-center">Estado</th>
                      <th className="px-6 py-3 text-right">Monto</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-b border-slate-900 divide-slate-200 font-mono text-xs">
                    {recentOrders.map(o => {
                      const v = vehiculos.find(a => a.id === o.autoId);
                      const c = clientes.find(cli => cli.id === o.clienteId);
                      const totalCosto = o.repuestos.reduce((s, rItem) => s + rItem.precio * rItem.qty, 0) + o.laborCost;

                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3.5 border-r border-slate-200 font-bold text-blue-600">
                            {o.id}
                          </td>
                          <td className="px-6 py-3.5 border-r border-slate-200">
                            <span className="font-bold text-slate-900 uppercase block">{v ? `${v.marca} ${v.modelo}` : '—'}</span>
                            {v && (
                              <span className="inline-block bg-slate-100 text-slate-800 text-[10px] px-1.5 py-0.5 border border-slate-300 font-mono mt-1 uppercase font-bold leading-none">
                                Placa: {v.placa}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 border-r border-slate-200 text-slate-700 uppercase">
                            {c ? c.nombre : '—'}
                          </td>
                          <td className="px-6 py-3.5 border-r border-slate-200 text-slate-500">
                            {o.fecha.split('-').reverse().join('/')}
                          </td>
                          <td className="px-6 py-3.5 border-r border-slate-200 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border-2 text-[10px] font-black uppercase ${
                              o.estado === 'terminada' ? 'bg-green-50 border-green-600 text-green-700' :
                              o.estado === 'en_proceso' ? 'bg-blue-50 border-blue-600 text-blue-700' :
                              'bg-amber-50 border-amber-600 text-amber-700'
                            }`}>
                              {o.estado === 'terminada' ? 'Listo' : o.estado === 'en_proceso' ? 'Labores' : 'Ingreso'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-black text-slate-950">
                            ${totalCosto.toLocaleString('es')}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => onVerTicket(o.id)}
                              className="px-2.5 py-1 text-[10px] bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 rounded-none tracking-wide transition-all uppercase shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] font-bold font-mono cursor-pointer"
                            >
                              Factura
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-slate-900 bg-slate-900 text-white">
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Repuestos en Alerta Roja
              </h4>
            </div>
            
            {repuestosBajos.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono uppercase tracking-wider">
                ✓ Todo el almacén en regla.
              </div>
            ) : (
              <div className="p-4 space-y-3 max-h-[290px] overflow-y-auto bg-slate-50/50">
                {repuestosBajos.map(r => (
                  <div key={r.id} className="p-3 bg-white border-2 border-slate-900 rounded-none flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase truncate max-w-[150px]">{r.nombre}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">CÓD: {r.codigo} | UBIC: {r.ubicacion || '—'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black px-2 py-0.5 border ${
                        r.cantidad === 0 ? 'bg-red-50 border-red-500 text-red-600' : 'bg-orange-50 border-orange-450 text-orange-600'
                      } font-mono block`}>
                        {r.cantidad} {r.cantidad === 1 ? 'u' : 'uds'}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">RECO: {r.stockMin}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
