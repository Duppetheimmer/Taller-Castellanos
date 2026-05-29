import { useState, useMemo } from 'react';
import { Repuesto } from '../types';
import { Package, Search, Plus, Trash2, Edit2, Layers, Truck, MapPin, Lock, Unlock, ShieldAlert } from 'lucide-react';

interface InventoryViewProps {
  repuestos: Repuesto[];
  onAddRepuesto: () => void;
  onEditRepuesto: (r: Repuesto) => void;
  onDeleteRepuesto: (id: string) => void;
  onAddStockQty: (r: Repuesto) => void;
  isAdmin: boolean;
  onTriggerAdminLogin: () => void;
}

export default function InventoryView({
  repuestos,
  onAddRepuesto,
  onEditRepuesto,
  onDeleteRepuesto,
  onAddStockQty,
  isAdmin,
  onTriggerAdminLogin
}: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Categories list
  const categories = useMemo(() => {
    const list = new Set<string>();
    repuestos.forEach(r => {
      if (r.categoria) list.add(r.categoria);
    });
    return ['Todas', ...Array.from(list)];
  }, [repuestos]);

  // Combined search and category filtering
  const filteredParts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return repuestos.filter(r => {
      const matchSearch = r.nombre.toLowerCase().includes(q) ||
                          r.codigo.toLowerCase().includes(q) ||
                          r.referencia.toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'Todas' || r.categoria === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, selectedCategory, repuestos]);

  const handleAddRepuestoClick = () => {
    if (!isAdmin) {
      alert('Identificación de Administrador requerida. Por favor, introduzca la contraseña de administrador.');
      onTriggerAdminLogin();
      return;
    }
    onAddRepuesto();
  };

  const handleAddStockClick = (r: Repuesto) => {
    if (!isAdmin) {
      alert('Modo de Suministro de Bodega restringido. Inicie sesión como Administrador para abastecer stock.');
      onTriggerAdminLogin();
      return;
    }
    onAddStockQty(r);
  };

  const handleEditClick = (r: Repuesto) => {
    if (!isAdmin) {
      alert('Privilegios de Administrador requeridos para modificar fichas del catálogo de inventario.');
      onTriggerAdminLogin();
      return;
    }
    onEditRepuesto(r);
  };

  const handleDeleteClick = (id: string) => {
    if (!isAdmin) {
      alert('La eliminación de repuestos del sistema es un acto administrativo crítico. Inicie sesión para proceder.');
      onTriggerAdminLogin();
      return;
    }
    onDeleteRepuesto(id);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100/45 text-slate-900 select-none font-sans">
      
      {/* Header action bar */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-900 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Inventario de Almacén
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-mono uppercase tracking-wider">
            Supervise repuestos, niveles mínimos de existencias dándole reabastecimiento rápido al taller.
          </p>
        </div>
        <button
          onClick={handleAddRepuestoClick}
          className={`flex items-center justify-center gap-2 font-black text-xs px-4 py-2.5 rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] tracking-wider uppercase transition-all self-start sm:self-auto cursor-pointer ${
            isAdmin 
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-amber-500 hover:bg-amber-450 text-slate-950'
          }`}
        >
          {isAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Agregar Repuesto {!isAdmin && '(Admin)'}
        </button>
      </div>

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">

        {/* Status Indicator Bar */}
        <div className={`p-4 border-2 border-slate-900 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] uppercase tracking-wider font-mono text-xs ${
          isAdmin ? 'bg-emerald-550 border-emerald-950 text-slate-950 font-bold bg-green-50' : 'bg-amber-50 text-amber-900 border-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {isAdmin ? (
              <Unlock className="w-5 h-5 text-green-700 flex-shrink-0 animate-bounce" />
            ) : (
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <span className="font-black text-xs">
                {isAdmin ? 'Modo de Acceso: ADMINISTRADOR DE INVENTARIO' : 'Modo de Acceso: CONSULTA GENERAL (RESTRINGIDO)'}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5 font-sans normal-case">
                {isAdmin 
                  ? 'Usted tiene control total del catálogo y abastecimiento de existencias.' 
                  : 'Solo el personal de administración puede agregar repuestos o registrar entregas/ingresos.'}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <button
              onClick={onTriggerAdminLogin}
              className="px-3.5 py-1.5 bg-slate-950 text-white hover:bg-slate-800 text-[10px] font-black tracking-widest uppercase border-2 border-slate-900 cursor-pointer self-start sm:self-auto"
            >
              Liberar Roles o Inventario (Ingresar Pin)
            </button>
          )}
        </div>
        
        {/* Search controls & Category selectors */}
        <div className="p-6 bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row gap-5 items-center justify-between">
          
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="BUSCAR REPUESTO, CÓDIGO O PARTE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-900 rounded-none py-2.5 pl-10 pr-4 text-xs text-slate-900 font-mono uppercase tracking-wider placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
            <Search className="absolute left-3.5 top-3.5 text-slate-900 w-4 h-4" />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto font-mono text-[10px] uppercase">
            <span className="text-slate-400 font-bold tracking-widest leading-none shrink-0">Filtrar Categoría:</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 border-2 text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 border-slate-900 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]'
                      : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Master Spare Parts list */}
        <div className="bg-white border-2 border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-900 text-white">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              Piezas y Repuestos en Bodega ({filteredParts.length})
            </h3>
          </div>

          {filteredParts.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs font-mono uppercase tracking-widest leading-relaxed">
              Ninguna refacción coincide con los criterios de búsqueda en el almacén.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-900 font-bold uppercase tracking-wider">
                <thead className="bg-slate-100 border-b-2 border-slate-900 font-mono text-[10px] text-slate-600">
                  <tr>
                    <th className="px-6 py-3.5 border-r border-slate-200">Código Único</th>
                    <th className="px-6 py-3.5 border-r border-slate-200">Nombre / Referencia de Parte</th>
                    <th className="px-6 py-3.5 border-r border-slate-200">Categoría</th>
                    <th className="px-6 py-3.5 border-r border-slate-200">En Almacén</th>
                    <th className="px-6 py-3.5 text-right border-r border-slate-200">Precio Unitario</th>
                    <th className="px-6 py-3.5 border-r border-slate-200">Proveedor</th>
                    <th className="px-6 py-3.5 border-r border-slate-200">Ubicación Estantería</th>
                    <th className="px-6 py-3.5 text-center">Acciones y Entradas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-b border-slate-900 font-mono text-xs text-slate-800">
                  {filteredParts.map(r => {
                    const isLow = r.cantidad <= r.stockMin;
                    const isAgotado = r.cantidad === 0;

                    // Display status badge & custom colors
                    const statusLabel = isAgotado ? 'Agotado' : isLow ? 'Stock Bajo' : 'Suficiente';
                    const statusClass = isAgotado ? 'bg-red-50 border-red-500 text-red-600' :
                                        isLow ? 'bg-amber-50 border-amber-500 text-amber-700' :
                                        'bg-green-50 border-green-600 text-green-700';

                    // Level percentages gauge
                    const maxScale = Math.max(r.stockMin * 3.5, 10);
                    const percent = Math.min(100, (r.cantidad / maxScale) * 100);
                    const colorFill = isAgotado ? 'bg-red-600' : isLow ? 'bg-amber-500' : 'bg-green-500';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 border-r border-slate-200 font-bold text-blue-600">
                          {r.codigo}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-200">
                          <span className="font-extrabold text-slate-900 block text-xs uppercase">{r.nombre}</span>
                          {r.referencia && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Ref No: {r.referencia}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-200">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-300">
                            <Layers className="w-3 h-3 text-blue-600" />
                            {r.categoria || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-200">
                          <div className="flex justify-between items-center max-w-[130px] mb-1.5">
                            <span className="font-black text-slate-900 text-xs">{r.cantidad} <span className="text-[9px] text-slate-400 font-normal">u</span></span>
                            <span className={`inline-block border px-1.5 py-0.5 text-[8px] font-black leading-none ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>
                          {/* Progress bar scale */}
                          <div className="w-full max-w-[130px] h-1.5 bg-slate-100 border border-slate-300 rounded-none overflow-hidden">
                            <div className={`h-full transition-all duration-300 ${colorFill}`} style={{ width: `${percent}%` }} />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right border-r border-slate-200 font-black text-slate-900">
                          ${r.precio.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-200 text-slate-500">
                          {r.proveedor ? (
                            <span className="flex items-center gap-1 text-[11px]">
                               <Truck className="w-3.5 h-3.5 text-blue-600" />
                              {r.proveedor}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-200 text-slate-500">
                          {r.ubicacion ? (
                            <span className="flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              {r.ubicacion}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleAddStockClick(r)}
                              className={`px-2.5 py-1.5 border-2 border-slate-900 rounded-none text-[10px] font-black transition-all shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer flex items-center gap-1 ${
                                isAdmin
                                  ? 'bg-green-50 hover:bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-800 border-amber-500'
                              }`}
                              title="Registrar Abastecimiento +"
                            >
                              {!isAdmin && <Lock className="w-3 h-3" />}
                              + Abastecer
                            </button>
                            <button
                              onClick={() => handleEditClick(r)}
                              className="p-1.5 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-800 rounded-none cursor-pointer flex items-center justify-center"
                              title="Editar"
                            >
                              {isAdmin ? <Edit2 className="w-3.5 h-3.5 text-blue-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(r.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border-2 border-slate-900 text-red-600 rounded-none cursor-pointer flex items-center justify-center"
                              title="Eliminar"
                            >
                              {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-red-400" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

