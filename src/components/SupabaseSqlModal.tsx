import { useState } from 'react';
import { X, Copy, Check, Terminal, Database, ShieldAlert } from 'lucide-react';

interface SupabaseSqlModalProps {
  onClose: () => void;
}

export default function SupabaseSqlModal({ onClose }: SupabaseSqlModalProps) {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- =======================================================
-- SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS CASTELLANOS MOTORS
-- Copie y pegue este código dentro de la sección SQL Editor
-- en su panel de administración de Supabase (https://supabase.com)
-- =======================================================

-- Habilitar extensión para generación de UUIDs (si no está disponible)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tablas principales:
-- 1. Tabla: Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    cedula TEXT NOT NULL,
    nacimiento TEXT,
    direccion TEXT,
    observaciones TEXT,
    fecha_reg TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabla: Vehiculos
CREATE TABLE IF NOT EXISTS vehiculos (
    id TEXT PRIMARY KEY,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    anio INTEGER,
    placa TEXT NOT NULL UNIQUE,
    color TEXT,
    vin TEXT,
    km INTEGER NOT NULL DEFAULT 0,
    observaciones TEXT,
    fecha_reg TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabla: Repuestos (Inventario)
CREATE TABLE IF NOT EXISTS repuestos (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    referencia TEXT,
    categoria TEXT,
    proveedor TEXT,
    cantidad INTEGER NOT NULL DEFAULT 0,
    stock_min INTEGER NOT NULL DEFAULT 5,
    precio NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ubicacion TEXT,
    fecha_ingreso TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabla: Ordenes de Trabajo
CREATE TABLE IF NOT EXISTS ordenes (
    id TEXT PRIMARY KEY,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    auto_id TEXT REFERENCES vehiculos(id) ON DELETE SET NULL,
    fecha TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    repuestos JSONB NOT NULL DEFAULT '[]'::jsonb,
    observaciones TEXT,
    labor_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    km_ingreso INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL CHECK (estado IN ('abierta', 'en_proceso', 'terminada')),
    creado_en TEXT NOT NULL,
    trabajador_id TEXT,
    diagnostico TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabla: Trabajadores
CREATE TABLE IF NOT EXISTS trabajadores (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    especialidad TEXT NOT NULL,
    telefono TEXT NOT NULL,
    fecha_ingreso TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabla: Solicitudes de Repuestos (Part Requests)
CREATE TABLE IF NOT EXISTS solicitudes (
    id TEXT PRIMARY KEY,
    orden_id TEXT REFERENCES ordenes(id) ON DELETE CASCADE,
    orden_codigo TEXT NOT NULL,
    auto_placa TEXT NOT NULL,
    mecanico_nombre TEXT NOT NULL,
    repuesto_nombre TEXT NOT NULL,
    repuesto_id TEXT REFERENCES repuestos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'entregado')),
    creado_en TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- MIGRACIÓN IMPORTANTE: Asegurar que las columnas existan en la tabla ordenes (por si las tablas ya estaban creadas de antes)
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS trabajador_id TEXT;
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS diagnostico TEXT;

-- DESACTIVAR ROW LEVEL SECURITY EN TODAS LAS TABLAS 
-- (Corrige fallos silenciosos al guardar/actualizar datos)
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE repuestos DISABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE trabajadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes DISABLE ROW LEVEL SECURITY;

-- 7. Insertar Datos de Semilla de Ejemplo (Iniciales de Almacén)
-- Evita errores iniciales insertando datos de prueba que el sistema puede leer de inmediato.
INSERT INTO clientes (id, nombre, telefono, email, cedula, nacimiento, direccion, observaciones, fecha_reg)
VALUES 
('CLI-A1B2', 'Carlos Eduardo Mendoza', '0414-123-4567', 'carlos.mendoza@email.com', 'V-15.342.198', '1982-04-12', 'Av. Libertador, Edif. Altamira, Apto 4B, Caracas', 'Cliente frecuente. Prefiere comunicarse por WhatsApp.', '2025-01-10'),
('CLI-C3D4', 'María Gabriela Rodríguez', '0424-987-6543', 'maria.gaby@email.com', 'V-18.765.432', '1989-08-22', 'La Tahona, Calle Los Pinos, Qta. Bella Vista', 'Consultar siempre presupuesto antes de iniciar labor.', '2025-02-14'),
('CLI-E5F6', 'Juan Bautista Pérez', '0412-555-0199', 'juan.perez@email.com', 'V-12.980.345', '1975-11-30', 'Los Dos Caminos, Av. Sucre, Sec. Los Chorros', 'Usa su camión para reparto comercial diario.', '2025-03-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehiculos (id, cliente_id, marca, modelo, anio, placa, color, vin, km, observaciones, fecha_reg)
VALUES
('VEH-AA11', 'CLI-A1B2', 'Toyota', 'Corolla Delta XLI', 2018, 'AB123CD', '#6b7280', '93HDD92810JS83749', 112500, 'Mantener control estricto de consumo de refrigerante.', '2025-01-10'),
('VEH-BB22', 'CLI-C3D4', 'Ford', 'Explorer Limited 4WD', 2016, 'XY987ZZ', '#000000', '1FM5K8D84GGD29103', 145210, 'Detalle menor en amortiguador delantero izquierdo.', '2025-02-14'),
('VEH-CC33', 'CLI-E5F6', 'Chevrolet', 'Silverado LTZ Doble Cabina', 2015, 'MK456AA', '#ffffff', '1GC1KVE26FZA98471', 210850, 'Vehículo de carga pesada. Requiere revisión de frenos periódica.', '2025-03-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO repuestos (id, codigo, nombre, referencia, categoria, proveedor, cantidad, stock_min, precio, ubicacion, fecha_ingreso)
VALUES
('REP-0001', 'REP-0001', 'Filtro de Aceite Toyota Orland', '90915-YZZN1', 'Filtros', 'Distribuidora Automotriz Caracas', 15, 5, 12.50, 'Estante A-4', '2025-01-05'),
('REP-0002', 'REP-0002', 'Aceite Motor Sintético 15W-40 Galón', 'Mobil-1 15W40', 'Lubricantes', 'Lubricentro El Motor', 24, 8, 45.00, 'Pasillo Lubricantes Sec 1', '2025-01-10'),
('REP-0003', 'REP-0003', 'Pastillas de Freno Delanteras Explorer', 'SP-1243-FR', 'Frenos', 'Frenos Caracas C.A.', 10, 4, 38.00, 'Pasillo Frenos Estante B', '2025-02-14'),
('REP-0004', 'REP-0004', 'Batería Automotriz Duncan 800 Amp', 'DUN-800D', 'Eléctrico', 'Duncan Express Automotriz', 6, 2, 85.00, 'Estante Eléctrico Nivel 1', '2025-02-28')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trabajadores (id, nombre, especialidad, telefono, fecha_ingreso)
VALUES
('TRA-001', 'Wilmer Castellanos', 'Mecánica General', '0412-987-6543', '2025-01-01'),
('TRA-002', 'Marcos Gutiérrez', 'Sistemas Eléctricos', '0416-555-4433', '2025-02-15'),
('TRA-003', 'Jesús Mendoza', 'Alineación y Tren Delantero', '0414-111-2233', '2025-03-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ordenes (id, cliente_id, auto_id, fecha, descripcion, repuestos, observaciones, labor_cost, km_ingreso, estado, creado_en, trabajador_id)
VALUES
('ORD-S83A1', 'CLI-A1B2', 'VEH-AA11', '2025-05-10', 'Revisión técnica periódica de 110.000 KM y afinamiento mecánico integral. Reemplazo preventivo de fluidos e inspección general de sensores.', '[{"id": "REP-0001", "qty": 1, "precio": 12.5}, {"id": "REP-0002", "qty": 1, "precio": 45.0}]'::jsonb, 'El vehículo funciona estacionalmente bien. Se recomienda cambio de correas opcional en próximos 5.000 KM.', 65.00, 112500, 'terminada', '2025-05-10T10:30:00Z', 'TRA-001'),
('ORD-P49B8', 'CLI-C3D4', 'VEH-BB22', '2025-05-18', 'Mantenimiento preventivo del sistema de frenado delantero con rectificación de discos. Cambio de pastillas delanteras por desgaste severo.', '[{"id": "REP-0003", "qty": 1, "precio": 38.0}]'::jsonb, 'Los pistones del cáliper requieren lubricación adicional preventiva.', 50.00, 145210, 'en_proceso', '2025-05-18T14:15:00Z', 'TRA-003'),
('ORD-L12N3', 'CLI-E5F6', 'VEH-CC33', '2025-05-20', 'Diagnóstico eléctrico por falla en arranque a bajas temperaturas exteriores. Reemplazo de batería principal agotada por vida útil completada.', '[{"id": "REP-0004", "qty": 1, "precio": 85.0}]'::jsonb, 'Se verificó alternador y carga balanceada del circuito eléctrico con parámetros nominales estables.', 30.00, 210850, 'abierta', '2025-05-20T08:00:00Z', 'TRA-002')
ON CONFLICT (id) DO NOTHING;
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error al copiar el SQL:', err);
      });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-slate-900 rounded-none w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b-2 border-slate-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span className="font-mono font-black text-xs uppercase tracking-widest text-white">Consola SQL Supabase</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 rounded-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info panel */}
        <div className="p-4 bg-amber-50 border-b-2 border-slate-900 font-mono text-[10px] text-amber-900 uppercase tracking-wider flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black">¡Atención técnico/administrador!</p>
            <p className="normal-case text-slate-700 mt-1 font-sans">
              Para habilitar la persistencia en la nube de Supabase, debe copiar el script de abajo, entrar a su panel de Supabase client en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600">supabase.com</a>, abrir la pestaña <strong>SQL Editor</strong>, pegar el código y pulsar <strong>Run</strong>.
            </p>
          </div>
        </div>

        {/* Code panel body wrapper */}
        <div className="p-6 bg-slate-50 space-y-4">
          <div className="flex justify-between items-center bg-slate-900 py-1.5 px-3 border-t-2 border-x-2 border-slate-900 rounded-none text-white font-mono text-[10px] uppercase">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              schema_tables.sql
            </span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase px-2.5 py-1 transition-all border border-slate-800 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado' : 'Copiar Código'}
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[10px] h-[35vh] overflow-y-auto border-2 border-slate-900 select-all overflow-x-auto leading-relaxed scrollbar-thin">
            {sqlCode}
          </pre>
        </div>

        {/* Actions bar footer */}
        <div className="px-6 py-4 bg-slate-100 border-t-2 border-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-black border-2 border-slate-900 text-[10px] uppercase tracking-wider rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
          >
            Cerrar Ventana SQL
          </button>
        </div>

      </div>
    </div>
  );
}
