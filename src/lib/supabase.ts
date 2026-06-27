import { createClient } from '@supabase/supabase-js';
import { Cliente, Vehiculo, Repuesto, OrdenTrabajo, Trabajador, SolicitudRepuesto, VentaIndividual } from '../types';

// Supabase Configuration using provided credentials
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nyjtnaoavgdxdljzozmd.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55anRuYW9hdmdkeGRsanpvem1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTEwNDIsImV4cCI6MjA5NDkyNzA0Mn0.EOajBv5iMiPMUOY_p5dX9HpcmxKL6HlZUCtxAkygG0s';


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State tracking for table existence and connectivity
export const getDbStatus = async (): Promise<{ connected: boolean; message: string; tablesOk: boolean }> => {
  try {
    const { data, error } = await supabase.from('clientes').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found') || error.message.includes('relation "clientes" does not exist')) {
        return {
          connected: true,
          message: 'Conectado a de Supabase, pero falta ejecutar el script SQL de creación de tablas.',
          tablesOk: false
        };
      }
      return {
        connected: false,
        message: `Error de conexión: ${error.message}`,
        tablesOk: false
      };
    }
    return {
      connected: true,
      message: 'Sincronizado con Supabase Cloud DB',
      tablesOk: true
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Error de red: ${err.message || err}`,
      tablesOk: false
    };
  }
};

// --- DATA ACCESS OVER SUPABASE MAPPERS ---

/* 1. Clientes */
export async function getClientesDB(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre');
  if (error) throw error;
  
  return (data || []).map((c: any) => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono || '',
    email: c.email || '',
    cedula: c.cedula,
    nacimiento: c.nacimiento || '',
    direccion: c.direccion || '',
    observaciones: c.observaciones || '',
    fechaReg: c.fecha_reg
  }));
}

export async function upsertClienteDB(c: Cliente): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .upsert({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      email: c.email,
      cedula: c.cedula,
      nacimiento: c.nacimiento,
      direccion: c.direccion,
      observaciones: c.observaciones,
      fecha_reg: c.fechaReg
    });
  if (error) throw error;
}

export async function deleteClienteDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* 2. Vehiculos */
export async function getVehiculosDB(): Promise<Vehiculo[]> {
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .order('marca');
  if (error) throw error;
  
  return (data || []).map((v: any) => ({
    id: v.id,
    clienteId: v.cliente_id,
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    placa: v.placa,
    color: v.color || '#6b7280',
    vin: v.vin || '',
    km: v.km || 0,
    observaciones: v.observaciones || '',
    fechaReg: v.fecha_reg
  }));
}

export async function upsertVehiculoDB(v: Vehiculo): Promise<void> {
  const { error } = await supabase
    .from('vehiculos')
    .upsert({
      id: v.id,
      cliente_id: v.clienteId,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio,
      placa: v.placa,
      color: v.color,
      vin: v.vin,
      km: v.km,
      observaciones: v.observaciones,
      fecha_reg: v.fechaReg
    });
  if (error) throw error;
}

export async function deleteVehiculoDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehiculos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* 3. Repuestos */
export async function getRepuestosDB(): Promise<Repuesto[]> {
  const { data, error } = await supabase
    .from('repuestos')
    .select('*')
    .order('codigo');
  if (error) throw error;
  
  return (data || []).map((r: any) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    referencia: r.referencia || '',
    categoria: r.categoria || 'General',
    proveedor: r.proveedor || '',
    cantidad: r.cantidad,
    stockMin: r.stock_min,
    precio: Number(r.precio),
    ubicacion: r.ubicacion || '',
    fechaIngreso: r.fecha_ingreso
  }));
}

export async function upsertRepuestoDB(r: Repuesto): Promise<void> {
  const { error } = await supabase
    .from('repuestos')
    .upsert({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      referencia: r.referencia,
      categoria: r.categoria,
      proveedor: r.proveedor,
      cantidad: r.cantidad,
      stock_min: r.stockMin,
      precio: r.precio,
      ubicacion: r.ubicacion,
      fecha_ingreso: r.fechaIngreso
    });
  if (error) throw error;
}

export async function deleteRepuestoDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('repuestos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* 4. Ordenes de Trabajo */
export async function getOrdenesDB(): Promise<OrdenTrabajo[]> {
  const { data, error } = await supabase
    .from('ordenes')
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  
  return (data || []).map((o: any) => ({
    id: o.id,
    clienteId: o.cliente_id,
    autoId: o.auto_id,
    fecha: o.fecha,
    descripcion: o.descripcion,
    repuestos: Array.isArray(o.repuestos) ? o.repuestos : [],
    observaciones: o.observaciones || '',
    laborCost: Number(o.labor_cost),
    kmIngreso: o.km_ingreso,
    estado: o.estado,
    creadoEn: o.creado_en,
    trabajadorId: o.trabajador_id || undefined,
    diagnostico: o.diagnostico || ''
  }));
}

export async function upsertOrdenDB(o: OrdenTrabajo): Promise<void> {
  const { error } = await supabase
    .from('ordenes')
    .upsert({
      id: o.id,
      cliente_id: o.clienteId,
      auto_id: o.autoId,
      fecha: o.fecha,
      descripcion: o.descripcion,
      repuestos: o.repuestos,
      observaciones: o.observaciones,
      labor_cost: o.laborCost,
      km_ingreso: o.kmIngreso,
      estado: o.estado,
      creado_en: o.creadoEn,
      trabajador_id: o.trabajadorId || null,
      diagnostico: o.diagnostico || null
    });
  if (error) throw error;
}

export async function deleteOrdenDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('ordenes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* 5. Trabajadores */
export async function getTrabajadoresDB(): Promise<Trabajador[]> {
  const { data, error } = await supabase
    .from('trabajadores')
    .select('*')
    .order('id');
  if (error) throw error;
  
  return (data || []).map((t: any) => ({
    id: t.id,
    nombre: t.nombre,
    especialidad: t.especialidad,
    telefono: t.telefono || '',
    fechaIngreso: t.fecha_ingreso,
    usuario: t.usuario || '',
    contrasena: t.contrasena || ''
  }));
}

export async function upsertTrabajadorDB(t: Trabajador): Promise<void> {
  const { error } = await supabase
    .from('trabajadores')
    .upsert({
      id: t.id,
      nombre: t.nombre,
      especialidad: t.especialidad,
      telefono: t.telefono,
      fecha_ingreso: t.fechaIngreso,
      usuario: t.usuario || null,
      contrasena: t.contrasena || null
    });
  if (error) throw error;
}

export async function deleteTrabajadorDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('trabajadores')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* 6. Solicitudes de Repuestos (Part Requests) */
export async function getSolicitudesDB(): Promise<SolicitudRepuesto[]> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  
  return (data || []).map((s: any) => ({
    id: s.id,
    ordenId: s.orden_id,
    ordenCodigo: s.orden_codigo,
    autoPlaca: s.auto_placa,
    mecanicoNombre: s.mecanico_nombre,
    repuestoNombre: s.repuesto_nombre,
    repuestoId: s.repuesto_id,
    cantidad: Number(s.cantidad),
    estado: s.estado,
    creadoEn: s.creado_en
  }));
}

export async function upsertSolicitudDB(s: SolicitudRepuesto): Promise<void> {
  const { error } = await supabase
    .from('solicitudes')
    .upsert({
      id: s.id,
      orden_id: s.ordenId,
      orden_codigo: s.ordenCodigo,
      auto_placa: s.autoPlaca,
      mecanico_nombre: s.mecanicoNombre,
      repuesto_nombre: s.repuestoNombre,
      repuesto_id: s.repuestoId,
      cantidad: s.cantidad,
      estado: s.estado,
      creado_en: s.creadoEn
    });
  if (error) throw error;
}

export async function deleteSolicitudDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('solicitudes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function seedSupabaseCloud(
  clientes: Cliente[],
  vehiculos: Vehiculo[],
  repuestos: Repuesto[],
  ordenes: OrdenTrabajo[],
  trabajadores: Trabajador[],
  solicitudes: SolicitudRepuesto[]
) {
  try {
    for (const c of clientes) {
      await upsertClienteDB(c);
    }
    for (const v of vehiculos) {
      await upsertVehiculoDB(v);
    }
    for (const r of repuestos) {
      await upsertRepuestoDB(r);
    }
    for (const o of ordenes) {
      await upsertOrdenDB(o);
    }
    for (const t of trabajadores) {
      await upsertTrabajadorDB(t);
    }
    for (const s of solicitudes) {
      await upsertSolicitudDB(s);
    }
    console.log('Sembrado inicial en Supabase exitoso.');
  } catch (err) {
    console.error('Error al realizar el sembrado inicial en Supabase:', err);
  }
}

/* 7. Ventas Individuales de Repuestos */
export async function getVentasDB(): Promise<VentaIndividual[]> {
  const { data, error } = await supabase
    .from('ventas_individuales')
    .select('*')
    .order('creado_en', { ascending: false });
  
  if (error) {
    throw error;
  }

  return (data || []).map((v: any) => ({
    id: v.id,
    fecha: v.fecha,
    clienteNombre: v.cliente_nombre || 'Cliente General',
    clienteCedula: v.cliente_cedula || '',
    items: Array.isArray(v.items) ? v.items : [],
    tasaUsdt: Number(v.tasa_usdt || 44.50),
    totalUsd: Number(v.total_usd || 0.00),
    creadoEn: v.creado_en
  }));
}

export async function upsertVentaDB(v: VentaIndividual): Promise<void> {
  const { error } = await supabase
    .from('ventas_individuales')
    .upsert({
      id: v.id,
      fecha: v.fecha,
      cliente_nombre: v.clienteNombre,
      cliente_cedula: v.clienteCedula,
      items: v.items,
      tasa_usdt: v.tasaUsdt,
      total_usd: v.totalUsd,
      creado_en: v.creadoEn
    });
  if (error) {
    // Check if it's because table is missing, provide a friendly warning
    if (error.message.includes('relation "ventas_individuales" does not exist')) {
      console.warn('Falta agregar la tabla ventas_individuales ejecutando el script SQL.');
      throw new Error('La tabla "ventas_individuales" no existe en su base de datos. Por favor ejecute el script SQL desde la Consola SQL.');
    }
    throw error;
  }
}

export async function deleteVentaDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('ventas_individuales')
    .delete()
    .eq('id', id);
  if (error) throw error;
}


