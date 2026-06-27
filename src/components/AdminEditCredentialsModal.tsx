import { useState, FormEvent } from 'react';
import { Shield, Lock, X, Save, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';

interface AdminEditCredentialsModalProps {
  onClose: () => void;
  onSave: (password: string, pin: string) => void;
}

export default function AdminEditCredentialsModal({ onClose, onSave }: AdminEditCredentialsModalProps) {
  const currentSavedPass = localStorage.getItem('castellanos_admin_custom_password') || 'eltallerdelascosasbienhechas';
  const currentSavedPin = localStorage.getItem('castellanos_admin_custom_pin') || '159263777';

  const [password, setPassword] = useState(currentSavedPass);
  const [pin, setPin] = useState(currentSavedPin);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const inputPass = password.trim();
    const inputPin = pin.trim();

    if (!inputPass) {
      setError('Por favor, ingrese una contraseña de acceso válida.');
      return;
    }

    if (inputPass.length < 5) {
      setError('La contraseña de acceso general debe tener al menos 5 caracteres.');
      return;
    }

    if (!inputPin) {
      setError('Por favor, ingrese un PIN administrativo válido.');
      return;
    }

    if (!/^\d+$/.test(inputPin)) {
      setError('El PIN administrativo debe contener únicamente números.');
      return;
    }

    if (inputPin.length < 4) {
      setError('El PIN administrativo debe tener al menos 4 números.');
      return;
    }

    setIsLoading(true);
    // Secure artificial save feedback
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      onSave(inputPass, inputPin);
      setSuccess(true);
      setIsLoading(false);
      // Give the user a moment to see the success state
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setIsLoading(false);
      setError('Error al actualizar las credenciales de administración.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-slate-900 rounded-none w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b-2 border-slate-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-mono font-black text-xs uppercase tracking-widest text-white">Seguridad de Administrador</span>
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
            <h3 className="text-xs font-black text-slate-900 mt-2">Credenciales del Taller</h3>
            <p className="text-[9px] text-slate-500 font-bold leading-normal">
              Actualice la clave de acceso de la terminal y el PIN de autorización para acciones críticas de administración.
            </p>
          </div>

          <div className="space-y-4">
            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
                Nueva Clave General de Entrada (Usuario: castellanosm)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Clave de entrada"
                  className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-10 py-2 text-xs focus:bg-white focus:ring-0 focus:outline-none font-mono text-slate-800"
                  required
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

            {/* PIN Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 font-mono block">
                Nuevo PIN de Autorización (Solo Números)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  pattern="\d*"
                  maxLength={12}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 159263777"
                  className="w-full bg-white border-2 border-slate-900 rounded-none pl-9 pr-3 py-2 text-xs focus:bg-white focus:ring-0 focus:outline-none font-mono text-slate-800 tracking-wider font-bold"
                  required
                />
              </div>
              <p className="text-[8px] text-slate-400 font-mono italic">
                * Utilizado para validar el pase de administrador en operaciones críticas de bodega y eliminación.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-[10px] text-red-600 bg-red-50 border-2 border-red-500 p-2 font-mono text-center font-bold uppercase">
              ⚠️ {error}
            </p>
          )}

          {success && (
            <div className="text-[10px] text-emerald-800 bg-emerald-50 border-2 border-emerald-500 p-2 font-mono text-center font-bold uppercase flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              ¡Credenciales Actualizadas con Éxito!
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-800 font-mono font-black text-xs uppercase tracking-wider rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
              disabled={isLoading || success}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 cursor-pointer"
              disabled={isLoading || success}
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
