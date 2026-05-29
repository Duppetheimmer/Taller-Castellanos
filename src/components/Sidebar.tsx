import { LayoutDashboard, Users, Car, Wrench, Package, Search, Lock, Unlock, Key, LogOut, Database, Terminal, X, UserX, User } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  onQuickSearchHistory: () => void;
  isAdmin: boolean;
  onTriggerAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onShowSqlModal: () => void;
  supabaseStatus: { connected: boolean; message: string; tablesOk: boolean };
  isOpen?: boolean;
  onClose?: () => void;
  userRole: 'administrador' | 'recepcionista' | 'trabajador';
  onChangeRole: (role: 'administrador' | 'recepcionista' | 'trabajador') => void;
  onGlobalLogout?: () => void;
}

export default function Sidebar({
  currentView,
  setView,
  onQuickSearchHistory,
  isAdmin,
  onTriggerAdminLogin,
  onLogoutAdmin,
  onShowSqlModal,
  supabaseStatus,
  isOpen = false,
  onClose,
  userRole,
  onChangeRole,
  onGlobalLogout
}: SidebarProps) {
  const handleSetView = (view: string) => {
    setView(view);
    if (onClose) onClose();
  };

  const handleQuickSearch = () => {
    onQuickSearchHistory();
    if (onClose) onClose();
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      onLogoutAdmin();
    } else {
      onTriggerAdminLogin();
    }
    if (onClose) onClose();
  };

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r-2 border-slate-950 flex flex-col flex-shrink-0 z-40 text-white selection:bg-slate-800 transform md:transform-none md:sticky md:top-0 h-screen transition-transform duration-200 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    }`}>
      {/* Brand Header */}
      <div className="p-4 border-b-2 border-slate-800 bg-slate-950 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-none bg-blue-600 flex items-center justify-center text-white font-black text-lg border border-white">
            ⚙️
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tighter uppercase leading-none">
              Castellanos
            </h1>
            <p className="text-[10px] font-black text-blue-400 tracking-wider uppercase mt-1">
              Motors <span className="text-[8px] text-slate-500">Pro</span>
            </p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="md:hidden p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-750 cursor-pointer"
          title="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Picker (3 Interfaces) */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 font-sans">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2.5 block mb-2 font-mono">
          Selección de Interfaz
        </span>
        <div className="grid grid-cols-1 gap-1.5 px-1.5">
          {/* Admin Role button */}
          <button
            onClick={() => {
              onChangeRole('administrador');
              if (onClose) onClose();
            }}
            className={`flex items-center justify-between p-2 rounded-none border text-left cursor-pointer transition-all ${
              userRole === 'administrador'
                ? 'bg-blue-950/45 border-blue-500 text-blue-300'
                : 'bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">👑</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Administrador</span>
            </div>
            <span className={`w-1.5 h-1.5 rounded-none ${userRole === 'administrador' ? 'bg-blue-400' : 'bg-transparent'}`}></span>
          </button>

          {/* Receptionist Role button */}
          <button
            onClick={() => {
              onChangeRole('recepcionista');
              if (onClose) onClose();
            }}
            className={`flex items-center justify-between p-2 rounded-none border text-left cursor-pointer transition-all ${
              userRole === 'recepcionista'
                ? 'bg-emerald-950/45 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">💼</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Recepcionista</span>
            </div>
            <span className={`w-1.5 h-1.5 rounded-none ${userRole === 'recepcionista' ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
          </button>

          {/* Worker Role button */}
          <button
            onClick={() => {
              onChangeRole('trabajador');
              if (onClose) onClose();
            }}
            className={`flex items-center justify-between p-2 rounded-none border text-left cursor-pointer transition-all ${
              userRole === 'trabajador'
                ? 'bg-amber-950/45 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs">🔧</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Mecánico/Técnico</span>
            </div>
            <span className={`w-1.5 h-1.5 rounded-none ${userRole === 'trabajador' ? 'bg-amber-400' : 'bg-transparent'}`}></span>
          </button>
        </div>
      </div>

      {/* Administrator Status Toggle Box - Only shows or is relevant to Admin interface */}
      {userRole === 'administrador' && (
        <div className="p-3 border-b border-slate-800 bg-slate-950/40">
          <div className={`p-2.5 border rounded-none transition-all ${
            isAdmin 
              ? 'bg-emerald-950/15 border-emerald-700/60 text-emerald-300' 
              : 'bg-slate-950 border-slate-850 text-slate-300'
          }`}>
            <div className="flex items-center justify-between mb-1.5 font-mono text-[9px] uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                {isAdmin ? (
                  <>
                    <Unlock className="w-3 h-3 text-emerald-400" />
                    <span className="font-extrabold text-emerald-400">Credencial: OK</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span className="font-bold text-slate-400">Credencial: Bloqueado</span>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-[8px] text-slate-400 leading-tight mb-2 uppercase select-none font-mono">
              {isAdmin 
                ? 'Permisos avanzados habilitados' 
                : 'Se requiere pase admin para modificar bodega y borrar datos'}
            </p>

            <button
              onClick={handleAdminToggle}
              className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border font-mono text-[8px] uppercase tracking-wider transition-all cursor-pointer ${
                isAdmin
                  ? 'bg-red-950/25 hover:bg-red-800/30 border-red-800 text-red-200 hover:text-white'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white'
              }`}
            >
              {isAdmin ? 'Salir de Admin' : 'Validar Pase Admin'}
            </button>
          </div>
        </div>
      )}

      {/* Quick Access Search Trigger Widget */}
      {userRole !== 'trabajador' && (
        <div className="px-3 py-3 border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={handleQuickSearch}
            className="w-full flex items-center gap-2 px-2.5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-left text-[10px] text-slate-300 hover:text-blue-400 hover:border-blue-500 transition-all font-mono group"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="truncate font-bold uppercase tracking-wide">Buscar Automóvil...</span>
          </button>
        </div>
      )}

      {/* Menu Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        
        {/* VIEW FILTER LOGIC */}
        
        {/* Core panel section (Only for Admin & Receptionist) */}
        {userRole !== 'trabajador' && (
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3.5 block mb-1.5 font-mono">
              Principal
            </span>
            <button
              onClick={() => handleSetView('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500 px-2'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
              Panel General
            </button>
          </div>
        )}

        {/* Inventory section (Only for Admin & Receptionist) */}
        {userRole !== 'trabajador' && (
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3.5 block mb-1.5 font-mono">
              Suministros
            </span>
            <button
              onClick={() => handleSetView('inventario')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all ${
                currentView === 'inventario'
                  ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500 px-2'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-blue-500" />
              Inventario & Almacén
            </button>
          </div>
        )}

        {/* Directory/Registers (Only for Admin & Receptionist) */}
        {userRole !== 'trabajador' && (
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3.5 block mb-1.5 font-mono">
              Registros
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => handleSetView('clientes')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all ${
                  currentView === 'clientes'
                    ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500 px-2'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Directorio Clientes
              </button>
              <button
                onClick={() => handleSetView('autos')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all ${
                  currentView === 'autos'
                    ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500 px-2'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-blue-500" />
                Automóviles & Placas
              </button>
            </div>
          </div>
        )}

        {/* Team config (Admin only) */}
        {userRole === 'administrador' && (
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3.5 block mb-1.5 font-mono">
              Personal
            </span>
            <button
              onClick={() => handleSetView('trabajadores')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all ${
                currentView === 'trabajadores'
                  ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500 px-2'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              Gestionar Técnicos
            </button>
          </div>
        )}

        {/* Tareas / Órdenes (Visible to all!) */}
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3.5 block mb-1.5 font-mono">
            Taller
          </span>
          <button
            onClick={() => handleSetView('ordenes')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all ${
              currentView === 'ordenes'
                ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500 px-2'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-blue-500" />
            {userRole === 'trabajador' ? 'Mis Tareas Asignadas' : 'Órdenes de Trabajo'}
          </button>
        </div>

      </nav>

      {/* Connection & Cloud Sync Visual Indicator */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex flex-col gap-1.5 font-mono text-[8px] uppercase tracking-wide">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-none flex-shrink-0 animate-pulse ${
            supabaseStatus.connected && supabaseStatus.tablesOk ? 'bg-green-500' :
            supabaseStatus.connected ? 'bg-amber-500' : 'bg-red-500'
          }`}></span>
          <div className="text-slate-400 leading-tight">
            <span className="font-extrabold block text-white text-[8px]">Nube de Supabase</span>
            <span className="text-[7.5px] text-slate-500 lowercase truncate max-w-[190px] block" title={supabaseStatus.message}>
              {supabaseStatus.message}
            </span>
          </div>
        </div>
      </div>

      {/* Footer System Version */}
      <div className="p-3 border-t border-slate-800 text-[9px] text-slate-400 flex flex-col gap-1 bg-slate-950 font-mono">
        <div className="flex items-center justify-between">
          <span className="uppercase font-bold">Autolog Pro v2.6</span>
          <span className="w-1.5 h-1.5 rounded-none bg-blue-400 animate-pulse"></span>
        </div>
        <span className="text-slate-650 uppercase text-[7px] mb-1">Base: Cloud SQL / Supabase</span>

        {onGlobalLogout && (
          <button
            onClick={onGlobalLogout}
            className="mt-1 w-full bg-slate-900 border border-slate-800 hover:bg-rose-950/30 hover:border-rose-900/60 text-slate-450 hover:text-rose-400 font-bold uppercase py-1.5 px-2 text-[8px] tracking-wider rounded-none flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            title="Bloquear el acceso global de esta terminal de trabajo"
          >
            <LogOut className="w-3 h-3" />
            <span>Bloquear Terminal</span>
          </button>
        )}
      </div>
    </aside>
  );
}

