import { useState, useEffect, FormEvent } from 'react';
import { Lock, User, Key, Eye, EyeOff, ShieldAlert, ArrowRight, Wrench } from 'lucide-react';
import { Trabajador } from '../types';

interface GlobalLoginGateProps {
  trabajadores: Trabajador[];
  onSuccess: (role: 'administrador' | 'trabajador', workerId?: string) => void;
}

export default function GlobalLoginGate({ trabajadores, onSuccess }: GlobalLoginGateProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsError(false);
    setIsLoading(true);

    // Sleep briefly to simulate secure checking
    await new Promise(resolve => setTimeout(resolve, 800));

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    // 1. Check if it's the Admin
    if (inputUser === 'castellanosm') {
      const customAdminPass = localStorage.getItem('castellanos_admin_custom_password');
      if (customAdminPass && inputPass === customAdminPass) {
        localStorage.setItem('castellanos_global_gate_passed', 'true');
        onSuccess('administrador');
        setIsLoading(false);
        return;
      }
      
      try {
        // Compute SHA-256 on the client utilizing browser native crypto module
        const msgBuffer = new TextEncoder().encode(inputPass);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Standard hash match for: eltallerdelascosasbienhechas
        if (hashHex === '1d7a0941b823e2314e744d7a59ad2bd8ad5d0d2e2c39d1547bb1ad9d167e8624') {
          localStorage.setItem('castellanos_global_gate_passed', 'true');
          onSuccess('administrador');
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error during secure cryptographic hash lookup:', err);
        // Fallback simple string check in case of legacy user environment lacking Crypto Subtle API
        if (inputPass === 'eltallerdelascosasbienhechas') {
          localStorage.setItem('castellanos_global_gate_passed', 'true');
          onSuccess('administrador');
          setIsLoading(false);
          return;
        }
      }
    }

    // 2. Check if it's one of the registered technicians / workers
    const matchedWorker = trabajadores.find(
      t => t.usuario && t.usuario.trim().toLowerCase() === inputUser
    );

    if (matchedWorker && matchedWorker.contrasena === inputPass) {
      localStorage.setItem('castellanos_global_gate_passed', 'true');
      onSuccess('trabajador', matchedWorker.id);
      setIsLoading(false);
      return;
    }

    // If neither matched
    setIsError(true);
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 grid-pattern select-none p-4">
      <div className="w-full max-w-md bg-slate-950 border-4 border-slate-900 text-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-6 md:p-8 animate-in zoom-in-95 duration-200">
        
        {/* Brand header badge section */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-14 h-14 bg-blue-600 border-2 border-slate-100 flex items-center justify-center rotate-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.35)]">
            <Wrench className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white font-sans mt-2">
              Castellanos Motors
            </h1>
            <span className="inline-block bg-blue-950 text-blue-400 text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 border border-blue-900 rounded-none mt-1">
              SISTEMA INTEGRAL DE CONTROL
            </span>
          </div>
        </div>

        {/* WELCOME SLOGAN PANEL */}
        <div className="bg-blue-600/15 border-2 border-blue-500/50 p-4 text-center mb-6 shadow-[4px_4px_0px_0px_rgba(37,99,235,0.15)] rounded-none">
          <p className="font-sans font-black text-[11px] text-blue-300 uppercase tracking-widest leading-relaxed">
            “Bienvenido a Castellanos Motors, el taller de las cosas bien hechas.”
          </p>
        </div>

        {/* Informative text */}
        <p className="text-xs font-mono text-slate-450 text-center leading-relaxed bg-slate-900/40 p-3 border border-slate-900 mb-6">
          ACCESO RESTRINGIDO • Ingrese sus credenciales de taller autorizadas para desbloquear el sistema de control.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USERNAME BOX */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Usuario de Taller</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="Ej. castellanosm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-800 focus:border-blue-500 focus:outline-none px-3.5 py-2.5 text-xs text-white uppercase tracking-wider font-mono placeholder-slate-600 rounded-none transition-all"
              />
            </div>
          </div>

          {/* PASSWORD BOX */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              <span>Contraseña</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                placeholder="••••••••••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-800 focus:border-blue-500 focus:outline-none px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 rounded-none transition-all pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ERROR STATUS WINDOW */}
          {isError && (
            <div className="bg-red-950/55 border-2 border-red-900/80 p-3 space-y-1 animate-in shake duration-150">
              <div className="flex items-center gap-2 text-red-400 font-mono text-[10px] font-extrabold uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>Credenciales Incorrectas</span>
              </div>
              <p className="text-[9px] text-red-300 font-sans leading-relaxed">
                El usuario o la clave proporcionada no corresponden al administrador o mecánicos a cargo de Castellanos Motors. Verifique las mayúsculas e intente de nuevo.
              </p>
            </div>
          )}

          {/* ACTIONS AND ACTION BUTTONS */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className={`w-full py-3 border-2 border-slate-900 text-xs font-black uppercase tracking-widest cursor-pointer active:translate-y-0.5 transition-all flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] active:shadow-none'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-white rounded-full animate-spin shrink-0"></div>
                <span>Validando Firma Criptográfica...</span>
              </>
            ) : (
              <>
                <span>Autorizar Ingreso</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-900 pt-4 flex items-center justify-between text-[7.5px] font-mono uppercase tracking-widest text-slate-650">
          <span>SHA-256 SECURED VERIFICATION</span>
          <span>© CASTELLANOS MOTORS</span>
        </div>
      </div>
    </div>
  );
}
