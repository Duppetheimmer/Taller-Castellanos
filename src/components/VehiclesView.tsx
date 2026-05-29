import { useState, useMemo } from 'react';
import { Cliente, Vehiculo, OrdenTrabajo } from '../types';
import { Car, Search, Plus, Calendar, Hash, Milestone, Edit2, Trash2, Printer, Wrench, Package, Cpu, Lock } from 'lucide-react';

interface VehiclesViewProps {
  vehiculos: Vehiculo[];
  clientes: Cliente[];
  ordenes: OrdenTrabajo[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onAddVehicle: () => void;
  onEditVehicle: (v: Vehiculo) => void;
  onDeleteVehicle: (id: string) => void;
  onVerTicket: (id: string) => void;
  isAdmin: boolean;
  onTriggerAdminLogin: () => void;
}

export default function VehiclesView({
  vehiculos,
  clientes,
  ordenes,
  selectedId,
  setSelectedId,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onVerTicket,
  isAdmin,
  onTriggerAdminLogin
}: VehiclesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize color name display
  const colorName = (hex: string) => {
    const map: Record<string, string> = {
      '#000000': 'Negro',
      '#ffffff': 'Blanco',
      '#6b7280': 'Gris Metálico',
      '#ef4444': 'Rojo',
      '#f97316': 'Naranja',
      '#eab308': 'Amarillo',
      '#22c55e': 'Verde',
      '#3b82f6': 'Azul',
      '#8b5cf6': 'Morado',
      '#92400e': 'Marrón / Café',
      '#ec4899': 'Rosado',
    };
    return map[hex.toLowerCase()] || hex;
  };

  // Filtered list of vehicles
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return vehiculos;
    return vehiculos.filter(v => {
      const owner = clientes.find(c => c.id === v.clienteId)?.nombre || '';
      return (
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.vin.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, vehiculos, clientes]);

  // Set default selection if none
  const activeVehicle = useMemo(() => {
    if (selectedId) {
      return vehiculos.find(v => v.id === selectedId) || null;
    }
    // Only default to first item on desktop viewport size
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return filteredVehicles.length > 0 ? filteredVehicles[0] : null;
    }
    return null;
  }, [selectedId, filteredVehicles, vehiculos]);

  // Active vehicle stats & chronological list of orders
  const vehicleStatsAndOrders = useMemo(() => {
    if (!activeVehicle) return { list: [], subtotalRepuestos: 0, subtotalLabor: 0, totalReplacedParts: 0, lastCheckIn: '—' };

    const list = ordenes
      .filter(o => o.autoId === activeVehicle.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    let subtotalRepuestos = 0;
    let subtotalLabor = 0;
    let totalReplacedParts = 0;

    list.forEach(o => {
      subtotalLabor += o.laborCost || 0;
      o.repuestos.forEach(r => {
        subtotalRepuestos += r.precio * r.qty;
        totalReplacedParts += r.qty;
      });
    });

    const lastCheckIn = list.length > 0 ? list[0].fecha : '—';

    return {
      list,
      subtotalRepuestos,
      subtotalLabor,
      totalReplacedParts,
      lastCheckIn
    };
  }, [activeVehicle, ordenes]);

  // Handle printing the entire timeline record of selected car
  const handlePrintFullHistory = () => {
    if (!activeVehicle) return;
    const client = clientes.find(c => c.id === activeVehicle.clienteId);
    
    const w = window.open('', '_blank', 'width=680,height=900');
    if (!w) {
      alert('Ventana emergente bloqueada. Habilite permisos para imprimir.');
      return;
    }

    const stateLabels = {
      abierta: 'Abierta',
      en_proceso: 'En Proceso',
      terminada: 'Terminada/Entregada'
    };

    w.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Historial de Mantenimiento - Castellanos Motors</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #111;
            background: #fff;
            padding: 40px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 22px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; }
          .badge { font-family: monospace; font-size: 15px; background: #111; color: #fff; padding: 4px 10px; border-radius: 0px; border: 2px solid #111; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border: 2px solid #111; padding: 15px; background: #fafafa; margin-bottom: 25px; }
          .grid-lbl { color: #555; text-transform: uppercase; font-size: 10px; font-weight: bold; }
          .grid-val { font-size: 13px; font-weight: bold; margin-bottom: 8px; }
          .history-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid #111; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; }
          .incident { border-left: 3px solid #111; padding-left: 15px; margin-bottom: 25px; position: relative; page-break-inside: avoid; }
          .incident-dot { width: 10px; height: 10px; background: #111; position: absolute; left: -6.5px; top: 4px; }
          .incident-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 4px; }
          .incident-desc { font-style: italic; color: #333; margin-bottom: 10px; }
          .parts-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .parts-table th { background: #f0f0f0; border: 1px solid #ddd; padding: 6px 12px; font-size: 11px; text-align: left; }
          .parts-table td { border: 1px solid #ddd; padding: 6px 12px; }
          .cost-row { display: flex; justify-content: flex-end; gap: 20px; font-weight: bold; margin-top: 5px; }
          .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #555; border-top: 1px dashed #111; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Castellanos Motors</div>
            <div style="font-size:12px;color:#333;font-weight:bold;">HISTORIAL CLÍNICO COMPLETO DE VEHÍCULO</div>
          </div>
          <span class="badge">PLACA: ${activeVehicle.placa}</span>
        </div>

        <div class="grid">
          <div>
            <div class="grid-lbl">MARCA / MODELO</div>
            <div class="grid-val">${activeVehicle.marca} ${activeVehicle.modelo}</div>
            
            <div class="grid-lbl">AÑO DE FABRICACIÓN</div>
            <div class="grid-val">${activeVehicle.anio || '—'}</div>
            
            <div class="grid-lbl">COLOR CARROCERÍA</div>
            <div class="grid-val">${colorName(activeVehicle.color)}</div>
            
            <div class="grid-lbl">NRO CHASIS / VIN</div>
            <div class="grid-val" style="font-family: monospace;">${activeVehicle.vin || '—'}</div>
          </div>
          <div>
            <div class="grid-lbl">PROPIETARIO / CLIENTE</div>
            <div class="grid-val">${client ? client.nombre : 'Sin propietario'}</div>
            
            <div class="grid-lbl">NRO CONTACTO</div>
            <div class="grid-val">${client?.telefono ? client.telefono : '—'}</div>
            
            <div class="grid-lbl">KILOMETRAJE REGISTRADO</div>
            <div class="grid-val">${activeVehicle.km.toLocaleString('es')} KM</div>
            
            <div class="grid-lbl">TOTAL ORDENES PROCESADAS</div>
            <div class="grid-val">${vehicleStatsAndOrders.list.length} reparaciones registradas</div>
          </div>
        </div>

        <div class="history-title">Crónica de Atenciones en Taller (${vehicleStatsAndOrders.list.length})</div>
        
        ${vehicleStatsAndOrders.list.length === 0 ? `
          <div style="color:#666; font-style:italic;">No se han emitido incidencias o manteniemientos para este vehículo aún.</div>
        ` : vehicleStatsAndOrders.list.map(o => {
          const totalC = o.repuestos.reduce((s, rp) => s + rp.precio * rp.qty, 0) + o.laborCost;
          return `
            <div class="incident">
              <div class="incident-dot"></div>
              <div class="incident-header">
                <span style="color:#2563eb;">${o.id} — ${o.descripcion.substring(0, 45)}...</span>
                <span>FECHA: ${o.fecha.split('-').reverse().join('/')} &nbsp; [${stateLabels[o.estado] || o.estado}]</span>
              </div>
              <div style="font-size:11px; color:#555; margin-bottom:5px;">Check-in: ${o.kmIngreso ? `${o.kmIngreso.toLocaleString('es')} KM` : '—'}</div>
              <div class="incident-desc">Desc: ${o.descripcion}</div>
              ${o.observaciones ? `<div style="font-size:11.5px; margin-bottom:5px;"><strong>Anotaciones:</strong> ${o.observaciones}</div>` : ''}
              
              ${o.repuestos.length > 0 ? `
                <table class="parts-table">
                  <thead>
                    <tr><th>Repuesto Reemplazado</th><th>Cant</th><th>Precio Unit</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    ${o.repuestos.map(rp => `
                      <tr>
                        <td>${rp.nombre}</td>
                        <td>${rp.qty}</td>
                        <td>$${rp.precio.toFixed(2)}</td>
                        <td>$${(rp.precio * rp.qty).toLocaleString('es')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}

              <div class="cost-row">
                ${o.laborCost > 0 ? `<span>Mano de Obra: $${o.laborCost.toLocaleString('es')}</span>` : ''}
                <span>Costo de esta Incidencia: $${totalC.toLocaleString('es')}</span>
              </div>
            </div>
          `;
        }).join('')}

        <div class="footer">
          <p>Castellanos Motors — Sistema de Registro Electrónico de Mantenimiento</p>
          <p>La Paz, Caracas. Confianza certificada. Impreso el: ${new Date().toLocaleString()}</p>
        </div>
        <script>window.onload=function(){ window.print(); }<\/script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const clientOf = (cId: string) => clientes.find(c => c.id === cId);

  const handleDeleteClick = (id: string) => {
    if (!isAdmin) {
      alert('La eliminación de vehículos es un acto administrativo crítico. Inicie sesión para proceder.');
      onTriggerAdminLogin();
      return;
    }
    onDeleteVehicle(id);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-100/40 select-none">
      
      {/* Top action header */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-900 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
            <Car className="w-5 h-5 text-blue-400" />
            Vehículos e Historiales Clínicos
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono uppercase tracking-wider">
            Ficha técnica de autos, kilometraje y cronologías de reparación.
          </p>
        </div>
        <button
          onClick={onAddVehicle}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-none border-2 border-slate-900 transition-all uppercase tracking-wider self-start sm:self-auto shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar Vehículo
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Vehicle List Panel */}
        <div className={`w-full md:w-80 border-r-2 border-slate-900 flex flex-col bg-white flex-shrink-0 ${
          activeVehicle ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* List Search Bar */}
          <div className="p-4 border-b-2 border-slate-900 bg-slate-50">
            <div className="relative">
              <input
                type="text"
                placeholder="PLACA, MARCA, MODELO, DUEÑO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-900 rounded-none py-2 pl-9 pr-3 text-xs text-slate-900 font-mono uppercase tracking-wider placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
              <Search className="absolute left-3 top-2.5 text-slate-900 w-4 h-4" />
            </div>
          </div>

          {/* Core Vehicles List */}
          <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-slate-50/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1.5 block font-mono">
              Autos Registrados ({filteredVehicles.length})
            </div>
            
            {filteredVehicles.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8 px-4 font-mono">
                Ninguno coincide con la búsqueda
              </p>
            ) : (
              filteredVehicles.map(v => {
                const isActive = activeVehicle?.id === v.id;
                const owner = clientOf(v.clienteId);
                const orderCount = ordenes.filter(o => o.autoId === v.id).length;

                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`w-full text-left p-4 rounded-none transition-all border-2 flex flex-col gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                        : 'bg-white hover:bg-slate-50 border-slate-900 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`font-black text-xs uppercase tracking-tight block ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {v.marca || '—'} {v.modelo}
                      </span>
                      <span className={`font-mono font-black border px-2 py-0.5 text-[10px] leading-none ${isActive ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                        {v.placa}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] mt-1 font-mono uppercase tracking-wider">
                      <span className={`truncate max-w-[130px] font-bold ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                        👤 {owner ? owner.nombre : 'Sin propietario'}
                      </span>
                      <span className={`px-2 py-0.5 border text-[9px] font-black ${isActive ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                        {orderCount} {orderCount === 1 ? 'FICHA' : 'FICHAS'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Clinic Profile & Timeline of selected car */}
        <div className={`flex-1 overflow-y-auto bg-slate-100/30 p-4 sm:p-8 ${
          !activeVehicle ? 'hidden md:block' : 'block'
        }`}>
          {activeVehicle ? (
            <div className="space-y-8 max-w-4xl">
              
              {/* Responsive Back Button */}
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-none text-xs font-bold font-mono tracking-wider text-slate-800 uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-50 mb-4 cursor-pointer"
              >
                ← Volver al listado
              </button>
              
              {/* Detailed specs header panel */}
              <div className="bg-white border-2 border-slate-900 rounded-none p-6 md:p-8 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <div className="absolute top-0 right-0 w-36 h-36 bg-slate-50 pointer-events-none border-l border-b border-dashed border-slate-200 transform rotate-45 -mr-16 -mt-16"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-none bg-blue-50 border-2 border-slate-900 flex items-center justify-center text-blue-600 text-xl font-bold">
                      🚗
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{activeVehicle.marca} {activeVehicle.modelo}</h3>
                        <span className="font-mono text-[11px] text-blue-800 font-bold bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-none uppercase">
                          {activeVehicle.placa}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 uppercase font-mono tracking-wider">
                        Propietario asignado: <strong className="text-slate-900 font-bold">{clientOf(activeVehicle.clienteId)?.nombre || 'Propietario no asignado'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 font-mono">
                    <button
                      onClick={handlePrintFullHistory}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      Imprimir Ficha
                    </button>
                    <button
                      onClick={() => onEditVehicle(activeVehicle)}
                      className="p-1.5 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 rounded-none cursor-pointer"
                      title="Editar ficha"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(activeVehicle.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 border-2 border-slate-900 text-red-600 rounded-none cursor-pointer flex items-center justify-center"
                      title="Eliminar auto"
                    >
                      {isAdmin ? <Trash2 className="w-4 h-4" /> : <Lock className="w-4 h-4 text-red-400" />}
                    </button>
                  </div>
                </div>

                {/* Sub specifications mapping */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t-2 border-slate-900 text-xs font-mono uppercase tracking-wider relative z-10">
                  <div>
                    <span className="text-slate-400 block font-bold text-[9px] font-mono leading-none mb-1">Fabricación</span>
                    <span className="text-slate-900 font-bold flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Año {activeVehicle.anio || 'N/C'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[9px] font-mono leading-none mb-1">VIN (Número Chasis)</span>
                    <span className="text-slate-900 font-bold block mt-1 truncate max-w-[150px]" title={activeVehicle.vin}>
                      <Hash className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
                      {activeVehicle.vin || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[9px] font-mono leading-none mb-1">Odómetro</span>
                    <span className="text-slate-900 font-black flex items-center gap-1.5 mt-1">
                      <Milestone className="w-3.5 h-3.5 text-blue-600" />
                      {activeVehicle.km.toLocaleString('es')} KM
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[9px] font-mono leading-none mb-1">Esmalte / Color</span>
                    <span className="text-slate-900 font-bold flex items-center gap-1.5 mt-1">
                      <span className="w-3.5 h-3.5 rounded-none border-2 border-slate-900 inline-block" style={{ backgroundColor: activeVehicle.color }} />
                      {colorName(activeVehicle.color)}
                    </span>
                  </div>
                </div>

                {/* Observations */}
                {activeVehicle.observaciones && (
                  <div className="mt-6 p-4 bg-slate-50 border-2 border-slate-900 rounded-none text-xs text-slate-700 font-mono uppercase relative z-10">
                    <strong className="text-slate-900 block mb-1">Anotaciones Técnicas del Receptor:</strong> {activeVehicle.observaciones}
                  </div>
                )}
              </div>

              {/* Maintenance summary stats widget */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div className="p-4 bg-white border-2 border-slate-900 rounded-none text-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block font-mono">Incidentes</span>
                  <span className="text-xl font-black text-slate-900 block mt-1 font-mono">{vehicleStatsAndOrders.list.length}</span>
                  <span className="text-[9px] text-slate-400 font-mono uppercase">servicios en taller</span>
                </div>

                <div className="p-4 bg-white border-2 border-slate-900 rounded-none text-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block font-mono">Último Ingreso</span>
                  <span className="text-xs font-black text-blue-600 block mt-2 font-mono uppercase">
                    {vehicleStatsAndOrders.lastCheckIn === '—' ? 'Sin registros' : vehicleStatsAndOrders.lastCheckIn.split('-').reverse().join('/')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono uppercase block mt-1">Orden reciente</span>
                </div>

                <div className="p-4 bg-white border-2 border-slate-900 rounded-none text-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block font-mono">Repuestos</span>
                  <span className="text-xl font-black text-slate-900 block mt-1 font-mono">{vehicleStatsAndOrders.totalReplacedParts} u</span>
                  <span className="text-[9px] text-slate-400 font-mono uppercase">piezas cambiadas</span>
                </div>

                <div className="p-4 bg-white border-2 border-slate-900 rounded-none text-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block font-mono">Inversión Tot.</span>
                  <span className="text-xl font-black text-blue-600 block mt-1 font-mono">
                    ${(vehicleStatsAndOrders.subtotalRepuestos + vehicleStatsAndOrders.subtotalLabor).toLocaleString('es')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono uppercase">Módulo financiero</span>
                </div>

              </div>

              {/* Chronological interactive service Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2 font-mono">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Mantenimiento y Reparaciones Clínicas Realizadas
                </h4>

                {vehicleStatsAndOrders.list.length === 0 ? (
                  <div className="p-12 text-center rounded-none bg-white border-2 border-slate-900 border-dashed text-xs text-slate-500 font-mono uppercase tracking-wider">
                    Este automóvil no cuenta con historial de mantenimiento previo en sistema Castellanos Motors.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-900 pl-6 space-y-6 py-2 ml-4">
                    {/* Maps each work order */}
                    {vehicleStatsAndOrders.list.map(o => {
                      const totalIncidente = o.repuestos.reduce((s, r) => s + r.precio * r.qty, 0) + o.laborCost;

                      return (
                        <div key={o.id} className="relative bg-white border-2 border-slate-900 rounded-none p-5 transition-all shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                          
                          {/* Chronological timeline bullet dot */}
                          <div className="absolute -left-[32px] top-6 w-3.5 h-3.5 bg-slate-900 border-2 border-white"></div>
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-slate-200 pb-3 mb-3 text-xs font-mono">
                            <div>
                              <span className="font-mono text-blue-600 font-bold block bg-slate-50 border border-slate-200 px-2 py-0.5 inline-block text-[11px]">
                                ORDEN #{o.id}
                              </span>
                              <span className="text-slate-500 text-[10px] block mt-1 uppercase">
                                📅 Fecha: <strong className="text-slate-900">{o.fecha.split('-').reverse().join('/')}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-right self-stretch sm:self-auto justify-between sm:justify-start">
                              <span className={`inline-flex items-center px-2.5 py-0.5 border-2 text-[9px] font-black uppercase tracking-wider ${
                                o.estado === 'terminada' ? 'bg-green-50 border-green-600 text-green-700' :
                                o.estado === 'en_proceso' ? 'bg-blue-50 border-blue-600 text-blue-700' :
                                'bg-amber-50 border-amber-600 text-amber-700'
                              }`}>
                                {o.estado === 'terminada' ? 'Listo' : o.estado === 'en_proceso' ? 'Labores' : 'Ingreso'}
                              </span>
                              <button
                                onClick={() => onVerTicket(o.id)}
                                className="p-1 px-2.5 bg-white hover:bg-slate-50 text-slate-900 text-[9px] font-bold border-2 border-slate-900 rounded-none transition-colors flex items-center gap-1 shrink-0 font-mono uppercase tracking-wider cursor-pointer"
                              >
                                <Printer className="w-3 h-3 text-blue-600" />
                                Recibo
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4 font-mono">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block font-mono leading-none mb-1.5">Labor Diagnóstico y Trabajo</span>
                              <p className="text-xs text-slate-900 leading-relaxed bg-slate-50 p-3.5 border border-slate-200 uppercase tracking-wide">
                                {o.descripcion}
                              </p>
                            </div>

                            {o.observaciones && (
                              <div className="text-[10px] text-slate-600 uppercase border-l-2 border-blue-600 pl-3.5 font-bold">
                                Observación técnica: {o.observaciones}
                              </div>
                            )}

                            {/* Replaced Parts segment */}
                            {o.repuestos.length > 0 && (
                              <div>
                                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block font-mono leading-none mb-2">Repuestos de Recambio Reemplazados</span>
                                <div className="space-y-1.5">
                                  {o.repuestos.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white border border-slate-200 p-2 text-xs">
                                      <span className="text-slate-700 font-bold uppercase">🔧 {r.nombre} (x{r.qty})</span>
                                      <span className="text-blue-600 font-bold">${(r.precio * r.qty).toLocaleString('es')}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Incident cost breakdown */}
                            <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-[11px] pt-3 border-t border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                              {o.laborCost > 0 && (
                                <p>Mano de Obra: <strong className="text-slate-900">${o.laborCost.toLocaleString('es')}</strong></p>
                              )}
                              <p>Total Incidencia: <strong className="text-slate-950 font-black">${totalIncidente.toLocaleString('es')}</strong></p>
                            </div>
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
              <span className="text-5xl">🚗</span>
              <p className="text-sm font-black text-slate-900 uppercase tracking-wider mt-4">Ningún vehículo seleccionado</p>
              <p className="text-xs max-w-sm mt-2 font-mono uppercase tracking-wide leading-relaxed">
                Busque en la barra izquierda o presione registrar vehículo para empezar a ver historiales médicos del taller.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
