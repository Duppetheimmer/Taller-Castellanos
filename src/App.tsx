import { useState, useEffect } from 'react';
import { Menu, Bell, Check, ShoppingBag, Send } from 'lucide-react';
import { Cliente, Vehiculo, Repuesto, OrdenTrabajo, RepuestoUtilizado, Trabajador, SolicitudRepuesto, VentaIndividual } from './types';
import {
  INITIAL_CLIENTES,
  INITIAL_VEHICULOS,
  INITIAL_REPUESTOS,
  INITIAL_ORDENES,
  INITIAL_TRABAJADORES
} from './data/seedData';
import TrabajadoresView from './components/TrabajadoresView';
import VentasView from './components/VentasView';

// Subcomponents imports
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import VehiclesView from './components/VehiclesView';
import ClientsView from './components/ClientsView';
import InventoryView from './components/InventoryView';
import OrdersView from './components/OrdersView';
import InvoiceModal from './components/InvoiceModal';
import { ClienteModal, VehiculoModal, RepuestoModal, ReabastecerModal } from './components/FormModals';
import OrderFormModal from './components/OrderFormModal';

// Admin & Supabase Service imports
import AdminLoginModal from './components/AdminLoginModal';
import SupabaseSqlModal from './components/SupabaseSqlModal';
import GlobalLoginGate from './components/GlobalLoginGate';
import {
  getDbStatus,
  getClientesDB,
  upsertClienteDB,
  deleteClienteDB,
  getVehiculosDB,
  upsertVehiculoDB,
  deleteVehiculoDB,
  getRepuestosDB,
  upsertRepuestoDB,
  deleteRepuestoDB,
  getOrdenesDB,
  upsertOrdenDB,
  deleteOrdenDB,
  getTrabajadoresDB,
  upsertTrabajadorDB,
  deleteTrabajadorDB,
  getSolicitudesDB,
  upsertSolicitudDB,
  deleteSolicitudDB,
  getVentasDB,
  upsertVentaDB,
  deleteVentaDB,
  seedSupabaseCloud
} from './lib/supabase';

function playSubtleNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone (higher pitch, soft)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // Second chime tone (slightly staggered and higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(698.46, ctx.currentTime + 0.12); // F5
    gain2.gain.setValueAtTime(0.0, ctx.currentTime + 0.12);
    gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.warn('Web Audio API not supported or blocked by user preference:', err);
  }
}

export default function App() {
  // --- STATE ---
  const [currentView, setView] = useState<string>(() => {
    const cachedRole = localStorage.getItem('castellanos_userRole');
    return cachedRole === 'trabajador' ? 'ordenes' : 'dashboard';
  });
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [ventas, setVentas] = useState<VentaIndividual[]>([]);

  // --- ROLES & TECHNICAL PERSONAL WORKFLOW STATE ---
  const [userRole, setUserRole] = useState<'administrador' | 'recepcionista' | 'trabajador'>(() => {
    const role = localStorage.getItem('castellanos_userRole');
    const wasAdmin = localStorage.getItem('castellanos_isAdmin') === 'true';
    if (role === 'administrador' && !wasAdmin) {
      return 'recepcionista';
    }
    return (role as any) || 'recepcionista';
  });
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRepuesto[]>([]);
  const [activeWorkerId, setActiveWorkerId] = useState<string>(() => {
    return localStorage.getItem('castellanos_activeWorkerId') || 'TRA-001';
  });

  // --- GLOBAL SECURED GATE CONTEXT ---
  const [isGatePassed, setIsGatePassed] = useState<boolean>(() => {
    return localStorage.getItem('castellanos_global_gate_passed') === 'true';
  });

  const handleGlobalLogout = () => {
    if (confirm('¿Confirma que desea bloquear esta terminal corporativa y cerrar la sesión de Castellanos Motors?')) {
      localStorage.removeItem('castellanos_global_gate_passed');
      setIsGatePassed(false);
    }
  };

  // --- ADMIN STATE & ROLE GATES ---
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('castellanos_isAdmin') === 'true';
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // --- AUDIO NOTIFICATION PREFERENCE ---
  const [audioNotificationEnabled, setAudioNotificationEnabled] = useState<boolean>(() => {
    return localStorage.getItem('castellanos_audio_notify') !== 'false';
  });

  const handleToggleAudio = () => {
    const nextVal = !audioNotificationEnabled;
    setAudioNotificationEnabled(nextVal);
    localStorage.setItem('castellanos_audio_notify', String(nextVal));
    if (nextVal) {
      playSubtleNotificationSound();
    }
  };

  // Supabase tracker state
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; message: string; tablesOk: boolean }>({
    connected: false,
    message: 'Inicializando conexión...',
    tablesOk: false
  });

  // --- MODALS TOGGLES ---
  const [activeInvoice, setActiveInvoice] = useState<OrdenTrabajo | null>(null);
  
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClient, setEditClient] = useState<Cliente | null>(null);

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehiculo | null>(null);

  const [showPartForm, setShowPartForm] = useState(false);
  const [editPart, setEditPart] = useState<Repuesto | null>(null);

  const [showOrderForm, setShowOrderForm] = useState(false);

  const [reabastecerPart, setReabastecerPart] = useState<Repuesto | null>(null);

  // --- INTEGRATED SUPABASE & LOCAL STORAGE persistence ---
  useEffect(() => {
    async function initDataPersistence() {
      // 1. Establish the Supabase client connectivity and table structure status check
      let status = { connected: false, message: 'Inicializando conexión...', tablesOk: false };
      try {
        status = await getDbStatus();
        setSupabaseStatus(status);
      } catch (err) {
        console.error('Error al conectarse a Supabase:', err);
        setSupabaseStatus({ connected: false, message: 'La conexión de Supabase está offline o no configurada.', tablesOk: false });
      }

      // 2. High Speed Visual Startup: Load cache immediately from local storage fallback (default to blank slate)
      let localClientes: Cliente[] = [];
      let localVehiculos: Vehiculo[] = [];
      let localRepuestos: Repuesto[] = [];
      let localOrdenes: OrdenTrabajo[] = [];
      let localTrabajadores: Trabajador[] = [];
      let localSolicitudes: SolicitudRepuesto[] = [];
      let localVentas: VentaIndividual[] = [];

      try {
        const saved = localStorage.getItem('castellanos_motors_state_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          localClientes = parsed.clientes || [];
          localVehiculos = parsed.vehiculos || [];
          localRepuestos = parsed.repuestos || [];
          localOrdenes = parsed.ordenes || [];
          localTrabajadores = parsed.trabajadores || [];
          localSolicitudes = parsed.solicitudes || [];
          localVentas = parsed.ventas || [];
        }
      } catch (e) {
        console.error('Error al parsear el estado caché de localStorage:', e);
      }

      setClientes(localClientes);
      setVehiculos(localVehiculos);
      setRepuestos(localRepuestos);
      setOrdenes(localOrdenes);
      setTrabajadores(localTrabajadores);
      setSolicitudes(localSolicitudes);
      setVentas(localVentas);

      // 3. Dual sync: If Supabase has successful tables, retrieve and consolidate data directly from Cloud!
      if (status.connected && status.tablesOk) {
        try {
          const dbClientes = await getClientesDB();
          const dbVehiculos = await getVehiculosDB();
          const dbRepuestos = await getRepuestosDB();
          const dbOrdenes = await getOrdenesDB();
          
          let dbTrabajadores: Trabajador[] = [];
          let dbSolicitudes: SolicitudRepuesto[] = [];
          let dbVentas: VentaIndividual[] = [];
          
          try {
            dbTrabajadores = await getTrabajadoresDB();
          } catch (te) {
            console.warn('La tabla de trabajadores probablemente aún no ha sido creada o está vacía en Supabase.', te);
            dbTrabajadores = localTrabajadores;
          }
          
          try {
            dbSolicitudes = await getSolicitudesDB();
          } catch (se) {
            console.warn('La tabla de solicitudes probablemente aún no ha sido creada o está vacía en Supabase.', se);
            dbSolicitudes = localSolicitudes;
          }

          try {
            dbVentas = await getVentasDB();
          } catch (ve) {
            console.warn('La tabla de ventas_individuales probablemente aún no ha sido creada o está vacía en Supabase.', ve);
            dbVentas = localVentas;
          }

          setClientes(dbClientes);
          setVehiculos(dbVehiculos);
          setRepuestos(dbRepuestos);
          setOrdenes(dbOrdenes);
          setTrabajadores(dbTrabajadores);
          setSolicitudes(dbSolicitudes);
          setVentas(dbVentas);

          localStorage.setItem(
            'castellanos_motors_state_v1',
            JSON.stringify({
              clientes: dbClientes,
              vehiculos: dbVehiculos,
              repuestos: dbRepuestos,
              ordenes: dbOrdenes,
              trabajadores: dbTrabajadores,
              solicitudes: dbSolicitudes,
              ventas: dbVentas
            })
          );
        } catch (dbErr) {
          console.error('Excepción al cargar datos remotos desde Supabase:', dbErr);
          setSupabaseStatus(prev => ({
            ...prev,
            message: 'Error al sincronizar datos remotos. Usando caché local offline.'
          }));
        }
      }
    }

    initDataPersistence();
  }, []);

  // --- BACKGROUND POLLING SYNC FOR LIVE ALERTS ---
  useEffect(() => {
    if (!supabaseStatus.connected || !supabaseStatus.tablesOk) return;

    const interval = setInterval(async () => {
      try {
        const dbSolicitudes = await getSolicitudesDB();
        setSolicitudes(prev => {
          const prevPendStr = prev.filter(s => s.estado === 'pendiente').map(s => `${s.id}-${s.estado}`).sort().join(',');
          const nextPendStr = dbSolicitudes.filter(s => s.estado === 'pendiente').map(s => `${s.id}-${s.estado}`).sort().join(',');
          if (prevPendStr !== nextPendStr) {
            return dbSolicitudes;
          }
          return prev;
        });

        const dbOrdenes = await getOrdenesDB();
        setOrdenes(dbOrdenes);
      } catch (err) {
        console.warn('Silent background polling error:', err);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [supabaseStatus.connected, supabaseStatus.tablesOk]);

  // --- AUDIO CHIME TRIGGER ON NEW REQUESTS ---
  const [lastPendingCount, setLastPendingCount] = useState<number>(0);

  useEffect(() => {
    if (userRole === 'trabajador') return;
    
    const pendingList = solicitudes.filter(s => s.estado === 'pendiente');
    const currentCount = pendingList.length;

    if (currentCount > lastPendingCount) {
      if (audioNotificationEnabled) {
        playSubtleNotificationSound();
      }
    }
    setLastPendingCount(currentCount);
  }, [solicitudes, audioNotificationEnabled, userRole, lastPendingCount]);

  // --- PERIODIC REMINDER CHIME FOR OUTSTANDING PENDING REQUESTS ---
  useEffect(() => {
    if (userRole === 'trabajador') return;

    let reminderInterval: any = null;
    const pendingCount = solicitudes.filter(s => s.estado === 'pendiente').length;

    if (pendingCount > 0 && audioNotificationEnabled) {
      reminderInterval = setInterval(() => {
        playSubtleNotificationSound();
      }, 45000);
    }

    return () => {
      if (reminderInterval) clearInterval(reminderInterval);
    };
  }, [solicitudes, audioNotificationEnabled, userRole]);

  const saveStateToLocalStorage = (
    cList: Cliente[],
    vList: Vehiculo[],
    rList: Repuesto[],
    oList: OrdenTrabajo[],
    wList: Trabajador[] = trabajadores,
    sList: SolicitudRepuesto[] = solicitudes,
    vtList: VentaIndividual[] = ventas
  ) => {
    try {
      localStorage.setItem(
        'castellanos_motors_state_v1',
        JSON.stringify({
          clientes: cList,
          vehiculos: vList,
          repuestos: rList,
          ordenes: oList,
          trabajadores: wList,
          solicitudes: sList,
          ventas: vtList
        })
      );
    } catch (e) {
      console.error('Error saving persist state:', e);
    }
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('castellanos_isAdmin', 'true');
    setUserRole('administrador');
    localStorage.setItem('castellanos_userRole', 'administrador');
    setView('dashboard');
    setShowAdminLoginModal(false);
    alert('Acceso de Administrador concedido. Bienvenido.');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.setItem('castellanos_isAdmin', 'false');
    setUserRole('recepcionista');
    localStorage.setItem('castellanos_userRole', 'recepcionista');
    setView('dashboard');
    alert('Has cerrado sesión como Administrador. Se ha activado la interfaz de Recepcionista.');
  };

  // Helper ID generator
  const genCompactId = (prefix: string) => {
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    const r = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${ts}${r}`;
  };

  const getTodayISO = () => new Date().toISOString().split('T')[0];


  // --- HANDLERS ---
  
  // Clients CRUD
  const handleSaveClient = (data: Omit<Cliente, 'id' | 'fechaReg'>) => {
    let updated: Cliente[];
    let targetClient: Cliente;
    
    if (editClient) {
      targetClient = { ...editClient, ...data };
      updated = clientes.map(c => (c.id === editClient.id ? targetClient : c));
    } else {
      targetClient = {
        ...data,
        id: genCompactId('CLI'),
        fechaReg: getTodayISO()
      };
      updated = [...clientes, targetClient];
    }
    
    setClientes(updated);
    saveStateToLocalStorage(updated, vehiculos, repuestos, ordenes);
    
    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      upsertClienteDB(targetClient).catch(err => {
        console.error('Supabase client sync error:', err);
      });
    }

    setShowClientForm(false);
    setEditClient(null);
  };

  const handleDeleteClient = (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta ficha de cliente permanentemente? Se mantendrán los autos a menos que los remueva.')) return;
    const updated = clientes.filter(c => c.id !== id);
    setClientes(updated);
    saveStateToLocalStorage(updated, vehiculos, repuestos, ordenes);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      deleteClienteDB(id).catch(err => {
        console.error('Supabase client delete error:', err);
      });
    }
  };

  // Vehicles CRUD
  const handleSaveVehicle = (data: Omit<Vehiculo, 'id' | 'fechaReg'>) => {
    let updated: Vehiculo[];
    let targetVehicle: Vehiculo;

    if (editVehicle) {
      targetVehicle = { ...editVehicle, ...data };
      updated = vehiculos.map(v => (v.id === editVehicle.id ? targetVehicle : v));
    } else {
      targetVehicle = {
        ...data,
        id: genCompactId('VEH'),
        fechaReg: getTodayISO()
      };
      updated = [...vehiculos, targetVehicle];
      // Auto select the newly created vehicle
      setSelectedVehiculoId(targetVehicle.id);
    }

    setVehiculos(updated);
    saveStateToLocalStorage(clientes, updated, repuestos, ordenes);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      upsertVehiculoDB(targetVehicle).catch(err => {
        console.error('Supabase vehicle sync error:', err);
      });
    }

    setShowVehicleForm(false);
    setEditVehicle(null);
  };

  const handleDeleteVehicle = (id: string) => {
    if (!confirm('¿Seguro que desea eliminar el registro de este automóvil? El historial no se borrará pero quedará sin vehículo asociado.')) return;
    const updated = vehiculos.filter(v => v.id !== id);
    setVehiculos(updated);
    if (selectedVehiculoId === id) setSelectedVehiculoId(null);
    saveStateToLocalStorage(clientes, updated, repuestos, ordenes);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      deleteVehiculoDB(id).catch(err => {
        console.error('Supabase vehicle delete error:', err);
      });
    }
  };

  // Parts (Repuestos) CRUD
  const handleSaveRepuesto = (data: Omit<Repuesto, 'id' | 'codigo' | 'fechaIngreso'>) => {
    let updated: Repuesto[];
    let targetPart: Repuesto;

    if (editPart) {
      targetPart = { ...editPart, ...data };
      updated = repuestos.map(r => (r.id === editPart.id ? targetPart : r));
    } else {
      const numCode = String(repuestos.length + 1).padStart(4, '0');
      targetPart = {
        ...data,
        id: genCompactId('REP'),
        codigo: `REP-${numCode}`,
        fechaIngreso: getTodayISO()
      };
      updated = [...repuestos, targetPart];
    }

    setRepuestos(updated);
    saveStateToLocalStorage(clientes, vehiculos, updated, ordenes);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      upsertRepuestoDB(targetPart).catch(err => {
        console.error('Supabase part sync error:', err);
      });
    }

    setShowPartForm(false);
    setEditPart(null);
  };

  const handleConfirmReabastecer = (qtyToAdd: number, note: string) => {
    if (!reabastecerPart) return;
    let targetPart: Repuesto | null = null;
    
    const updated = repuestos.map(r => {
      if (r.id === reabastecerPart.id) {
        targetPart = {
          ...r,
          cantidad: r.cantidad + qtyToAdd,
          proveedor: note.trim() ? note.trim() : r.proveedor
        };
        return targetPart;
      }
      return r;
    });

    setRepuestos(updated);
    saveStateToLocalStorage(clientes, vehiculos, updated, ordenes);

    // Sync remotely with Supabase Cloud
    if (targetPart && supabaseStatus.connected && supabaseStatus.tablesOk) {
      upsertRepuestoDB(targetPart).catch(err => {
        console.error('Supabase item stock supply sync error:', err);
      });
    }

    setReabastecerPart(null);
  };

  const handleDeleteRepuesto = (id: string) => {
    if (!confirm('¿Eliminar este repuesto del catálogo de almacén? No podrá rebajarse automáticamente en futuras órdenes.')) return;
    const updated = repuestos.filter(r => r.id !== id);
    setRepuestos(updated);
    saveStateToLocalStorage(clientes, vehiculos, updated, ordenes);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      deleteRepuestoDB(id).catch(err => {
        console.error('Supabase part delete error:', err);
      });
    }
  };

  // Work Orders (Órdenes de Trabajo) CRUD
  const handleSaveOrden = (data: {
    clienteId: string;
    autoId: string;
    fecha: string;
    descripcion: string;
    repuestos: RepuestoUtilizado[];
    observaciones: string;
    laborCost: number;
    kmIngreso: number;
    estado: 'abierta' | 'en_proceso' | 'terminada';
    trabajadorId?: string;
  }) => {
    // 1. Create Order record
    const newOrder: OrdenTrabajo = {
      ...data,
      id: genCompactId('ORD'),
      creadoEn: new Date().toISOString()
    };

    const updatedOrders = [...ordenes, newOrder];

    // 2. Automatically deduct Stock levels in warehouses for any spare parts used
    let partsToUpdate: Repuesto[] = [];
    const updatedRepuestos = repuestos.map(r => {
      const matchedUsedPart = data.repuestos.find(p => p.id === r.id);
      if (matchedUsedPart) {
        const up = {
          ...r,
          cantidad: Math.max(0, r.cantidad - matchedUsedPart.qty)
        };
        partsToUpdate.push(up);
        return up;
      }
      return r;
    });

    // 3. Update Current Car Kilometer records of that vehicle with the check-in mileage
    let vehicleToUpdate: Vehiculo | null = null;
    const updatedVehicles = vehiculos.map(v => {
      if (v.id === data.autoId && data.kmIngreso > v.km) {
        vehicleToUpdate = {
          ...v,
          km: data.kmIngreso
        };
        return vehicleToUpdate;
      }
      return v;
    });

    setOrdenes(updatedOrders);
    setRepuestos(updatedRepuestos);
    setVehiculos(updatedVehicles);
    
    saveStateToLocalStorage(clientes, updatedVehicles, updatedRepuestos, updatedOrders);
    
    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      // Upsert the main order
      upsertOrdenDB(newOrder).catch(err => {
        console.error('Supabase save order sync error:', err);
      });
      // Upsert all modified parts stock quantities
      partsToUpdate.forEach(p => {
        upsertRepuestoDB(p).catch(err => console.error('Supabase inventory deduct sync error:', err));
      });
      // Upsert the vehicle mileage if updated
      if (vehicleToUpdate) {
        upsertVehiculoDB(vehicleToUpdate).catch(err => console.error('Supabase vehicle km update sync error:', err));
      }
    }

    setShowOrderForm(false);
    
    // Automatically open invoice ticket receipt of the newly created service order!
    setActiveInvoice(newOrder);
  };

  const handleAvanzarEstado = (id: string) => {
    const sequence: ('abierta' | 'en_proceso' | 'terminada')[] = ['abierta', 'en_proceso', 'terminada'];
    let targetOrder: OrdenTrabajo | null = null;

    const updated = ordenes.map(o => {
      if (o.id === id) {
        const nextIdx = (sequence.indexOf(o.estado) + 1) % sequence.length;
        targetOrder = {
          ...o,
          estado: sequence[nextIdx]
        };
        return targetOrder;
      }
      return o;
    });

    setOrdenes(updated);
    saveStateToLocalStorage(clientes, vehiculos, repuestos, updated);

    // Sync remotely with Supabase Cloud
    if (targetOrder && supabaseStatus.connected && supabaseStatus.tablesOk) {
      upsertOrdenDB(targetOrder).catch(err => {
        console.error('Supabase order advance status sync error:', err);
      });
    }
  };

  const handleDeleteOrden = (id: string) => {
    if (!confirm('¿Desea eliminar la orden de trabajo?')) return;
    const updated = ordenes.filter(o => o.id !== id);
    setOrdenes(updated);
    saveStateToLocalStorage(clientes, vehiculos, repuestos, updated);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      deleteOrdenDB(id).catch(err => {
        console.error('Supabase order delete sync error:', err);
      });
    }
  };

  const handleSaveVenta = (newSale: VentaIndividual) => {
    // 1. Update sales list
    const updatedSales = [newSale, ...ventas];
    setVentas(updatedSales);

    // 2. Decrement stock for sold parts
    const updatedRepuestos = repuestos.map(part => {
      const soldItem = newSale.items.find(i => i.repuestoId === part.id);
      if (soldItem) {
        return {
          ...part,
          cantidad: Math.max(0, part.cantidad - soldItem.cantidad)
        };
      }
      return part;
    });
    setRepuestos(updatedRepuestos);

    // 3. Save to Local Storage
    saveStateToLocalStorage(clientes, vehiculos, updatedRepuestos, ordenes, trabajadores, solicitudes, updatedSales);

    // 4. Sync to DB
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      // Upsert the sale
      upsertVentaDB(newSale).catch(err => {
        console.error('Supabase sale insert error:', err);
      });

      // Upsert any repuestos whose stock changed
      newSale.items.forEach(item => {
        const matchingPart = updatedRepuestos.find(r => r.id === item.repuestoId);
        if (matchingPart) {
          upsertRepuestoDB(matchingPart).catch(err => {
            console.error('Supabase parts stock decrement error:', err);
          });
        }
      });
    }
  };

  const handleDeleteVenta = (id: string) => {
    const updatedSales = ventas.filter(v => v.id !== id);
    setVentas(updatedSales);
    saveStateToLocalStorage(clientes, vehiculos, repuestos, ordenes, trabajadores, solicitudes, updatedSales);

    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      deleteVentaDB(id).catch(err => {
        console.error('Supabase sale delete error:', err);
      });
    }
  };

  const handleCancelAndRestockVenta = (id: string) => {
    const saleToCancel = ventas.find(v => v.id === id);
    if (!saleToCancel) return;

    // 1. Calculate restored stock for each repuesto in the sale
    const updatedRepuestos = repuestos.map(part => {
      const soldItem = saleToCancel.items.find(i => i.repuestoId === part.id);
      if (soldItem) {
        return {
          ...part,
          cantidad: part.cantidad + soldItem.cantidad
        };
      }
      return part;
    });
    setRepuestos(updatedRepuestos);

    // 2. Remove from sales list
    const updatedSales = ventas.filter(v => v.id !== id);
    setVentas(updatedSales);

    // 3. Save to Local Storage
    saveStateToLocalStorage(clientes, vehiculos, updatedRepuestos, ordenes, trabajadores, solicitudes, updatedSales);

    // 4. Sync to DB
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      // Delete the sale from the cloud
      deleteVentaDB(id).catch(err => {
        console.error('Supabase sale delete error:', err);
      });

      // Increment parts stock back in the cloud
      saleToCancel.items.forEach(item => {
        const matchingPart = updatedRepuestos.find(r => r.id === item.repuestoId);
        if (matchingPart) {
          upsertRepuestoDB(matchingPart).catch(err => {
            console.error('Supabase parts stock increment error:', err);
          });
        }
      });
    }
  };

  // Switch routing seamlessly into vehicle search lookup
  const triggerQuickSearchHistoryNavigation = () => {
    setView('autos');
  };

  // --- ROLES & NOTIFICATIONS EVENTS ---
  const handleChangeRole = (role: 'administrador' | 'recepcionista' | 'trabajador') => {
    if (role === 'administrador') {
      if (isAdmin) {
        setUserRole('administrador');
        localStorage.setItem('castellanos_userRole', 'administrador');
        setView('dashboard');
      } else {
        setShowAdminLoginModal(true);
      }
    } else {
      // Transitioning away from administrator turns off administrator powers
      setIsAdmin(false);
      localStorage.setItem('castellanos_isAdmin', 'false');
      
      setUserRole(role);
      localStorage.setItem('castellanos_userRole', role);
      if (role === 'trabajador') {
        setView('ordenes');
      } else {
        setView('dashboard');
      }
    }
  };

  const handleSaveTrabajador = (data: Omit<Trabajador, 'id' | 'fechaIngreso'>) => {
    // Generate simple compact ID
    const nextNum = trabajadores.length + 1;
    const padding = nextNum < 10 ? '00' : nextNum < 100 ? '0' : '';
    const newId = `TRA-${padding}${nextNum}`;
    
    // ISO Date formatted simple
    const dateToday = new Date().toISOString().split('T')[0];

    const newWorker: Trabajador = {
      ...data,
      id: newId,
      fechaIngreso: dateToday
    };

    const updated = [...trabajadores, newWorker];
    setTrabajadores(updated);
    saveStateToLocalStorage(clientes, vehiculos, repuestos, ordenes, updated, solicitudes);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      upsertTrabajadorDB(newWorker).catch(err => {
        console.error('Supabase worker sync error:', err);
      });
    }
  };

  const handleDeleteTrabajador = (id: string) => {
    if (!confirm('¿Está seguro de eliminar a este técnico del personal?')) return;
    const updated = trabajadores.filter(t => t.id !== id);
    setTrabajadores(updated);
    saveStateToLocalStorage(clientes, vehiculos, repuestos, ordenes, updated, solicitudes);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      deleteTrabajadorDB(id).catch(err => {
        console.error('Supabase worker delete error:', err);
      });
    }
  };

  const handleUpdateTrabajador = (id: string, data: Omit<Trabajador, 'id' | 'fechaIngreso'>) => {
    let targetWorker: Trabajador | null = null;
    const updated = trabajadores.map(t => {
      if (t.id === id) {
        targetWorker = {
          ...t,
          nombre: data.nombre,
          especialidad: data.especialidad,
          telefono: data.telefono
        };
        return targetWorker;
      }
      return t;
    });
    setTrabajadores(updated);
    saveStateToLocalStorage(clientes, vehiculos, repuestos, ordenes, updated, solicitudes);

    // Sync remotely with Supabase Cloud
    if (targetWorker && supabaseStatus.connected && supabaseStatus.tablesOk) {
      upsertTrabajadorDB(targetWorker).catch(err => {
        console.error('Supabase worker update error:', err);
      });
    }
  };

  const handleRequestRepuesto = (ordenId: string, repuestoId: string, cantidad: number) => {
    const targetOrder = ordenes.find(o => o.id === ordenId);
    const targetPart = repuestos.find(r => r.id === repuestoId);
    const targetWorker = trabajadores.find(t => t.id === activeWorkerId) || { nombre: 'Mecánico de Turno' };
    
    if (!targetOrder || !targetPart) return;

    const foundCar = vehiculos.find(v => v.id === targetOrder.autoId);
    const plaque = foundCar ? foundCar.placa : 'S/N';

    const newRequest: SolicitudRepuesto = {
      id: `SOL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      ordenId: targetOrder.id,
      ordenCodigo: targetOrder.id,
      autoPlaca: plaque,
      mecanicoNombre: targetWorker.nombre,
      repuestoNombre: targetPart.nombre,
      repuestoId: repuestoId,
      cantidad: cantidad,
      estado: 'pendiente',
      creadoEn: new Date().toISOString()
    };

    const updated = [newRequest, ...solicitudes];
    setSolicitudes(updated);
    saveStateToLocalStorage(clientes, vehiculos, repuestos, ordenes, trabajadores, updated);

    // Sync remotely with Supabase Cloud
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      upsertSolicitudDB(newRequest).catch(err => {
        console.error('Supabase parts request sync error:', err);
      });
    }
  };

  const handleEntregarRepuesto = (solicitudId: string) => {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    // Deduct stock if possible
    const targetPart = repuestos.find(p => p.id === solicitud.repuestoId);
    if (targetPart && targetPart.cantidad < solicitud.cantidad) {
      if (!confirm(`La estantería solo cuenta con ${targetPart.cantidad} unidad(es) de "${targetPart.nombre}", pero se solicitaron ${solicitud.cantidad}. ¿Desea despachar el saldo disponible de todas formas?`)) {
        return;
      }
    }

    // 1. Mark status as delivered
    const updatedSolicitudes = solicitudes.map(s => {
      if (s.id === solicitudId) {
        return { ...s, estado: 'entregado' as const };
      }
      return s;
    });

    // 2. Load into order's active list
    const updatedOrders = ordenes.map(ord => {
      if (ord.id === solicitud.ordenId) {
        const existingIdx = ord.repuestos.findIndex(p => p.id === solicitud.repuestoId);
        const copyList = [...ord.repuestos];
        const partPrice = targetPart ? targetPart.precio : 0;

        if (existingIdx > -1) {
          copyList[existingIdx] = {
            ...copyList[existingIdx],
            qty: copyList[existingIdx].qty + solicitud.cantidad
          };
        } else {
          copyList.push({
            id: solicitud.repuestoId,
            nombre: solicitud.repuestoNombre,
            qty: solicitud.cantidad,
            precio: partPrice
          });
        }
        return { ...ord, repuestos: copyList };
      }
      return ord;
    });

    // 3. Deduct real inventory counts
    const updatedParts = repuestos.map(part => {
      if (part.id === solicitud.repuestoId) {
        return { ...part, cantidad: Math.max(0, part.cantidad - solicitud.cantidad) };
      }
      return part;
    });

    setSolicitudes(updatedSolicitudes);
    setOrdenes(updatedOrders);
    setRepuestos(updatedParts);

    saveStateToLocalStorage(clientes, vehiculos, updatedParts, updatedOrders, trabajadores, updatedSolicitudes);

    // Sync cloud database
    if (supabaseStatus.connected && supabaseStatus.tablesOk) {
      const matchOrd = updatedOrders.find(o => o.id === solicitud.ordenId);
      if (matchOrd) upsertOrdenDB(matchOrd).catch(err => console.error(err));
      
      const matchPart = updatedParts.find(p => p.id === solicitud.repuestoId);
      if (matchPart) upsertRepuestoDB(matchPart).catch(err => console.error(err));

      const updatedS = updatedSolicitudes.find(s => s.id === solicitudId);
      if (updatedS) upsertSolicitudDB(updatedS).catch(err => console.error(err));
    }

    alert(`¡Repuesto "${solicitud.repuestoNombre}" entregado! Cargado a la orden ${solicitud.ordenId.substring(4)}.`);
  };


  if (!isGatePassed) {
    return <GlobalLoginGate onSuccess={() => setIsGatePassed(true)} />;
  }

  return (
    <div className="flex app h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 md:border-8 border-none border-slate-900 selection:bg-blue-200">
      
      {/* Mobile drawer backdrop overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-30 md:hidden transition-opacity duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        onQuickSearchHistory={triggerQuickSearchHistoryNavigation}
        isAdmin={isAdmin}
        onTriggerAdminLogin={() => setShowAdminLoginModal(true)}
        onLogoutAdmin={handleAdminLogout}
        onShowSqlModal={() => setShowSqlModal(true)}
        supabaseStatus={supabaseStatus}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        userRole={userRole}
        onChangeRole={handleChangeRole}
        onGlobalLogout={handleGlobalLogout}
      />

      {/* Main body content pane wrapper */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0 bg-slate-50 relative grid-pattern">

        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b-2 border-slate-950 z-20 shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 active:bg-slate-900 cursor-pointer flex items-center justify-center"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-black uppercase text-[11px] tracking-wide">Castellanos Motors</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase bg-slate-950 px-2.5 py-1 border border-slate-800">
            <span className={`w-2 h-2 rounded-none ${isAdmin ? 'bg-emerald-500' : 'bg-blue-400'}`}></span>
            <span>{isAdmin ? 'Admin' : 'Técnico'}</span>
          </div>
        </header>

        {/* ROLES HEADER DECORATIVE / WORKFLOW TRAY */}
        <div className="bg-slate-900 border-b border-slate-950 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 text-white select-none font-mono text-[10px] shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold border border-slate-750 uppercase text-[9px]">
                Interfaz Activa:
              </span>
              <span className="font-extrabold uppercase text-blue-400 tracking-wider flex items-center gap-1">
                {userRole === 'administrador' ? '👑 Administración General' : userRole === 'recepcionista' ? '💼 Recepción y Registro' : '🔧 Taller / Mecánico de Guardia'}
              </span>
            </div>

            {/* Audio reminder toggle button for Recepcionista/Administrador */}
            {userRole !== 'trabajador' && (
              <button
                onClick={handleToggleAudio}
                className={`px-2.5 py-1 border font-black uppercase text-[8.5px] cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all select-none rounded-none ${
                  audioNotificationEnabled
                    ? 'bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-400 border-emerald-900/80 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-450 border-slate-800'
                }`}
                title="Habilitar o Silenciar avisos auditivos recurrentes para solicitudes de repuesto pendientes"
              >
                <div className={`w-1.5 h-1.5 rounded-none ${audioNotificationEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                <span>{audioNotificationEnabled ? '🔔 Alerta Sonora Activa' : '🔕 Alerta Silenciada'}</span>
              </button>
            )}
          </div>

          {/* ACTIVE WORKER SELECTOR FOR MECANICO MODES */}
          {userRole === 'trabajador' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase font-bold text-[9px]">Operando como:</span>
              <select
                value={activeWorkerId}
                onChange={(e) => {
                  setActiveWorkerId(e.target.value);
                  localStorage.setItem('castellanos_activeWorkerId', e.target.value);
                }}
                className="bg-slate-950 text-white border border-slate-700 hover:border-blue-500 rounded-none px-2 py-1 text-[9px] focus:outline-none transition-all cursor-pointer font-bold uppercase"
              >
                {trabajadores.map(trab => (
                  <option key={trab.id} value={trab.id}>
                    {trab.nombre} ({trab.especialidad})
                  </option>
                ))}
                {trabajadores.length === 0 && (
                  <option value="TRA-001">Mecánico de Planta</option>
                )}
              </select>
            </div>
          )}

          {/* GENERAL CLOCK/ROSTER STATISTICS */}
          {userRole !== 'trabajador' && (
            <div className="flex items-center gap-2 text-slate-400 uppercase font-medium text-[9px]">
              <span>Técnicos Contratados:</span>
              <strong className="text-blue-400">{trabajadores.length} Registrados</strong>
            </div>
          )}
        </div>

        {/* NOTIFICACIONES EN TIEMPO REAL RECUPERACIÓN - Active spare part requirements */}
        {userRole !== 'trabajador' && solicitudes.filter(s => s.estado === 'pendiente').length > 0 && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 border-b-2 border-slate-950 flex flex-col gap-1.5 shrink-0 animate-in slide-in-from-top-3 duration-150 relative z-10 shadow-md">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
              <span className="font-black text-xs uppercase tracking-tight">
                🔔 Solicitudes de Repuestos Pendientes ({solicitudes.filter(s => s.estado === 'pendiente').length})
              </span>
              <span className="text-[8px] font-mono uppercase bg-slate-950 text-amber-400 px-1.5 py-0.2 font-bold select-none tracking-widest">
                Requiere Despacho
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-24 overflow-y-auto pt-1">
              {solicitudes.filter(s => s.estado === 'pendiente').map(sol => (
                <div key={sol.id} className="p-2 bg-slate-950 text-white flex items-center justify-between gap-3 select-none font-mono text-[9px] border border-slate-900 shadow-sm">
                  <div className="truncate pr-1">
                    <p className="font-bold text-slate-200">
                      🛠️ {sol.mecanicoNombre} solicita: <strong className="text-amber-400 font-black">{sol.cantidad} x {sol.repuestoNombre}</strong>
                    </p>
                    <p className="text-[7.5px] text-slate-400 uppercase mt-0.5">
                      Coche Placa: <strong className="text-white">{sol.autoPlaca}</strong> • UBICACIÓN: <span className="text-emerald-400 font-black uppercase">Estantería de Repuestos</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleEntregarRepuesto(sol.id)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9px] uppercase border-0 rounded-none tracking-wider cursor-pointer active:translate-y-0.5 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Check className="w-3 h-3" />
                    Entregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Render View matches dynamically */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'dashboard' && (
            <DashboardView
              clientes={clientes}
              vehiculos={vehiculos}
              repuestos={repuestos}
              ordenes={ordenes}
              setView={setView}
              setSelectedVehiculoId={setSelectedVehiculoId}
              onOpenNewOrder={() => setShowOrderForm(true)}
              onOpenNewVehicle={() => { setEditVehicle(null); setShowVehicleForm(true); }}
              onOpenNewClient={() => { setEditClient(null); setShowClientForm(true); }}
              onVerTicket={(id) => {
                const found = ordenes.find(o => o.id === id);
                if (found) setActiveInvoice(found);
              }}
            />
          )}

          {currentView === 'inventario' && (
            <InventoryView
              repuestos={repuestos}
              onAddRepuesto={() => { setEditPart(null); setShowPartForm(true); }}
              onEditRepuesto={(r) => { setEditPart(r); setShowPartForm(true); }}
              onDeleteRepuesto={handleDeleteRepuesto}
              onAddStockQty={(r) => setReabastecerPart(r)}
              isAdmin={isAdmin}
              onTriggerAdminLogin={() => setShowAdminLoginModal(true)}
            />
          )}

          {currentView === 'clientes' && (
            <ClientsView
              clientes={clientes}
              vehiculos={vehiculos}
              ordenes={ordenes}
              onAddClient={() => { setEditClient(null); setShowClientForm(true); }}
              onEditClient={(c) => { setEditClient(c); setShowClientForm(true); }}
              onDeleteClient={handleDeleteClient}
              onSelectVehicle={(vId) => setSelectedVehiculoId(vId)}
              setView={setView}
              isAdmin={isAdmin}
              onTriggerAdminLogin={() => setShowAdminLoginModal(true)}
            />
          )}

          {currentView === 'autos' && (
            <VehiclesView
              vehiculos={vehiculos}
              clientes={clientes}
              ordenes={ordenes}
              selectedId={selectedVehiculoId}
              setSelectedId={setSelectedVehiculoId}
              onAddVehicle={() => { setEditVehicle(null); setShowVehicleForm(true); }}
              onEditVehicle={(v) => { setEditVehicle(v); setShowVehicleForm(true); }}
              onDeleteVehicle={handleDeleteVehicle}
              onVerTicket={(id) => {
                const found = ordenes.find(o => o.id === id);
                if (found) setActiveInvoice(found);
              }}
              isAdmin={isAdmin}
              onTriggerAdminLogin={() => setShowAdminLoginModal(true)}
            />
          )}

          {currentView === 'ordenes' && (
            <OrdersView
              ordenes={ordenes}
              clientes={clientes}
              vehiculos={vehiculos}
              onAddOrden={() => setShowOrderForm(true)}
              onVerTicket={(id) => {
                const found = ordenes.find(o => o.id === id);
                if (found) setActiveInvoice(found);
              }}
              onAvanzarEstado={handleAvanzarEstado}
              onDeleteOrden={handleDeleteOrden}
              isAdmin={isAdmin}
              onTriggerAdminLogin={() => setShowAdminLoginModal(true)}
              userRole={userRole}
              trabajadores={trabajadores}
              solicitudes={solicitudes}
              activeWorkerId={activeWorkerId}
              onAcceptOrder={(orderId) => {
                const orderToAccept = ordenes.find(o => o.id === orderId);
                if (orderToAccept?.estado === 'terminada') {
                  alert('Esta orden ya se encuentra terminada/completada y no puede ser modificada o reasignada.');
                  return;
                }
                const updated = ordenes.map(o => {
                  if (o.id === orderId) {
                    return { ...o, trabajadorId: activeWorkerId, estado: 'en_proceso' as const };
                  }
                  return o;
                });
                setOrdenes(updated);
                saveStateToLocalStorage(clientes, vehiculos, repuestos, updated);
                // Sync cloud
                if (supabaseStatus.connected && supabaseStatus.tablesOk) {
                  const mOrd = updated.find(o => o.id === orderId);
                  if (mOrd) upsertOrdenDB(mOrd).catch(err => console.error(err));
                }
              }}
              onDiagnosticUpdate={(orderId, diag) => {
                const updated = ordenes.map(o => {
                  if (o.id === orderId) {
                    return { ...o, diagnostico: diag };
                  }
                  return o;
                });
                setOrdenes(updated);
                saveStateToLocalStorage(clientes, vehiculos, repuestos, updated);
                // Sync cloud
                if (supabaseStatus.connected && supabaseStatus.tablesOk) {
                  const mOrd = updated.find(o => o.id === orderId);
                  if (mOrd) upsertOrdenDB(mOrd).catch(err => console.error(err));
                }
              }}
              onRequestRepuesto={handleRequestRepuesto}
              repuestosInventario={repuestos}
              onChangeActiveWorkerId={(id) => {
                setActiveWorkerId(id);
                localStorage.setItem('castellanos_activeWorkerId', id);
              }}
            />
          )}

          {currentView === 'ventas' && userRole !== 'trabajador' && (
            <VentasView
              ventas={ventas}
              repuestos={repuestos}
              onAddVenta={handleSaveVenta}
              onDeleteVenta={handleDeleteVenta}
              onCancelAndRestockVenta={handleCancelAndRestockVenta}
              isAdmin={isAdmin}
              onTriggerAdminLogin={() => setShowAdminLoginModal(true)}
            />
          )}

          {currentView === 'trabajadores' && userRole === 'administrador' && (
            <TrabajadoresView
              trabajadores={trabajadores}
              ordenes={ordenes}
              vehiculos={vehiculos}
              onAddTrabajador={handleSaveTrabajador}
              onUpdateTrabajador={handleUpdateTrabajador}
              onDeleteTrabajador={handleDeleteTrabajador}
            />
          )}
        </div>

      </main>

      {/* --- OVERLAY MODALS --- */}

      {/* 1. Ticket print / Invoice overview */}
      {activeInvoice && (
        <InvoiceModal
          orden={activeInvoice}
          clients={clientes}
          vehicles={vehiculos}
          onClose={() => setActiveInvoice(null)}
        />
      )}

      {/* 2. Client registration form overlay */}
      {showClientForm && (
        <ClienteModal
          cliente={editClient}
          onSave={handleSaveClient}
          onClose={() => { setShowClientForm(false); setEditClient(null); }}
        />
      )}

      {/* 3. Vehicle registration form overlay */}
      {showVehicleForm && (
        <VehiculoModal
          vehiculo={editVehicle}
          clientes={clientes}
          onSave={handleSaveVehicle}
          onClose={() => { setShowVehicleForm(false); setEditVehicle(null); }}
        />
      )}

      {/* 4. Spare part (Repuesto) registration form overlay */}
      {showPartForm && (
        <RepuestoModal
          repuesto={editPart}
          onSave={handleSaveRepuesto}
          onClose={() => { setShowPartForm(false); setEditPart(null); }}
        />
      )}

      {/* 5. Spare part Stock addition modal overlay */}
      {reabastecerPart && (
        <ReabastecerModal
          repuesto={reabastecerPart}
          onConfirm={handleConfirmReabastecer}
          onClose={() => setReabastecerPart(null)}
        />
      )}

      {/* 6. Work Order registration form overlay */}
      {showOrderForm && (
        <OrderFormModal
          clientes={clientes}
          vehiculos={vehiculos}
          repuestos={repuestos}
          trabajadores={trabajadores}
          onSave={handleSaveOrden}
          onClose={() => setShowOrderForm(false)}
        />
      )}

      {/* 7. Administrator Passcode access gate overview */}
      {showAdminLoginModal && (
        <AdminLoginModal
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={handleAdminSuccess}
        />
      )}

      {/* 8. Supabase SQL installation script modal view */}
      {showSqlModal && (
        <SupabaseSqlModal
          onClose={() => setShowSqlModal(false)}
        />
      )}

    </div>
  );
}

