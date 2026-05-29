import { useState, useMemo } from 'react';
import { VentaIndividual, VentaItem, Repuesto } from '../types';
import { ShoppingBag, Search, Plus, Trash2, Printer, Calendar, User, Receipt, DollarSign, RefreshCw, Sparkles, Check, ChevronRight, Calculator, AlertTriangle } from 'lucide-react';

interface VentasViewProps {
  ventas: VentaIndividual[];
  repuestos: Repuesto[];
  onAddVenta: (v: VentaIndividual) => void;
  onDeleteVenta: (id: string) => void;
  onCancelAndRestockVenta: (id: string) => void;
  isAdmin: boolean;
  onTriggerAdminLogin: () => void;
}

export default function VentasView({
  ventas,
  repuestos,
  onAddVenta,
  onDeleteVenta,
  onCancelAndRestockVenta,
  isAdmin,
  onTriggerAdminLogin
}: VentasViewProps) {
  // Tabs: 'historial' | 'nueva_venta'
  const [activeTab, setActiveTab] = useState<'historial' | 'nueva_venta'>('nueva_venta');
  
  // Sales History States
  const [searchHistory, setSearchHistory] = useState('');

  // New Sale Form States
  const [clienteNombre, setClienteNombre] = useState('Cliente General');
  const [clienteCedula, setClienteCedula] = useState('');
  const [cartItems, setCartItems] = useState<VentaItem[]>([]);
  const [searchPartQuery, setSearchPartQuery] = useState('');

  // Exchange rate
  const [tasaInput, setTasaInput] = useState<string>(() => {
    return localStorage.getItem('castellanos_tasa_usdt') || '44.50';
  });
  const tasaUSDT = parseFloat(tasaInput) || 0;

  // Filter parts for search
  const filteredParts = useMemo(() => {
    const q = searchPartQuery.toLowerCase().trim();
    if (!q) return [];
    return repuestos.filter(r => 
      r.nombre.toLowerCase().includes(q) ||
      r.codigo.toLowerCase().includes(q) ||
      r.referencia.toLowerCase().includes(q)
    ).slice(0, 8); // list top 8 matches
  }, [searchPartQuery, repuestos]);

  // Handle adding a part to the invoice cart
  const handleAddToCart = (part: Repuesto) => {
    if (part.cantidad <= 0) {
      if (!confirm(`¡Bajo Stock! El repuesto "${part.nombre}" tiene 0 unidades en el almacén. ¿Desear forzar la venta con inventario negativo?`)) {
        return;
      }
    }

    const existingIdx = cartItems.findIndex(i => i.repuestoId === part.id);
    if (existingIdx > -1) {
      const currentQty = cartItems[existingIdx].cantidad;
      if (part.cantidad < currentQty + 1) {
        if (!confirm(`La cantidad solicitada (${currentQty + 1}) supera el stock físico de almacén (${part.cantidad}). ¿Desea vender esta cantidad de todos modos?`)) {
          return;
        }
      }

      const updated = [...cartItems];
      updated[existingIdx].cantidad += 1;
      setCartItems(updated);
    } else {
      const newItem: VentaItem = {
        repuestoId: part.id,
        nombre: part.nombre,
        codigo: part.codigo,
        cantidad: 1,
        precioUnitario: part.precio,
        precioOriginal: part.precio
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Change quantity of cart item
  const handleUpdateCartQty = (repuestoId: string, value: number) => {
    if (value <= 0) {
      setCartItems(cartItems.filter(item => item.repuestoId !== repuestoId));
      return;
    }
    const part = repuestos.find(r => r.id === repuestoId);
    if (part && part.cantidad < value) {
      if (!confirm(`La cantidad de repuestos (${value}) supera las existencias cargadas de ${part.cantidad}. ¿Continuar?`)) {
        return;
      }
    }
    const updated = cartItems.map(item => {
      if (item.repuestoId === repuestoId) {
        return { ...item, cantidad: value };
      }
      return item;
    });
    setCartItems(updated);
  };

  // Change custom unit price for item (offers / discounts)
  const handleUpdateCartPrice = (repuestoId: string, value: number) => {
    if (value < 0) return;
    const updated = cartItems.map(item => {
      if (item.repuestoId === repuestoId) {
        return { ...item, precioUnitario: value };
      }
      return item;
    });
    setCartItems(updated);
  };

  const handleRemoveFromCart = (repuestoId: string) => {
    setCartItems(cartItems.filter(item => item.repuestoId !== repuestoId));
  };

  // Total calculation
  const totalUSD = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
  }, [cartItems]);

  const totalVES = totalUSD * tasaUSDT;

  // Process and save sale
  const handleProcessSale = () => {
    if (cartItems.length === 0) {
      alert('Debe agregar al menos un repuesto para procesar la facturación.');
      return;
    }

    const newSaleId = `VEN-${Math.floor(100000 + Math.random() * 900000)}`;
    const newSale: VentaIndividual = {
      id: newSaleId,
      fecha: new Date().toISOString().split('T')[0],
      clienteNombre: clienteNombre.trim() || 'Cliente General',
      clienteCedula: clienteCedula.trim() || '—',
      items: cartItems,
      tasaUsdt: tasaUSDT,
      totalUsd: totalUSD,
      creadoEn: new Date().toISOString()
    };

    onAddVenta(newSale);

    // Prompt to print immediately
    if (confirm(`¡Procedimiento de Venta Procesado con Éxito!\n\nID Venta: ${newSaleId}\nImporte Total: USD ${totalUSD.toFixed(2)} / Bs ${totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n¿Desea imprimir el boleto de venta en este momento?`)) {
      handlePrintSaleTicket(newSale);
    }

    // Reset Form
    setCartItems([]);
    setClienteNombre('Cliente General');
    setClienteCedula('');
    setSearchPartQuery('');
    setActiveTab('historial');
  };

  // Print function designed securely for sales
  const handlePrintSaleTicket = (v: VentaIndividual) => {
    const w = window.open('', '_blank', 'width=460,height=700');
    if (!w) {
      alert('Por favor permita o autorice las ventanas emergentes para mostrar el ticket de venta.');
      return;
    }
    const itemsRows = v.items.map(item => {
      const orig = item.precioOriginal !== undefined ? item.precioOriginal : item.precioUnitario;
      const isDiscounted = orig > item.precioUnitario;

      const origPriceBs = orig * v.tasaUsdt;
      const finalPriceBs = item.precioUnitario * v.tasaUsdt;
      const subtotalBs = item.precioUnitario * item.cantidad * v.tasaUsdt;

      const priceVesHtml = isDiscounted 
        ? `<span style="text-decoration: line-through; color: #777; margin-right: 4px;">Bs ${origPriceBs.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> <span style="font-weight: bold; color: #111;">Bs ${finalPriceBs.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`
        : `Bs ${finalPriceBs.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const priceUsdHtml = isDiscounted
        ? `<span style="text-decoration: line-through; color: #777; margin-right: 4px;">$${orig.toFixed(2)}</span> <span style="font-weight: bold; color: #111; background: #eaeaea; padding: 0 4px;">$${item.precioUnitario.toFixed(2)}</span> <span style="color: #0055aa; font-weight: bold; font-size: 9px; margin-left: 2px;">(¡Oferta Especial!)</span>`
        : `Unit: $${item.precioUnitario.toFixed(2)}`;

      return `
        <div class="row" style="margin-top: 4px;">
          <div class="desc bold">${item.nombre}</div>
          <div class="qty-price">${item.cantidad} x ${priceVesHtml}</div>
          <div class="subtotal bold">Bs ${subtotalBs.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="row-usd font-mono" style="margin-bottom: 8px;">/ Código: ${item.codigo} | ${priceUsdHtml} • Total: $${(item.precioUnitario * item.cantidad).toFixed(2)}</div>
      `;
    }).join('');

    w.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Ticket de Repuesto - ${v.id}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            color: #111;
            background: #fff;
            padding: 24px 18px;
            font-size: 13px;
            width: 380px;
            margin: 0 auto;
            line-height: 1.4;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .header-title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
          .sub { color: #555; font-size: 11px; margin-bottom: 2px; }
          .id-box {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            background: #f1f2f5;
            padding: 8px;
            margin: 12px 0;
            border: 2px solid #111;
          }
          .divider { border: none; border-top: 1px dashed #888; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; padding: 3px 0; }
          .row-usd { font-size: 10px; color: #666; margin-bottom: 6px; padding-left: 8px; }
          .lbl { color: #555; }
          .val { text-align: right; font-weight: 600; }
          .section-title { font-size: 11px; text-transform: uppercase; color: #222; margin: 10px 0 5px; font-weight: bold; background: #fafafa; padding: 2px; }
          .total-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-top: 10px; padding-top: 8px; border-top: 1px solid #111; }
          .total-ves-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #fff; background: #111; padding: 6px 8px; margin-top: 6px; }
          .footer { text-align: center; color: #555; font-size: 10px; margin-top: 24px; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="header-title">⚙️ CASTELLANOS MOTORS</div>
          <p class="sub">Venta Directa de Repuestos y Accesorios</p>
          <p class="sub">Rif: J-40892813-0 | Caracas, Venezuela</p>
          <p class="sub">Telf: 0414-123-4567</p>
        </div>

        <div class="id-box">COMPROBANTE VENTA: ${v.id}</div>
        
        <div class="row"><span class="lbl">Fecha Emisión:</span><span class="val">${v.fecha.split('-').reverse().join('/')}</span></div>
        <div class="row"><span class="lbl">Hora Proceso:</span><span class="val">${new Date(v.creadoEn).toLocaleTimeString('es-VE')}</span></div>

        <hr class="divider">

        <div class="section-title">Datos del Facturado</div>
        <div class="row"><span class="lbl">Cliente:</span><span class="val">${v.clienteNombre}</span></div>
        <div class="row"><span class="lbl">Rif / Cédula:</span><span class="val">${v.clienteCedula}</span></div>

        <hr class="divider">

        <div class="section-title">Items & Desglose de Repuestos</div>
        ${itemsRows}

        <hr class="divider">

        <div class="row"><span class="lbl">Total Neto USD:</span><span class="val">$${v.totalUsd.toFixed(2)}</span></div>
        <div class="row"><span class="lbl">Tasa Oficial Ref.:</span><span class="val">Bs ${v.tasaUsdt.toFixed(2)} USDT</span></div>
        
        <div class="total-ves-row">
          <span>TOTAL PAGADO:</span>
          <span>Bs ${(v.totalUsd * v.tasaUsdt).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        <div class="center footer">
          <p>*** GARANTÍA CASTELLANOS MOTORS ***</p>
          <p>Garantía de originalidad física en todas las piezas.</p>
          <p>No se aceptan devoluciones eléctricas usadas.</p>
          <p style="margin-top: 10px; font-weight: bold;">¡Muchas gracias por su compra!</p>
          <p style="font-size: 8px; color: #888; margin-top: 10px;">Comprobante Digital Emitido Electrónicamente</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const handleDeleteClick = (id: string) => {
    if (!isAdmin) {
      alert('Se requieren credenciales de Administrador para remover facturas de ventas procesadas del historial.');
      onTriggerAdminLogin();
      return;
    }
    if (confirm('¿Está seguro de que desea eliminar permanentemente este recibo de venta individual del sistema? Esta acción no reabastece el stock automáticamente.')) {
      onDeleteVenta(id);
    }
  };

  // Filter history sales
  const filteredSales = useMemo(() => {
    const q = searchHistory.toLowerCase().trim();
    if (!q) return ventas;
    return ventas.filter(v => 
      v.id.toLowerCase().includes(q) ||
      v.clienteNombre.toLowerCase().includes(q) ||
      v.clienteCedula.toLowerCase().includes(q)
    );
  }, [searchHistory, ventas]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-100/45 text-slate-900 select-none font-sans">
      
      {/* View Header section */}
      <div className="px-4 sm:px-8 py-4 bg-slate-900 border-b-2 border-slate-950 text-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              Facturación & Venta Detal
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-mono uppercase tracking-wider">
              Cree facturas de repuestos individuales por caja registradora, descontando las existencias al instante.
            </p>
          </div>

          {/* Quick Tabs buttons */}
          <div className="flex border-2 border-slate-950 bg-slate-950 p-1 self-start sm:self-auto shadow-sm">
            <button
              onClick={() => setActiveTab('nueva_venta')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-none ${
                activeTab === 'nueva_venta'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Nueva Venta Box
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-none ${
                activeTab === 'historial'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Historial ({ventas.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Views container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        
        {activeTab === 'nueva_venta' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
            
            {/* Left side: Search part & add to cart (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Buscar Repuestos en Inventario</h3>
                </div>

                <p className="text-[11px] text-slate-500 font-mono tracking-tight uppercase leading-relaxed">
                  Introduzca el nombre o código de barras para desplegar repuestos disponibles. La cantidad en caja se deducirá de bodega.
                </p>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    value={searchPartQuery}
                    onChange={(e) => setSearchPartQuery(e.target.value)}
                    placeholder="Escriba código, referencia o nombre (ej: filtro, aceite, pastillas)..."
                    className="w-full bg-slate-50 border-2 border-slate-800 focus:border-blue-500 focus:outline-none pl-10 pr-4 py-2.5 text-xs font-mono uppercase tracking-wide rounded-none transition-all placeholder-slate-400 text-slate-900"
                  />
                </div>

                {/* Instant matches box */}
                <div className="space-y-2 pt-1">
                  {searchPartQuery ? (
                    filteredParts.length > 0 ? (
                      <div className="border border-slate-800 divide-y divide-slate-800 bg-slate-50">
                        {filteredParts.map(part => {
                          const hasStock = part.cantidad > 0;
                          return (
                            <div 
                              key={part.id} 
                              className="p-3 flex items-center justify-between gap-4 hover:bg-white transition-all select-none"
                            >
                              <div className="truncate">
                                <div className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                                  {part.nombre}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-500 uppercase">
                                  <span>CÓD: <strong className="text-slate-850">{part.codigo}</strong></span>
                                  <span>•</span>
                                  <span>UBI: <strong className="text-slate-850">{part.ubicacion || 'Estante'}</strong></span>
                                  <span>•</span>
                                  <span>Existencia: <strong className={hasStock ? 'text-emerald-600' : 'text-red-500'}>{part.cantidad} u</strong></span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono text-xs font-black text-slate-900">
                                  ${part.precio.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(part)}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-[9px] uppercase border border-slate-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Añadir</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center border-2 border-dashed border-slate-350 bg-slate-50 text-[11px] font-mono uppercase text-slate-500">
                        ⚠️ No se encontraron repuestos con "${searchPartQuery}". Revise la ortografía.
                      </div>
                    )
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 text-slate-450 text-[10.5px] uppercase font-mono bg-slate-50/50">
                      🛠️ Escriba el nombre de la ref. para desplegar el almacén rápido de venta.
                    </div>
                  )}
                </div>
              </div>

              {/* Cart contents */}
              <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Boleto Detalle de la Venta ({cartItems.length} items)
                    </h3>
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      onClick={() => setCartItems([])}
                      className="text-[9.5px] font-mono uppercase text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                    >
                      Limpiar Todo
                    </button>
                  )}
                </div>

                {cartItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11.5px] border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-900 text-[10px] uppercase text-slate-400 font-black">
                          <th className="py-2.5">Repuesto</th>
                          <th className="py-2.5 text-center w-24">Cant.</th>
                          <th className="py-2.5 text-right w-24">Precio</th>
                          <th className="py-2.5 text-right w-24">Total</th>
                          <th className="py-2.5 text-center w-12">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {cartItems.map(item => (
                          <tr key={item.repuestoId} className="hover:bg-slate-50/45">
                            <td className="py-3">
                              <span className="font-sans font-bold text-slate-900 text-xs block truncate max-w-[200px]" title={item.nombre}>
                                {item.nombre}
                              </span>
                              <span className="text-[9px] text-slate-500 block uppercase font-mono mt-0.5">
                                Cód: {item.codigo}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => handleUpdateCartQty(item.repuestoId, parseInt(e.target.value) || 0)}
                                className="w-14 bg-slate-100 text-slate-900 text-center font-bold text-xs py-1 border border-slate-500 focus:outline-none focus:border-blue-500 rounded-none uppercase"
                              />
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <div className="inline-flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.precioUnitario}
                                    onChange={(e) => handleUpdateCartPrice(item.repuestoId, parseFloat(e.target.value) || 0)}
                                    className="w-18 bg-slate-100 text-slate-900 text-right font-mono font-bold text-xs py-1 px-1.5 border border-slate-500 focus:outline-none focus:border-blue-500 rounded-none uppercase"
                                    title="Precio promocional / oferta unitaria"
                                  />
                                </div>
                                {item.precioOriginal !== undefined && item.precioOriginal > item.precioUnitario && (
                                  <span className="text-[9px] font-mono line-through text-red-500 tracking-tight" title="Precio base original">
                                    Base: ${item.precioOriginal.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right text-slate-900 font-black">
                              ${(item.precioUnitario * item.cantidad).toFixed(2)}
                            </td>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => handleRemoveFromCart(item.repuestoId)}
                                className="p-1.5 bg-rose-50 border border-slate-900 text-rose-600 hover:bg-rose-500 hover:text-white rounded-none cursor-pointer transition-colors"
                                title="Quitar item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center border-2 border-dashed border-slate-100 text-slate-400 rounded-none bg-slate-50/40">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-350 stroke-[1.5] mb-2" />
                    <p className="text-[11px] font-mono uppercase">El comprobante de venta está vacío de momento.</p>
                    <p className="text-[9.5px] font-sans text-slate-400 mt-1">Busque repuestos en la caja de arriba para agregarlos a este pedido.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Invoice metadata & pricing totals (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-slate-950 text-white border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-6 space-y-5 select-none animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
                  <User className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Datos del Cliente Comprador</h3>
                </div>

                {/* Cliente Inputs */}
                <div className="space-y-3 font-mono">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Nombre del Cliente</label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez / Cliente General"
                      className="w-full bg-slate-900 border-2 border-slate-800 focus:border-blue-500 focus:outline-none px-3.5 py-2.5 text-xs text-white uppercase tracking-wider"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Cédula o Rif (Opcional)</label>
                    <input
                      type="text"
                      value={clienteCedula}
                      onChange={(e) => setClienteCedula(e.target.value)}
                      placeholder="Ej. V-12.345.678"
                      className="w-full bg-slate-900 border-2 border-slate-800 focus:border-blue-500 focus:outline-none px-3.5 py-2.5 text-xs text-white uppercase tracking-wider"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="uppercase tracking-wide">Tasa Cambiaria (Taller):</span>
                    <span className="font-extrabold text-blue-400">Bs {tasaUSDT.toFixed(2)} x 1 USD</span>
                  </div>
                  <p className="text-[8.5px] font-sans text-slate-500 leading-normal uppercase">
                    La conversión a Moneda Nacional (Bolívares) se calcula automáticamente tomando la tasa general asignada en el panel de control.
                  </p>
                </div>

                {/* Mathematical computation sum box */}
                <div className="bg-slate-900 p-4 border border-slate-850 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-400 uppercase">
                    <span>Monto Neto USD:</span>
                    <span className="font-extrabold text-slate-100">${totalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 uppercase">
                    <span>Neto VES (Conversión):</span>
                    <span className="font-medium text-slate-100">Bs {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center">
                    <span className="text-[10.5px] font-black uppercase text-blue-400 tracking-wider">Total a Cobrar:</span>
                    <span className="text-xl font-black text-white shrink-0 text-right font-mono">
                      Bs {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right text-[9px] text-slate-500 font-mono tracking-widest leading-none mt-1">
                    EVAL: ${totalUSD.toFixed(2)} USD
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProcessSale}
                  disabled={cartItems.length === 0}
                  className={`w-full py-3.5 text-xs font-black uppercase tracking-widest cursor-pointer active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 ${
                    cartItems.length === 0
                      ? 'bg-slate-900 border-2 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 border-2 border-slate-950 text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] active:shadow-none font-bold'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Procesar y Facturar Venta</span>
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* SALES HISTORY TAB VIEW */
          <div className="space-y-6 max-w-7xl mx-auto">
            
            {/* Search Filter input on History */}
            <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Historial de Venta de Repuestos</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-mono uppercase">
                  Consulte todos los recibos y tickets de repuestos despachados directamente en caja sin orden de trabajo vinculada.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                </span>
                <input
                  type="text"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  placeholder="Buscar por ID de Venta, Cliente o Cédula..."
                  className="w-full bg-slate-50 border-2 border-slate-800 focus:border-blue-500 focus:outline-none pl-9 pr-3 py-1.5 text-xs font-mono uppercase tracking-wide rounded-none transition-all placeholder-slate-400"
                />
              </div>
            </div>

            {/* List and rows */}
            {filteredSales.length > 0 ? (
              <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase tracking-wider font-extrabold">
                        <th className="p-4 border-r border-slate-800 w-36">ID Venta</th>
                        <th className="p-4 border-r border-slate-800">Fecha</th>
                        <th className="p-4 border-r border-slate-800">Cliente / Cédula</th>
                        <th className="p-4 border-r border-slate-800">Detalle Repuestos</th>
                        <th className="p-4 border-r border-slate-800 text-right w-36">Importe USD</th>
                        <th className="p-4 border-r border-slate-800 text-right w-44">Importe Bs (Fórmula)</th>
                        <th className="p-4 text-center w-28">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredSales.map((v, idx) => {
                        const representationVES = v.totalUsd * v.tasaUsdt;
                        return (
                          <tr key={v.id} className={`font-mono text-xs hover:bg-slate-50/70 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-100/25'}`}>
                            
                            {/* ID */}
                            <td className="p-4 border-r border-slate-200 font-extrabold text-blue-600 group-hover:text-blue-800">
                              {v.id}
                            </td>

                            {/* Date */}
                            <td className="p-4 border-r border-slate-200 text-slate-500 whitespace-nowrap">
                              {v.fecha.split('-').reverse().join('/')}
                            </td>

                            {/* Nom / Ced */}
                            <td className="p-4 border-r border-slate-200 font-sans">
                              <span className="font-bold text-slate-900 block uppercase truncate max-w-[170px]" title={v.clienteNombre}>
                                {v.clienteNombre}
                              </span>
                              <span className="text-[9.5px] text-slate-400 block font-mono mt-0.5 uppercase">
                                C.I: {v.clienteCedula || 'S/N'}
                              </span>
                            </td>

                            {/* Items count / preview */}
                            <td className="p-4 border-r border-slate-200 font-sans">
                              <div className="max-w-[280px]">
                                <span className="font-mono font-black text-[9.5px] bg-slate-900 text-white px-1.5 py-0.5 rounded-none uppercase block w-max mb-1.5">
                                  {v.items.length} {v.items.length === 1 ? 'REPUESTO' : 'REPUESTOS'}
                                </span>
                                <p className="text-[10px] text-slate-500 font-serif leading-tight italic line-clamp-2">
                                  {v.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                                </p>
                              </div>
                            </td>

                            {/* Monto USD */}
                            <td className="p-4 border-r border-slate-200 text-right text-slate-900 font-black whitespace-nowrap">
                              ${v.totalUsd.toFixed(2)}
                            </td>

                            {/* Monto VES */}
                            <td className="p-4 border-r border-slate-200 text-right text-emerald-800 font-extrabold whitespace-nowrap">
                              Bs {representationVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-[8.5px] text-slate-400 block font-mono font-medium mt-0.5 lowercase">
                                tasa Ref: Bs {v.tasaUsdt.toFixed(2)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-center whitespace-nowrap gap-1.5 flex items-center justify-center">
                              <button
                                onClick={() => handlePrintSaleTicket(v)}
                                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-900 font-sans font-bold text-[10px] cursor-pointer transition-all rounded-none flex items-center gap-1 uppercase"
                                title="Volver a Imprimir recibo de Venta"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Ticket</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (!isAdmin) {
                                    alert('Se requieren credenciales de Administrador para registrar devoluciones y reabastecer el inventario.');
                                    onTriggerAdminLogin();
                                    return;
                                  }
                                  if (confirm(`¿Proceder con la DEVOLUCIÓN de la venta ${v.id}?\n\n- Se eliminará este registro de facturación.\n- Se devolverán todas las piezas de repuestos de esta venta de vuelta al stock de inventario.`)) {
                                    onCancelAndRestockVenta(v.id);
                                  }
                                }}
                                className="px-2 py-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white border border-slate-900 text-amber-800 font-sans font-bold text-[10px] cursor-pointer transition-all rounded-none flex items-center gap-1 uppercase"
                                title="Cancelar Venta y Devolver Repuestos al Inventario"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Devolución</span>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(v.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-500 hover:text-white border border-slate-900 text-red-650 rounded-none cursor-pointer transition-all block"
                                title="Eliminar este recibo sin devolver stock"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center border-4 border-dashed border-slate-200 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto stroke-[1.2] mb-3" />
                <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">Historial de Ventas Vacío</h4>
                <p className="text-[11px] font-mono text-slate-400 mt-1 uppercase">No hay registros de ventas directa con los criterios de búsqueda provistos.</p>
                <button
                  onClick={() => setActiveTab('nueva_venta')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-[9px] uppercase border border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-xs cursor-pointer transition-all"
                >
                  Ir a Facturar Venta
                </button>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
