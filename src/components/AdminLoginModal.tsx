import { useState, FormEvent } from 'react';
import { Shield, Lock, X, Check, Key } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Helper function to hash a string to SHA-256 using native Web Crypto API with pure JS fallback
function sha256fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j; // Used as a loop index
  let result = '';

  const words: number[] = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let newAscii = ascii + '\x80';
  while (newAscii[lengthProperty] % 64 - 56) newAscii += '\x00';
  for (i = 0; i < newAscii[lengthProperty]; i++) {
    const charCode = newAscii.charCodeAt(i);
    if (charCode >> 8) return ''; // Only ASCII
    words[i >> 2] |= charCode << (24 - 8 * (i % 4));
  }
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength | 0);

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      const wItem = i < 16 ? w[i] : (
        w[i] = (
          (rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10)) +
          (w[i - 7] | 0) +
          (rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3)) +
          (w[i - 16] | 0)
        ) | 0
      );
      const temp1 = (
        (hash[7] | 0) +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) +
        k[i] +
        (wItem | 0)
      ) | 0;
      const temp2 = (
        (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
        ((hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]))
      ) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

async function hashSHA256(message: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    try {
      return sha256fallback(message);
    } catch (e) {
      if (message === '159263777') {
        return '02fb62581f0e9391bf9d5b9ec8724549b79a75778e2a3705147dfa53bdcfb289';
      }
      throw e;
    }
  }
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // If browser subtle digest fails inside strict secure context boundaries, use fallback
    return sha256fallback(message);
  }
}

export default function AdminLoginModal({ onClose, onSuccess }: AdminLoginModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanPass = passcode.trim();
    
    // Check custom PIN first
    const customAdminPin = localStorage.getItem('castellanos_admin_custom_pin');
    if (customAdminPin && cleanPass === customAdminPin) {
      onSuccess();
      return;
    }
    
    try {
      const hash = await hashSHA256(cleanPass);
      // Compare with SHA-256 hash of '159263777'
      if (hash === '02fb62581f0e9391bf9d5b9ec8724549b79a75778e2a3705147dfa53bdcfb289') {
        onSuccess();
      } else {
        setError('PIN o contraseña administrativa incorrecta.');
        setPasscode('');
      }
    } catch (err) {
      setError('Fallo de cifrado en navegador.');
      console.error(err);
    }
  };

  const appendKey = (num: string) => {
    setError('');
    setPasscode(p => p + num);
  };

  const handleClear = () => {
    setPasscode('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-slate-900 rounded-none w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b-2 border-slate-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-mono font-black text-xs uppercase tracking-widest text-white">Puerta Administrador</span>
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
            <h3 className="text-xs font-black text-slate-900 mt-2">PIN de Acceso Administrativo</h3>
            <p className="text-[9px] text-slate-500 font-bold leading-normal">
              Ingrese el PIN de seguridad asignado para acceder a las funciones administrativas del taller.
            </p>
          </div>

          {/* Code display screen */}
          <div className="space-y-1">
            <input
              type="password"
              placeholder="••••••••••••••"
              value={passcode}
              readOnly
              className="w-full bg-white border-2 border-slate-900 rounded-none py-3 text-center text-lg font-black tracking-widest text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          {error && (
            <p className="text-[10px] text-red-600 bg-red-50 border-2 border-red-500 p-2 font-mono text-center font-bold uppercase">
              ⚠️ {error}
            </p>
          )}

          {/* Quick numbers board */}
          <div className="grid grid-cols-3 gap-2 font-mono text-xs font-black">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => appendKey(num)}
                className="py-3.5 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 rounded-none transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3.5 bg-red-100 hover:bg-red-200 text-red-700 border-2 border-slate-900 rounded-none transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] uppercase cursor-pointer"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => appendKey('0')}
              className="py-3.5 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 rounded-none transition-all active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer col-span-2 text-center"
            >
              0
            </button>
          </div>

          {/* CTA Footer buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-800 font-mono font-black text-xs uppercase tracking-wider rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs uppercase tracking-wider rounded-none border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              Validar PIN
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
