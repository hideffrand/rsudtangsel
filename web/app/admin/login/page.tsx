"use client";

/**
 * Halaman Login Admin — RSU Tangsel Care
 * POST /api/admin/login → simpan JWT → redirect ke /admin
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAdmin, saveTokens, saveUser, isAuthenticated } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Jika sudah login, redirect ke dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await loginAdmin(username, password);
      saveTokens(data.access_token, data.refresh_token);
      saveUser(data.user);
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl space-y-7">
        {/* Header */}
        <div className="text-center space-y-3">
          <img
            src="/logo-icon.png"
            alt="RSU Tangsel"
            className="w-14 h-14 object-contain mx-auto"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              RSU Tangsel Care — Sistem Manajemen Internal
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                bg-white/8 border border-white/15 text-white placeholder-slate-500
                focus:outline-none focus:border-emerald-500 focus:bg-white/12
                transition-all
              "
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                  bg-white/8 border border-white/15 text-white placeholder-slate-500
                  focus:outline-none focus:border-emerald-500 focus:bg-white/12
                  transition-all
                "
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPass ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
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
              transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30
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
          <Link href="/" className="text-emerald-400 hover:underline">
            Kembali ke portal publik
          </Link>
        </p>
      </div>
    </div>
  );
}
