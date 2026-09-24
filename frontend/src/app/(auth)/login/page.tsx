'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/utils/api';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Harap isi username dan password');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await loginUser(username, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Username atau password tidak valid.');
    }
  };

  const handleQuickDemoLogin = async (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword('mtm12345');
    setLoading(true);
    setError(null);

    const res = await loginUser(demoUsername, 'mtm12345');
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Gagal login dengan akun demo');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative font-sans"
      style={{
        backgroundImage: 'url(/images/mtm-factory.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]"></div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 my-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-7 sm:p-9 border border-white/40">
          {/* Card Header & Brand Logo */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img
                src="/images/logo-mtm.jpg"
                alt="Logo MTM"
                className="h-14 object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Warehouse Finished Goods
            </h1>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mt-0.5">
              PT. MENARA TERUS MAKMUR
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Sistem Manajemen Stok, Scanner Barcode & Monitoring Min/Max
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username / NPK
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Masukkan username atau NPK..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Ingat perangkat ini</span>
              </label>
              <span className="text-[11px] text-slate-400">WHFG Online v2.0</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memverifikasi Akun...
                </span>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Akses Cepat Akun Demo (Klik untuk Masuk):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ppic_user')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all hover:scale-[1.02]"
              >
                <span className="block text-xs font-bold text-blue-900">PPIC Officer</span>
                <span className="block text-[10px] text-blue-600">Kontrol Min/Max Stok</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('operator_wh')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition-all hover:scale-[1.02]"
              >
                <span className="block text-xs font-bold text-emerald-900">Operator WH</span>
                <span className="block text-[10px] text-emerald-600">Scanner IN / OUT</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('leader_wh')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition-all hover:scale-[1.02]"
              >
                <span className="block text-xs font-bold text-purple-900">Leader WH</span>
                <span className="block text-[10px] text-purple-600">Monitoring & Audit</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin_mtm')}
                className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-left transition-all hover:scale-[1.02]"
              >
                <span className="block text-xs font-bold text-amber-900">Administrator</span>
                <span className="block text-[10px] text-amber-600">Full System Control</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 space-y-1">
          <p className="text-xs text-white/80 font-medium drop-shadow-sm">
            &copy; 2026 PT Menara Terus Makmur &bull; Warehouse Finished Goods
          </p>
        </div>
      </div>
    </div>
  );
}
