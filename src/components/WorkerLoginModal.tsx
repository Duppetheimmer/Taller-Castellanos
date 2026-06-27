import { useState, FormEvent } from 'react';
import { Wrench, Lock, User, X, Key, Eye, EyeOff } from 'lucide-react';
import { Trabajador } from '../types';

interface WorkerLoginModalProps {
  trabajadores: Trabajador[];
  onClose: () => void;
  onSuccess: (workerId: string) => void;
}

export default function WorkerLoginModal({ trabajadores, onClose, onSuccess }: WorkerLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setError('Por favor, ingrese usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    // Brief artificial delay for professional secure feel
    await new Promise(resolve => setTimeout(resolve, 600));

    const matchedWorker = trabajadores.find(
      t => t.usuario && t.usuario.trim().toLowerCase() === inputUser
    );

    if (matchedWorker && matchedWorker.contrasena === inputPass) {
      setIsLoading(false);
      onSuccess(matchedWorker.id);
    } else {
      setIsLoading(false);
      setError('Usuario o contraseña de técnico incorrecta.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-slate-900 rounded-none w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b-2 border-slate-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400 animate-bounce" />
            <span className="font-mono font-black text-xs uppercase tracking-widest text-white">Acceso de Mecánicos</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 rounded-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-50">
          
          <div className="text-center space-y-1.5 uppercase font-mono">
            <div className="w-12 h-12 bg-amber-100 border-2 border-slate-900 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6 text-slate-900" />
            </div>
            <h3 className="text-xs font-black text-slate-900 mt-2">Iniciar Sesión de Operario</h3>
            <p className="text-[9px] text-slate-500 font-bold leading-normal">
              Ingrese su usuario de técnico y clave asignada para consultar sus órdenes de trabajo asignadas.
            </p>
          </div>

          <div className="space-y-3">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block">Usuario de Técnico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ej: pedro123"
                  className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-3 py-2 text-xs focus:bg-white focus:ring-0 focus:outline-none font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Clave de acceso"
                  className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-10 py-2 text-xs focus:bg-white focus:ring-0 focus:outline-none font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-[10px] text-red-600 bg-red-50 border-2 border-red-500 p-2 font-mono text-center font-bold uppercase">
              ⚠️ {error}
            </p>
          )}

          {/* CTA Footer buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-800 font-mono font-black text-xs uppercase tracking-wider rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1 cursor-pointer"
              disabled={isLoading}
            >
              <Key className="w-4 h-4" />
              {isLoading ? 'Verificando...' : 'Entrar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
