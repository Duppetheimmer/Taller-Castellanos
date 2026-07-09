import { useState, useMemo } from 'react';
import { OrdenTrabajo, Trabajador, Vehiculo } from '../types';
import { 
  DollarSign, 
  Coins, 
  Calendar, 
  Wrench, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Search, 
  Briefcase, 
  ShieldAlert, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface WorkerCommissionsViewProps {
  loggedWorkerId: string;
  trabajadores: Trabajador[];
  ordenes: OrdenTrabajo[];
  vehiculos: Vehiculo[];
}

export default function WorkerCommissionsView({
  loggedWorkerId,
  trabajadores,
  ordenes,
  vehiculos
}: WorkerCommissionsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Find current worker
  const currentWorker = useMemo(() => {
    return trabajadores.find(t => t.id === loggedWorkerId);
  }, [trabajadores, loggedWorkerId]);

  // Load exchange rate dynamically
  const tasaUSDT = useMemo(() => {
    try {
      const saved = localStorage.getItem('castellanos_tasa_usdt');
      return parseFloat(saved || '44.50') || 44.50;
    } catch {
      return 44.50;
    }
  }, []);

  // Worker's specific commission percentage (default to 50% if not specified)
  const commissionRate = useMemo(() => {
    if (!currentWorker) return 50;
    return currentWorker.comisionPercent !== undefined ? currentWorker.comisionPercent : 50;
  }, [currentWorker]);

  // Filter orders assigned to this worker
  const workerOrders = useMemo(() => {
    return ordenes.filter(o => o.trabajadorId === loggedWorkerId);
  }, [ordenes, loggedWorkerId]);

  // Filter based on status, search term and date
  const processedOrders = useMemo(() => {
    let list = workerOrders;

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      list = list.filter(o => {
        const matchingVehicle = vehiculos.find(v => v.id === o.autoId);
        const placa = matchingVehicle?.placa.toLowerCase() || '';
        const desc = o.descripcion.toLowerCase();
        const id = o.id.toLowerCase();
        return placa.includes(term) || desc.includes(term) || id.includes(term);
      });
    }

    // Filter by date
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      list = list.filter(o => o.fecha === todayStr);
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      list = list.filter(o => {
        const oDate = new Date(o.fecha);
        return oDate >= oneWeekAgo;
      });
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      list = list.filter(o => {
        const oDate = new Date(o.fecha);
        return oDate >= oneMonthAgo;
      });
    }

    return list;
  }, [workerOrders, searchTerm, dateFilter, vehiculos]);

  // Segregate completed vs active orders
  const completedOrders = useMemo(() => {
    return processedOrders.filter(o => o.estado === 'terminada');
  }, [processedOrders]);

  const activeOrders = useMemo(() => {
    return processedOrders.filter(o => o.estado !== 'terminada');
  }, [processedOrders]);

  // Calculated Stats (Only completed tasks yield commission)
  const stats = useMemo(() => {
    const totalLaborUSD = completedOrders.reduce((sum, o) => sum + (o.laborCost || 0), 0);
    const totalLaborVES = totalLaborUSD * tasaUSDT;

    // Filter paid vs unpaid within completed orders
    const paidCompleted = completedOrders.filter(o => o.comisionPagada);
    const unpaidCompleted = completedOrders.filter(o => !o.comisionPagada);

    const commissionEarnedUSD = completedOrders.reduce((sum, o) => {
      const rate = o.comisionPorcentaje !== undefined ? o.comisionPorcentaje : commissionRate;
      return sum + (o.laborCost || 0) * (rate / 100);
    }, 0);
    const commissionEarnedVES = commissionEarnedUSD * tasaUSDT;

    const paidLaborUSD = paidCompleted.reduce((sum, o) => sum + (o.laborCost || 0), 0);
    const commissionPaidUSD = paidCompleted.reduce((sum, o) => {
      const rate = o.comisionPorcentaje !== undefined ? o.comisionPorcentaje : commissionRate;
      return sum + (o.laborCost || 0) * (rate / 100);
    }, 0);
    const commissionPaidVES = commissionPaidUSD * tasaUSDT;

    const unpaidLaborUSD = unpaidCompleted.reduce((sum, o) => sum + (o.laborCost || 0), 0);
    const commissionUnpaidUSD = unpaidCompleted.reduce((sum, o) => {
      const rate = o.comisionPorcentaje !== undefined ? o.comisionPorcentaje : commissionRate;
      return sum + (o.laborCost || 0) * (rate / 100);
    }, 0);
    const commissionUnpaidVES = commissionUnpaidUSD * tasaUSDT;

    // Future pending commissions (In Process or Open tasks)
    const pendingCommissionUSD = activeOrders.reduce((sum, o) => {
      const rate = o.comisionPorcentaje !== undefined ? o.comisionPorcentaje : commissionRate;
      return sum + (o.laborCost || 0) * (rate / 100);
    }, 0);
    const pendingCommissionVES = pendingCommissionUSD * tasaUSDT;

    return {
      totalLaborUSD,
      totalLaborVES,
      commissionEarnedUSD,
      commissionEarnedVES,
      commissionPaidUSD,
      commissionPaidVES,
      commissionUnpaidUSD,
      commissionUnpaidVES,
      pendingLaborUSD: activeOrders.reduce((sum, o) => sum + (o.laborCost || 0), 0),
      pendingCommissionUSD,
      pendingCommissionVES,
      countCompleted: completedOrders.length,
      countActive: activeOrders.length,
      countPaid: paidCompleted.length,
      countUnpaid: unpaidCompleted.length
    };
  }, [completedOrders, activeOrders, commissionRate, tasaUSDT]);

  const getVehiclePlaca = (autoId: string) => {
    const found = vehiculos.find(v => v.id === autoId);
    return found ? found.placa : 'S/N';
  };

  const getVehicleDesc = (autoId: string) => {
    const found = vehiculos.find(v => v.id === autoId);
    if (!found) return 'Vehículo Desconocido';
    return `${found.marca} ${found.modelo} (${found.color || 'Sin color'})`;
  };

  if (!currentWorker) {
    return (
      <div className="p-8 text-center space-y-4 font-mono uppercase bg-slate-50 border-4 border-dashed border-red-500 max-w-lg mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
        <h2 className="text-sm font-black text-slate-900">Operario No Identificado</h2>
        <p className="text-xs text-slate-500 leading-normal">
          Inicie sesión como técnico registrado desde la barra lateral para acceder a su panel de comisiones.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-150/40 text-slate-900 select-none font-sans">
      
      {/* Header Banner */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-900 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] bg-blue-600 text-white px-2 py-0.5 font-bold uppercase tracking-wide">
              {currentWorker.id}
            </span>
            <span className="text-xs text-slate-300 font-mono tracking-widest uppercase">
              Contabilidad de Guardia
            </span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 mt-1">
            <Coins className="w-5 h-5 text-emerald-400" />
            Mis Comisiones y Ganancias
          </h2>
          <p className="text-xs text-slate-300 font-sans uppercase tracking-wider mt-0.5">
            Técnico: <strong className="text-blue-400">{currentWorker.nombre}</strong> — Especialidad: {currentWorker.especialidad}
          </p>
        </div>
        
        {/* Active Commission rate Tag */}
        <div className="bg-slate-950 border-2 border-slate-700 px-4 py-2 flex items-center gap-3">
          <div className="text-center font-mono">
            <span className="text-[8px] text-slate-500 block uppercase font-bold leading-none">Su Tasa</span>
            <span className="text-lg font-black text-emerald-400 block tracking-tighter">{commissionRate}%</span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="text-right font-mono text-[8px] text-slate-400 leading-normal uppercase">
            <span>Mano de Obra</span>
            <span className="block text-white font-extrabold">Compartida</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">

        {/* Highlight Stats Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Main Earner Card - Paid/Collected commissions (Emerald Theme) */}
          <div className="bg-emerald-600 text-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden flex flex-col justify-between h-40">
            <div className="flex justify-between items-start border-b border-white/20 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">Comisiones Cobradas (USD)</span>
              <Coins className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="my-auto pt-2">
              <div className="text-3xl font-black font-mono tracking-tight leading-none">
                ${stats.commissionPaidUSD.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
              <p className="text-[9.5px] text-emerald-100 font-mono mt-1.5 uppercase font-bold">
                Total de <strong className="text-white">{stats.countPaid} trabajos</strong> liquidados y cobrados.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-6 text-white/5 font-black text-7xl select-none font-mono tracking-tighter">
              $
            </div>
          </div>

          {/* Pending Earner Card - Unpaid completed orders (Amber Theme) */}
          <div className="bg-amber-500 text-slate-950 border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden flex flex-col justify-between h-40 animate-pulse" style={{ animationDuration: '4s' }}>
            <div className="flex justify-between items-start border-b border-slate-950/25 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest font-mono text-slate-900">Pendiente de Liquidar (USD)</span>
              <DollarSign className="w-5 h-5 text-slate-900" />
            </div>
            <div className="my-auto pt-2">
              <div className="text-3xl font-black font-mono tracking-tight leading-none text-slate-950">
                ${stats.commissionUnpaidUSD.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
              <p className="text-[9.5px] text-slate-800 font-mono mt-1.5 uppercase font-extrabold">
                Por liquidar en <strong className="text-slate-950">{stats.countUnpaid} trabajos</strong> finalizados.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-slate-950/5 font-black text-8xl select-none font-mono">
              $
            </div>
          </div>

          {/* Pending Projections - Active work in progress (White/Slate Theme) */}
          <div className="bg-white text-slate-800 border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between h-40">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest font-mono text-slate-400">Proyección en Taller (USD)</span>
              <Clock className="w-5 h-5 text-blue-600 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div className="my-auto pt-2">
              <div className="text-3xl font-black font-mono tracking-tight leading-none text-slate-900">
                ${stats.pendingCommissionUSD.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
              <p className="text-[9.5px] text-slate-500 font-mono mt-1.5 uppercase font-bold">
                Comisión estimada de <strong className="text-blue-600">{stats.countActive} tareas</strong> activas.
              </p>
            </div>
            <div className="text-[9px] uppercase font-bold text-blue-600 font-mono bg-blue-50 border border-blue-200 py-1 px-2.5 text-center leading-none">
              Próximos Ingresos Asignados
            </div>
          </div>

        </div>

        {/* Global Overview Info Alert banner */}
        <div className="p-4 bg-blue-50 border-2 border-blue-800 rounded-none text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-[10px] uppercase">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-1.5 bg-blue-800 text-white shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <p className="leading-relaxed font-bold">
              Las comisiones se generan exclusivamente por la tarifa de <strong className="text-blue-900">Mano de Obra (Labor Cost)</strong> de cada vehículo finalizado. Los repuestos y consumibles del almacén pertenecen al inventario general y no forman parte de este cálculo.
            </p>
          </div>
          <div className="bg-blue-100 border border-blue-400 px-3 py-1 text-center font-extrabold text-blue-800 shrink-0">
            Bs. 1.00 USD = {tasaUSDT.toFixed(2)} VES
          </div>
        </div>

        {/* Filters and Search Bar Container */}
        <div className="bg-white border-2 border-slate-950 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar servicio por código de orden, placa de vehículo o descripción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-900 rounded-none pl-10 pr-4 py-2 text-xs font-mono focus:outline-none focus:bg-white focus:border-blue-600 text-slate-900 uppercase"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-800" />
            </div>

            {/* Date Filters buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider mr-2 shrink-0">Filtrar por:</span>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 font-mono text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer border rounded-none ${
                  dateFilter === 'all' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Histórico Completo
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 font-mono text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer border rounded-none ${
                  dateFilter === 'today' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 font-mono text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer border rounded-none ${
                  dateFilter === 'week' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Últimos 7 días
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1.5 font-mono text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer border rounded-none ${
                  dateFilter === 'month' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Último Mes
              </button>
            </div>

          </div>
        </div>

        {/* Dual Layout: Completed Orders Table and Active Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Completed / Commissioned Services List (Main Column) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 text-white px-5 py-3.5 border-2 border-slate-900 flex justify-between items-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Historial de Servicios Terminados ({completedOrders.length})
              </h3>
              <span className="font-mono text-[9px] uppercase font-bold text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-0.5">
                Comisión Asegurada
              </span>
            </div>

            {completedOrders.length === 0 ? (
              <div className="bg-white border-2 border-slate-900 p-12 text-center text-slate-400 font-mono text-xs uppercase tracking-wide">
                No hay registros de trabajos completados para los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map(ord => {
                  const jobTotalUSD = ord.laborCost || 0;
                  const jobTotalVES = jobTotalUSD * tasaUSDT;

                  const rate = ord.comisionPorcentaje !== undefined ? ord.comisionPorcentaje : commissionRate;
                  const commUSD = jobTotalUSD * (rate / 100);
                  const commVES = jobTotalVES * (rate / 100);

                  return (
                    <div 
                      key={ord.id} 
                      className="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-emerald-600 transition-all"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 text-slate-900 font-bold px-2 py-0.5 border border-slate-300">
                            {ord.id}
                          </span>
                          <span className="font-mono text-xs bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 border border-emerald-300 uppercase">
                            Placa: {getVehiclePlaca(ord.autoId)}
                          </span>
                          <span className={`font-mono text-[9px] font-black px-2 py-0.5 border-2 uppercase ${
                            ord.comisionPagada 
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-800' 
                              : 'bg-amber-50 border-amber-500 text-amber-800'
                          }`}>
                            {ord.comisionPagada ? '🟢 PAGADA' : '🟡 LIQUIDACIÓN PENDIENTE'}
                          </span>
                          <span className="text-[10px] text-slate-450 font-mono uppercase font-bold ml-auto">
                            📅 {ord.fecha}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 uppercase">
                          {getVehicleDesc(ord.autoId)}
                        </h4>
                        
                        <p className="text-xs text-slate-500 leading-relaxed font-sans pr-4 line-clamp-2">
                          {ord.descripcion}
                        </p>
                        
                        {ord.diagnostico && (
                          <div className="text-[10px] text-blue-800 bg-blue-50/50 border border-blue-200/50 p-2 font-mono uppercase">
                            <strong className="text-blue-900 font-bold block">Diagnóstico Técnico:</strong>
                            <span className="line-clamp-1">{ord.diagnostico}</span>
                          </div>
                        )}
                      </div>

                      {/* Earnings Breakdown Box */}
                      <div className="bg-slate-50 border border-slate-300 p-3 min-w-[200px] text-right font-mono flex flex-col justify-center gap-1 text-[10px] uppercase">
                        <div>
                          <span className="text-slate-400 text-[8.5px] block font-bold leading-none">Mano de Obra Total</span>
                          <span className="text-slate-800 font-extrabold text-xs block mt-0.5">
                            ${jobTotalUSD.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </span>
                        </div>
                        <div className="h-px bg-slate-200 my-1 border-dashed"></div>
                        <div>
                          <span className="text-emerald-700 text-[9px] font-black block leading-none">Su Comisión ({rate}%)</span>
                          <span className="text-emerald-950 font-black text-sm block mt-0.5">
                            ${commUSD.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active / Assigned Workload (Sidebar Column) */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white px-5 py-3.5 border-2 border-slate-900 flex justify-between items-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                Mis Tareas Activas ({activeOrders.length})
              </h3>
              <span className="font-mono text-[9px] uppercase font-black text-blue-400 bg-slate-950 border border-slate-800 px-2 py-0.5">
                Proyecciones
              </span>
            </div>

            {activeOrders.length === 0 ? (
              <div className="bg-white border-2 border-slate-900 p-8 text-center text-slate-400 font-mono text-xs uppercase tracking-wide">
                Sin órdenes activas asignadas actualmente.
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map(ord => {
                  const pUSD = ord.laborCost || 0;
                  const pVES = pUSD * tasaUSDT;

                  const cUSD = pUSD * (commissionRate / 100);
                  const cVES = pVES * (commissionRate / 100);

                  return (
                    <div 
                      key={ord.id} 
                      className="bg-white border-2 border-slate-950 p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] space-y-3 hover:border-blue-500 transition-all"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase pb-2 border-b border-dashed border-slate-200">
                        <span className="font-extrabold text-blue-600">{ord.id}</span>
                        <span className={`px-2 py-0.5 text-[8px] font-black text-white ${
                          ord.estado === 'en_proceso' ? 'bg-amber-600' : 'bg-slate-600'
                        }`}>
                          {ord.estado === 'en_proceso' ? 'En Proceso' : 'Abierta'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-[11px] text-slate-900 uppercase">
                          Placa: {getVehiclePlaca(ord.autoId)}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono uppercase block">
                          {getVehicleDesc(ord.autoId)}
                        </p>
                        <p className="text-xs text-slate-600 leading-normal line-clamp-3 font-sans pt-1">
                          {ord.descripcion}
                        </p>
                      </div>

                      {/* Potential commission projection */}
                      <div className="bg-blue-50/50 border border-blue-200/50 p-2.5 font-mono text-[10px] uppercase flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-blue-700 text-[8px] block font-bold leading-none">Comisión Potencial</span>
                          <span className="text-[8.5px] text-slate-500">Mano de Obra: ${pUSD} USD</span>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-900 font-black text-xs block">
                            ${cUSD.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
