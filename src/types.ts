export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  cedula: string;
  nacimiento: string;
  direccion: string;
  observaciones: string;
  fechaReg: string;
}

export interface Vehiculo {
  id: string;
  clienteId: string;
  marca: string;
  modelo: string;
  anio: number | null;
  placa: string;
  color: string;
  vin: string;
  km: number;
  observaciones: string;
  fechaReg: string;
}

export interface Repuesto {
  id: string;
  codigo: string;
  nombre: string;
  referencia: string;
  categoria: string;
  proveedor: string;
  cantidad: number;
  stockMin: number;
  precio: number;
  ubicacion: string;
  fechaIngreso: string;
}

export interface RepuestoUtilizado {
  id: string;
  nombre: string;
  qty: number;
  precio: number;
}

export interface OrdenTrabajo {
  id: string;
  clienteId: string;
  autoId: string;
  fecha: string;
  descripcion: string;
  repuestos: RepuestoUtilizado[];
  observaciones: string;
  laborCost: number;
  kmIngreso: number;
  estado: 'abierta' | 'en_proceso' | 'terminada';
  creadoEn: string;
  trabajadorId?: string;
  diagnostico?: string;
}

export interface Trabajador {
  id: string;
  nombre: string;
  especialidad: string;
  telefono: string;
  fechaIngreso: string;
}

export interface SolicitudRepuesto {
  id: string;
  ordenId: string;
  ordenCodigo: string;
  autoPlaca: string;
  mecanicoNombre: string;
  repuestoNombre: string;
  repuestoId: string;
  cantidad: number;
  estado: 'pendiente' | 'entregado';
  creadoEn: string;
}

export interface VentaItem {
  repuestoId: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  precioUnitario: number;
  precioOriginal?: number;
}

export interface VentaIndividual {
  id: string;
  fecha: string;
  clienteNombre: string;
  clienteCedula: string;
  items: VentaItem[];
  tasaUsdt: number;
  totalUsd: number;
  creadoEn: string;
}


