"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { toast } from "@/components/ui/toast";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, status, isAuthenticated } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Jika sudah login (cookie valid, terverifikasi via /me), redirect ke dashboard
  useEffect(() => {
    if (status !== "checking" && isAuthenticated) {
      router.replace("/admin");
    }
  }, [status, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Login berhasil. Selamat datang kembali!");
      router.push("/admin");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login gagal. Coba lagi.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xl shadow-slate-200/60 space-y-7">
        {/* Header */}
        <div className="text-center space-y-3">
          <img
            src="/logo-icon.png"
            alt="RSU Tangsel"
            className="w-14 h-14 object-contain mx-auto"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              RSU Tangsel Care - Sistem Manajemen Internal
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="
                w-full h-11 px-4 rounded-lg text-sm
                bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400
                focus:outline-none focus:border-emerald-500 focus:bg-white
                transition-all
              "
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full h-11 px-4 pr-11 rounded-lg text-sm
                  bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400
                  focus:outline-none focus:border-emerald-500 focus:bg-white
                  transition-all
                "
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            id="admin-login-btn"
            className="
              w-full h-11 rounded-lg text-sm font-semibold text-white
              bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20
            "
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk ke Dashboard"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Hanya untuk staff resmi RSU Tangsel Care.{" "}
          <Link href="/" className="text-emerald-600 hover:underline">
            Kembali ke portal publik
          </Link>
        </p>
      </div>
    </div>
  );
}