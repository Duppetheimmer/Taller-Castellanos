import { useState } from 'react';
import { Cliente, Vehiculo, OrdenTrabajo } from '../types';
import { Printer, X, Receipt, Shield, TrendingUp } from 'lucide-react';

interface InvoiceModalProps {
  orden: OrdenTrabajo;
  clients: Cliente[];
  vehicles: Vehiculo[];
  onClose: () => void;
  onUpdateOrden?: (updated: OrdenTrabajo) => void;
  userRole?: 'administrador' | 'recepcionista' | 'trabajador';
}

export default function InvoiceModal({ orden, clients, vehicles, onClose, onUpdateOrden, userRole = 'recepcionista' }: InvoiceModalProps) {
  const cliente = clients.find(c => c.id === orden.clienteId);
  const vehiculo = vehicles.find(v => v.id === orden.autoId);

  const subtotalParts = orden.repuestos.reduce((sum, item) => sum + item.precio * item.qty, 0);
  const total = subtotalParts + (orden.laborCost || 0);

  const [tasaInput, setTasaInput] = useState<string>(() => {
    const saved = localStorage.getItem('castellanos_tasa_usdt');
    return saved || '44.50';
  });

  const [metodoPago, setMetodoPago] = useState<'divisas' | 'bolivares'>('divisas');

  const tasaUSDT = parseFloat(tasaInput) || 0;
  const totalVES = total * tasaUSDT;

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=460,height=755');
    if (!w) {
      alert('Por favor permita las ventanas emergentes para poder generar la impresión de este ticket.');
      return;
    }

    const stateLabels = {
      abierta: 'ABIERTA / EN DIAGNÓSTICO',
      en_proceso: 'EN PROCESO / REPARACIÓN',
      terminada: 'COMPLETADA Y ENTREGADA',
    };

    w.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Recibo de Servicio - Castellanos Motors - ${orden.id}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            color: #111;
            background: #fff;
            padding: 30px 24px;
            font-size: 13px;
            width: 420px;
            margin: 0 auto;
            line-height: 1.4;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .header-title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px; }
          .sub { color: #555; font-size: 11px; margin-bottom: 2px; }
          .id-box {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            background: #f1f2f5;
            padding: 10px;
            margin: 12px 0;
            border-radius: 0px;
            border: 2px solid #111;
          }
          .divider { border: none; border-top: 1px dashed #888; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; gap: 12px; }
          .lbl { color: #555; flex-shrink: 0; }
          .val { text-align: right; font-weight: 600; }
          .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #444; margin: 12px 0 6px; font-weight: bold; background: #fafafa; padding: 2px 4px; }
          .rep-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
          .total-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-top: 10px; padding-top: 8px; border-top: 2px solid #111; }
          .total-ves-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; color: #fff; background: #111; padding: 6px 8px; border-radius: 0px; margin-top: 6px; }
          .tasa-row { display: flex; justify-content: space-between; font-size: 10px; color: #555; margin-bottom: 8px; margin-top: 4px; }
          .desc-block { line-height: 1.5; margin: 6px 0; background: #fafafa; padding: 8px; border-left: 2px solid #444; border-radius: 2px; }
          .footer { text-align: center; color: #555; font-size: 10px; margin-top: 22px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="header-title">⚙️ CASTELLANOS MOTORS</div>
          <p class="sub">Servicio Mecánico y Repuestos</p>
          <p class="sub">Rif: J-406610917 | Telf: 0412 7735263</p>
          <p class="sub">Barinas, Venezuela</p>
        </div>

        <div class="id-box">NRO ORDEN: ${orden.id}</div>
        
        <div class="row"><span class="lbl">De la Fecha:</span><span class="val">${orden.fecha.split('-').reverse().join('/')}</span></div>
        <div class="row"><span class="lbl">Forma de Pago:</span><span class="val" style="font-weight: bold; background: #e1f5fe; border: 1px solid #0288d1; padding: 2px 6px; border-radius: 2px; text-transform: uppercase; font-size: 11px; display: inline-block;">${metodoPago === 'divisas' ? '💵 PAGO EN DIVISAS ($)' : '🇻🇪 PAGO EN BOLÍVARES (Bs.)'}</span></div>
        <div class="row"><span class="lbl">Estado:</span><span class="val">${stateLabels[orden.estado] || orden.estado}</span></div>

        <hr class="divider">

        <div class="section-title">Información del cliente</div>
        <div class="row"><span class="lbl">Cliente:</span><span class="val">${cliente ? cliente.nombre : '—'}</span></div>
        ${cliente?.cedula ? `<div class="row"><span class="lbl">Cédula / RIF:</span><span class="val">${cliente.cedula}</span></div>` : ''}
        ${cliente?.telefono ? `<div class="row"><span class="lbl">Teléfono:</span><span class="val">${cliente.telefono}</span></div>` : ''}
        <div class="row"><span class="lbl">Cód. Cliente:</span><span class="val">${orden.clienteId}</span></div>

        <hr class="divider">

        <div class="section-title">Vehículo Registrado</div>
        <div class="row"><span class="lbl">Marca/Modelo:</span><span class="val">${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : '—'}</span></div>
        ${vehiculo?.placa ? `<div class="row"><span class="lbl">Número de Placa:</span><span class="val">${vehiculo.placa}</span></div>` : ''}
        ${vehiculo?.anio ? `<div class="row"><span class="lbl">Año Fabricación:</span><span class="val">${vehiculo.anio}</span></div>` : ''}
        ${orden.kmIngreso ? `<div class="row"><span class="lbl text-xs text-gray-500">Kilometraje Ingreso:</span><span class="val">${orden.kmIngreso.toLocaleString('es')} KM</span></div>` : ''}
        ${vehiculo?.vin ? `<div class="row"><span class="lbl">Nro Serial/VIN:</span><span class="val" style="font-size: 11px;">${vehiculo.vin}</span></div>` : ''}

        <hr class="divider">

        <div class="section-title">Descripción del Trabajo</div>
        <div class="desc-block">${orden.descripcion}</div>
        ${orden.observaciones ? `<div class="sub" style="margin-top: 4px;"><strong>Diagnóstico/Rep. Recomendado:</strong> ${orden.observaciones}</div>` : ''}

        ${orden.repuestos.length > 0 ? `
          <hr class="divider">
          <div class="section-title">Repuestos y Piezas Utilizadas</div>
          ${orden.repuestos.map(p => {
            const orig = p.precioOriginal !== undefined ? p.precioOriginal : p.precio;
            const hasDiscount = orig > p.precio;
            
            const origPriceBs = orig * tasaUSDT;
            const finalPriceBs = p.precio * tasaUSDT;
            
            const priceBsText = hasDiscount 
              ? `<span style="text-decoration: line-through; color: #888; font-size: 11px; margin-right: 4px;">Bs ${origPriceBs.toLocaleString('es', { minimumFractionDigits: 2 })}</span><span style="font-weight: bold; color: #111;">Bs ${finalPriceBs.toLocaleString('es', { minimumFractionDigits: 2 })}</span>`
              : `Bs ${finalPriceBs.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              
            const priceUsdText = hasDiscount
              ? `<span style="text-decoration: line-through; color: #888; margin-right: 4px;">$${orig.toFixed(2)}</span><span style="font-weight: bold; color: #27ae60;">$${p.precio.toFixed(2)}</span>`
              : `$${p.precio.toFixed(2)}`;

            const primaryItemTotalText = metodoPago === 'divisas'
              ? `$ ${(p.precio * p.qty).toFixed(2)} USD`
              : `Bs ${(p.precio * p.qty * tasaUSDT).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            return `
              <div class="rep-row" style="display: block; padding: 6px 0; border-bottom: 1px dotted #ccc;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                  <span>⚙️ ${p.nombre} (x${p.qty})</span>
                  <span>${primaryItemTotalText}</span>
                </div>
                <div style="font-size: 10px; color: #555; margin-top: 2px; font-family: monospace;">
                  Unit: ${priceUsdText} | ${priceBsText} ${hasDiscount ? '<span style="color: #27ae60; font-weight: bold; font-size: 9px; margin-left: 2px; text-transform: uppercase;">(Rebaja Aplicada)</span>' : ''}
                </div>
              </div>
            `;
          }).join('')}
        ` : ''}

        <hr class="divider">

        ${subtotalParts > 0 ? `<div class="row"><span class="lbl">Subtotal Repuestos:</span><span class="val">${metodoPago === 'divisas' ? `$ ${subtotalParts.toFixed(2)} USD` : `Bs ${(subtotalParts * tasaUSDT).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span></div>` : ''}
        ${orden.laborCost > 0 ? `<div class="row"><span class="lbl">Costo por Mano de Obra:</span><span class="val">${metodoPago === 'divisas' ? `$ ${(orden.laborCost).toFixed(2)} USD` : `Bs ${(orden.laborCost * tasaUSDT).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span></div>` : ''}
        
        ${(() => {
          const sumOriginal = orden.repuestos.reduce((sum, item) => sum + (item.precioOriginal !== undefined ? item.precioOriginal : item.precio) * item.qty, 0);
          const partsSavings = sumOriginal - subtotalParts;
          if (partsSavings > 0) {
            return `
              <div class="row" style="color: #27ae60; font-weight: bold; font-family: monospace; font-size: 11px;">
                <span>✨ Rebaja/Ahorro en Repuestos:</span>
                <span>${metodoPago === 'divisas' ? `-$${partsSavings.toFixed(2)} USD` : `-Bs ${(partsSavings * tasaUSDT).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
              </div>
            `;
          }
          return '';
        })()}

        <div class="total-ves-row">
          <span>TOTAL A PAGAR (${metodoPago === 'divisas' ? 'DIVISAS' : 'BOLÍVARES'}):</span>
          <span>${metodoPago === 'divisas' ? `$ ${total.toFixed(2)} USD` : `Bs ${totalVES.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
        </div>

        <div class="row" style="margin-top: 6px; font-weight: bold;">
          <span>${metodoPago === 'divisas' ? 'Equivalente en Bolívares:' : 'Equivalente en Divisas:'}</span>
          <span>${metodoPago === 'divisas' ? `Bs ${totalVES.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$ ${total.toFixed(2)} USD`}</span>
        </div>

        <div class="row" style="font-size: 10px; color: #555; border-bottom: 2px solid #111; padding-bottom: 4px; font-family: monospace;">
          <span>Tasa de Cambio Referencia:</span>
          <span>1 USD = Bs ${tasaUSDT.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        <div class="center footer">
          <p>¡Gracias por su preferencia y confianza!</p>
          <p>Castellanos Motors garantiza un servicio seguro.</p>
          <p>Reportes generados automáticamente.</p>
          <p style="margin-top: 8px; font-size: 8px; color: #888;">Impreso: ${new Date().toLocaleString('es-VE')}</p>
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

  const handleApplyCustomPrice = (repuestoId: string, newPrice: number) => {
    if (!onUpdateOrden) return;

    const updatedRepuestos = orden.repuestos.map(r => {
      if (r.id === repuestoId) {
        const origPrice = r.precioOriginal !== undefined ? r.precioOriginal : r.precio;
        return {
          ...r,
          precio: newPrice,
          precioOriginal: origPrice
        };
      }
      return r;
    });

    const updatedOrder: OrdenTrabajo = {
      ...orden,
      repuestos: updatedRepuestos
    };

    onUpdateOrden(updatedOrder);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto select-none font-sans">
      <div className="bg-white border-4 border-slate-900 rounded-none w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b-2 border-slate-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            <span className="font-mono font-black text-xs uppercase tracking-widest text-white">Ficha Técnica & Recibo de Pago</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-[10px] uppercase tracking-wider px-3 py-1.5 border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 rounded-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6 bg-slate-50 font-mono text-xs uppercase tracking-wider">
          
          {/* Diagnostic status block */}
          <div className="p-4 bg-white border-2 border-slate-900 rounded-none flex justify-between items-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <div>
              <p className="text-[9px] text-slate-400 font-bold font-mono">ID de la Orden de Servicio</p>
              <p className="text-lg font-black text-blue-600 font-mono tracking-tight mt-1">{orden.id}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 border-2 text-[9px] font-black leading-none ${
                orden.estado === 'terminada' ? 'bg-green-50 border-green-600 text-green-700' :
                orden.estado === 'en_proceso' ? 'bg-blue-50 border-blue-600 text-blue-700' :
                'bg-amber-50 border-amber-600 text-amber-700'
              }`}>
                {orden.estado === 'terminada' ? 'Listo' : orden.estado === 'en_proceso' ? 'Labores' : 'Ingreso'}
              </span>
              <p className="text-[10px] text-slate-500 mt-2">{orden.fecha.split('-').reverse().join('/')}</p>
            </div>
          </div>

          {/* CONTROL DE PAGOS (CLIENTE & COMISION TRABAJADOR) */}
          <div className="p-4 bg-white border-2 border-slate-900 rounded-none space-y-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <h4 className="text-[10px] font-extrabold text-slate-400 border-b border-slate-100 pb-1.5 mb-1 font-mono">ESTADO DE PAGOS DE LA ORDEN</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Pago de Servicio (Cliente) */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">💵 PAGO CLIENTE:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-black border-2 uppercase ${
                    orden.servicioPagado 
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800' 
                      : 'bg-rose-50 border-rose-500 text-rose-700'
                  }`}>
                    {orden.servicioPagado ? '🟢 PAGADO' : '🔴 PENDIENTE'}
                  </span>
                  
                  {userRole !== 'trabajador' && onUpdateOrden && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateOrden({
                          ...orden,
                          servicioPagado: !orden.servicioPagado
                        });
                      }}
                      className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[8.5px] uppercase border border-slate-950 cursor-pointer transition-colors"
                    >
                      {orden.servicioPagado ? 'PENDIENTE' : 'PAGAR'}
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Pago de Comisión (Técnico) */}
              <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">⚙️ COMISIÓN TÉCNICA (MECÁNICO):</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-black border-2 uppercase ${
                    orden.comisionPagada 
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800' 
                      : 'bg-amber-50 border-amber-500 text-amber-800'
                  }`}>
                    {orden.comisionPagada ? '🟢 PAGADA' : '🟡 PENDIENTE'}
                  </span>

                  {userRole !== 'trabajador' && onUpdateOrden && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateOrden({
                          ...orden,
                          comisionPagada: !orden.comisionPagada
                        });
                      }}
                      className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[8.5px] uppercase border border-slate-950 cursor-pointer transition-colors"
                    >
                      {orden.comisionPagada ? 'PENDIENTE' : 'PAGAR'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner client facts */}
            <div className="space-y-2 bg-white p-4 border-2 border-slate-900">
              <h4 className="text-[10px] font-extrabold text-slate-400 border-b border-slate-100 pb-1.5">DATOS DEL CLIENTE</h4>
              {cliente ? (
                <div className="space-y-1.5 text-slate-700 font-bold">
                  <p className="text-xs font-black text-slate-950 block">{cliente.nombre}</p>
                  <p><span className="text-slate-400">Cédula:</span> {cliente.cedula || '—'}</p>
                  <p><span className="text-slate-400">Teléfono:</span> {cliente.telefono || '—'}</p>
                  <p><span className="text-slate-400">Código:</span> <span className="font-mono text-blue-600">{cliente.id}</span></p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic font-bold">No asignado</p>
              )}
            </div>

            {/* Vehicle spec facts */}
            <div className="space-y-2 bg-white p-4 border-2 border-slate-900">
              <h4 className="text-[10px] font-extrabold text-slate-400 border-b border-slate-100 pb-1.5">FICHA DEL AUTO</h4>
              {vehiculo ? (
                <div className="space-y-1.5 text-slate-700 font-bold">
                  <p className="text-xs font-black text-slate-950 block">{vehiculo.marca} {vehiculo.modelo}</p>
                  <p>
                    <span className="text-slate-400">Placa:</span>{' '}
                    <span className="font-mono bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-blue-800 font-black">
                      {vehiculo.placa}
                    </span>
                  </p>
                  <p><span className="text-slate-400">Año:</span> {vehiculo.anio || '—'}</p>
                  <p><span className="text-slate-400">Odómetro:</span> {orden.kmIngreso.toLocaleString('es')} KM</p>
                  <p><span className="text-slate-400">Serial VIN:</span> <span className="text-slate-500 font-mono text-[9px] block truncate">{vehiculo.vin || '—'}</span></p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic font-bold">No asignado</p>
              )}
            </div>
          </div>

          {/* Job description section */}
          <div className="space-y-2 bg-white p-4 border-2 border-slate-900">
            <h4 className="text-[10px] font-extrabold text-slate-400 font-mono">DIAGNÓSTICO Y LABORES MECÁNICAS</h4>
            <div className="text-xs text-slate-900 leading-relaxed whitespace-pre-line bg-slate-50 p-3 border border-slate-200 uppercase">
              {orden.descripcion}
            </div>
            {orden.observaciones && (
              <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase leading-relaxed font-mono">
                <span className="text-slate-900 font-black block">Recomendaciones adicionales:</span>
                <p className="font-medium italic text-slate-700 mt-1">{orden.observaciones}</p>
              </div>
            )}
          </div>

          {/* SELECCIÓN DE MÉTODO DE PAGO */}
          <div className="bg-white border-2 border-slate-900 p-4 font-mono text-xs space-y-3 pb-3.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-extrabold uppercase text-slate-800 flex items-center gap-1.5 text-[10px]">
                💳 FORMA DE IMPRESIÓN: MÉTODO DE PAGO
              </span>
            </div>
            <p className="text-[9px] text-slate-500 leading-relaxed font-semibold lowercase">
              Seleccione la opción de pago que prefiera el cliente para que conste de manera visible e inequívoca en la boleta técnica impresa.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMetodoPago('divisas')}
                className={`py-2 px-3 border-2 font-black text-center text-[10.5px] cursor-pointer transition-all ${
                  metodoPago === 'divisas'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                💵 PAGO EN DIVISAS ($)
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('bolivares')}
                className={`py-2 px-3 border-2 font-black text-center text-[10.5px] cursor-pointer transition-all ${
                  metodoPago === 'bolivares'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                🇻🇪 EN BOLÍVARES (Bs.)
              </button>
            </div>
          </div>

          {/* TASA DE CAMBIO REFERENCIAL - CONFIG BLOCK (Bolívares) */}
          <div className="bg-amber-50 border-2 border-amber-400 p-4 font-mono text-xs space-y-2 pb-3.5">
            <div className="flex items-center justify-between gap-1.5 border-b border-amber-200 pb-1.5">
              <span className="font-extrabold uppercase text-amber-900 flex items-center gap-1.5 text-[10px]">
                <TrendingUp className="w-4 h-4 text-amber-600" /> SINTONÍA DE TASA - CAMBIO REFERENCIAL
              </span>
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[8.5px] font-black">
                PROMEDIO Bs
              </span>
            </div>
            <p className="text-[9px] text-amber-800 leading-relaxed font-semibold lowercase">
              Establezca la tasa referencial del mercado para calcular de forma inmediata el precio de la reparación e imprimir el recibo en bolívares (VES).
            </p>
            <div className="flex items-center gap-4 bg-white p-2.5 border border-amber-300">
              <span className="text-slate-500 font-bold">1 USD =</span>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={tasaInput}
                onChange={(e) => {
                  setTasaInput(e.target.value);
                  localStorage.setItem('castellanos_tasa_usdt', e.target.value);
                }}
                className="w-24 px-2 py-1.5 border-2 border-slate-950 font-black text-xs text-slate-950 bg-amber-50/50 text-right focus:ring-1 focus:ring-amber-500 focus:outline-none"
                placeholder="44.50"
              />
              <span className="text-slate-500 font-bold">BOLÍVARES (VES)</span>
            </div>
          </div>

          {/* Parts and services bill break down */}
          <div className="space-y-3 bg-white p-4 border-2 border-slate-900">
            <h4 className="text-[10px] font-extrabold text-slate-400 border-b border-slate-100 pb-1.5 mb-2">INTEGRACIÓN DE COSTOS</h4>
            
            {orden.repuestos.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Repuestos Utilizados</p>
                <div className="space-y-1">
                  {orden.repuestos.map((r, idx) => {
                    const orig = r.precioOriginal !== undefined ? r.precioOriginal : r.precio;
                    const hasDiscount = orig > r.precio;
                    return (
                      <div key={idx} className="bg-white p-3 border-2 border-slate-900 rounded-none space-y-2 mb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-extrabold text-slate-900 block">⚙️ {r.nombre}</span>
                            <span className="text-slate-400 font-mono text-[9.5px]">CANTIDAD: {r.qty} UDS</span>
                          </div>
                          <div className="text-right font-mono font-bold text-slate-950">
                            {hasDiscount && (
                              <span className="text-[10px] text-slate-400 line-through mr-2 font-mono">${(orig * r.qty).toFixed(2)}</span>
                            )}
                            <span className={`${hasDiscount ? 'text-emerald-600' : ''}`}>${(r.precio * r.qty).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Interactive discount settings */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 border border-slate-200">
                          <div className="text-[9.5px] text-slate-500 font-semibold uppercase tracking-wider">
                            {hasDiscount ? (
                              <span className="text-emerald-600 block">
                                ✨ Rebaja: -${(orig - r.precio).toFixed(2)} USD c/u
                              </span>
                            ) : (
                              <span className="text-slate-400 block font-mono">Estándar: ${r.precio.toFixed(2)} USD c/u</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 font-sans">
                            <span className="text-[9px] font-extrabold text-slate-600 uppercase">Ajustar Precio ($):</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={r.precio.toFixed(2)}
                              className="w-16 px-1.5 py-1 border-2 border-slate-900 bg-white text-slate-900 font-bold text-center text-xs focus:outline-none"
                              value={r.precio}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= 0) {
                                  handleApplyCustomPrice(r.id, val);
                                }
                              }}
                            />
                            {hasDiscount && (
                              <button
                                type="button"
                                onClick={() => handleApplyCustomPrice(r.id, orig)}
                                className="px-1.5 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 text-[8.5px] font-black border border-red-300 uppercase rounded cursor-pointer transition-colors"
                              >
                                Quitar Rebaja
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic font-bold text-center bg-slate-50 p-3 border border-slate-200 mb-2">No se utilizaron repuestos desde bodega en esta orden</p>
            )}

            <div className="pt-3 border-t-2 border-dashed border-slate-200 space-y-1 text-xs font-bold uppercase text-slate-500">
              {subtotalParts > 0 && (
                <div className="flex justify-between">
                  <span>Subtotal Refacciones (USD):</span>
                  <span className="text-slate-900">${subtotalParts.toLocaleString('es')}</span>
                </div>
              )}
              {(() => {
                const sumOriginal = orden.repuestos.reduce((sum, item) => sum + (item.precioOriginal !== undefined ? item.precioOriginal : item.precio) * item.qty, 0);
                const partsSavings = sumOriginal - subtotalParts;
                if (partsSavings > 0) {
                  return (
                    <div className="flex justify-between text-emerald-600 font-extrabold">
                      <span>✨ Ahorro / Rebaja de Repuestos:</span>
                      <span>-${partsSavings.toFixed(2)} USD</span>
                    </div>
                  );
                }
                return null;
              })()}
              {orden.laborCost > 0 && (
                <div className="flex justify-between">
                  <span>Subtotal Mano de Obra (USD):</span>
                  <span className="text-slate-900">${orden.laborCost.toLocaleString('es')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-950 font-black border-t border-slate-200 pt-3 text-xs">
                <span className="text-blue-600">Total Liquidar (USD):</span>
                <span className="text-sm font-black text-slate-950 font-mono">${total.toLocaleString('es')}</span>
              </div>
              
              {tasaUSDT > 0 && (
                <div className="bg-slate-900 text-white p-3 border-2 border-slate-950 space-y-1 mt-1 font-mono">
                  <div className="flex justify-between items-center text-[11px] font-black tracking-wider text-amber-400">
                    <span>EVALUADO EN BOLÍVARES (VES):</span>
                    <span className="text-xs">
                      Bs {totalVES.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                    <span>TASA DE CAMBIO REFERENCIAL REGISTRADA:</span>
                    <span>1 USD = {tasaUSDT.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border-2 border-slate-900 flex gap-2 items-start text-[10px] text-blue-700 font-bold uppercase tracking-wide">
            <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>Este informe técnico fue auditado digitalmente. La procedencia y calidad de los repuestos utilizados rige bajo garantía legal aprobada.</p>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-100 border-t-2 border-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black border-2 border-slate-900 text-[10px] uppercase tracking-wider rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
          >
            Cerrar Recibo
          </button>
        </div>

      </div>
    </div>
  );
}
