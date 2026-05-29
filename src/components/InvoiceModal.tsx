import { useState } from 'react';
import { Cliente, Vehiculo, OrdenTrabajo } from '../types';
import { Printer, X, Receipt, Shield, TrendingUp } from 'lucide-react';

interface InvoiceModalProps {
  orden: OrdenTrabajo;
  clients: Cliente[];
  vehicles: Vehiculo[];
  onClose: () => void;
}

export default function InvoiceModal({ orden, clients, vehicles, onClose }: InvoiceModalProps) {
  const cliente = clients.find(c => c.id === orden.clienteId);
  const vehiculo = vehicles.find(v => v.id === orden.autoId);

  const subtotalParts = orden.repuestos.reduce((sum, item) => sum + item.precio * item.qty, 0);
  const total = subtotalParts + (orden.laborCost || 0);

  const [tasaInput, setTasaInput] = useState<string>(() => {
    const saved = localStorage.getItem('castellanos_tasa_usdt');
    return saved || '44.50';
  });

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
          <p class="sub">Rif: J-40892813-0 | Telf: 0414-123-4567</p>
          <p class="sub">Caracas, Venezuela</p>
        </div>

        <div class="id-box">NRO ORDEN: ${orden.id}</div>
        
        <div class="row"><span class="lbl">De la Fecha:</span><span class="val">${orden.fecha.split('-').reverse().join('/')}</span></div>
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
          ${orden.repuestos.map(p => `
            <div class="rep-row">
              <span>${p.nombre} (x${p.qty})</span>
              <span>Bs ${(p.precio * p.qty * tasaUSDT).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          `).join('')}
        ` : ''}

        <hr class="divider">

        ${subtotalParts > 0 ? `<div class="row"><span class="lbl">Subtotal Repuestos:</span><span class="val">Bs ${(subtotalParts * tasaUSDT).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ''}
        ${orden.laborCost > 0 ? `<div class="row"><span class="lbl">Costo por Mano de Obra:</span><span class="val">Bs ${(orden.laborCost * tasaUSDT).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ''}
        
        <div class="total-ves-row">
          <span>TOTAL A PAGAR:</span>
          <span>Bs ${totalVES.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                  {orden.repuestos.map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-700 bg-white p-2 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 uppercase">🔧 {r.nombre}</span>
                        <span className="text-slate-400 ml-2 text-[9px]">x{r.qty} uds</span>
                      </div>
                      <span className="font-bold text-slate-900">${(r.precio * r.qty).toLocaleString('es')}</span>
                    </div>
                  ))}
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
