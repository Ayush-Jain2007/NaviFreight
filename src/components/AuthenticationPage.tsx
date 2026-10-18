import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  LogOut, 
  Anchor, 
  Ship,
  Compass,
  Cpu,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthenticationPageProps {
  onNavigateTab?: (tab: string) => void;
  onClose?: () => void;
}

export const AuthenticationPage: React.FC<AuthenticationPageProps> = ({
  onNavigateTab,
  onClose
}) => {
  const { 
    currentUser, 
    loading, 
    error, 
    isConfigured, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    loginAsGuest, 
    logout,
    clearError 
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'demo'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [company, setCompany] = useState('Steel & Power Procurement');
  const [selectedRole, setSelectedRole] = useState('Logistics Planner');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReturnToDashboard = () => {
    if (onClose) {
      onClose();
    } else if (onNavigateTab) {
      onNavigateTab('overview');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);
    try {
      await loginWithEmail(email, password);
      setSuccessMsg('Successfully authenticated! Directing to command dashboard...');
      setTimeout(() => handleReturnToDashboard(), 900);
    } catch (err) {
      // Handled in context
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);
    try {
      await registerWithEmail(email, password, displayName, selectedRole, company);
      setSuccessMsg(`Welcome aboard, ${displayName || 'Planner'}! Account registered.`);
      setTimeout(() => handleReturnToDashboard(), 900);
    } catch (err) {
      // Handled in context
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setSuccessMsg(null);
    try {
      await loginWithGoogle();
      setSuccessMsg('Google authentication verified successfully.');
      setTimeout(() => handleReturnToDashboard(), 900);
    } catch (err) {
      // Handled in context
    }
  };

  const handleDemoLogin = async (roleName: string, deskName: string, userName: string) => {
    clearError();
    setSuccessMsg(null);
    try {
      await loginAsGuest(userName, roleName, deskName);
      setSuccessMsg(`Session established as ${roleName} (${userName}).`);
      setTimeout(() => handleReturnToDashboard(), 800);
    } catch (err) {
      // Handled in context
    }
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-[#061528] via-[#091e38] to-[#040e1b] text-slate-100 rounded-2xl p-4 sm:p-8 flex flex-col justify-center items-center relative overflow-hidden border border-slate-800 shadow-2xl">
      {/* Ambient background nautical glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Return Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-6 mb-6 border-b border-slate-700/60 z-10">
        <button
          onClick={handleReturnToDashboard}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Firebase SDK v13.0 Active</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>256-Bit SSL</span>
          </span>
        </div>
      </div>

      {/* Main Authentication Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 items-center">
        {/* Left Column: NaviFreight Identity & Security Overview */}
        <div className="lg:col-span-5 space-y-5 text-left">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-900/40 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide">
            <Anchor className="w-4 h-4 text-cyan-400" />
            <span>NAVI FREIGHT MARITIME OS</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Commercial Maritime Authentication Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Secure identity access for freight rate analytics, vessel chartering optimization, and emergency maritime recovery along India's coastal corridors.
            </p>
          </div>

          {/* Compliance & Feature Badges */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs font-bold text-white block">East & West Coast Port Authorization</strong>
                <p className="text-[11px] text-slate-400">Direct integration with 23 commercial port trust data layers and DG Shipping registries.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/70">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs font-bold text-white block">Role-Based Procurement Security</strong>
                <p className="text-[11px] text-slate-400">Role-gated laycan approvals, bunker hedging budgets, and casualty command coordination.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card / Active Session */}
        <div className="lg:col-span-7 bg-[#0b1c33]/90 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
          {/* If user is already authenticated */}
          {currentUser && !currentUser.isAnonymous ? (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/70">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-cyan-400">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      currentUser.displayName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <span>{currentUser.displayName || 'Authorized User'}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        AUTHENTICATED
                      </span>
                    </h3>
                    <div className="text-xs text-slate-400">{currentUser.email || 'Session active'}</div>
                  </div>
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 block">Assigned Role:</span>
                  <span className="font-bold text-slate-200">{currentUser.role}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Logistics Desk:</span>
                  <span className="font-bold text-cyan-400">{currentUser.desk}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Organization:</span>
                  <span className="font-bold text-slate-200">{currentUser.company}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">UID Hash:</span>
                  <span className="font-mono text-[10px] text-slate-400 truncate block">
                    {currentUser.uid.substring(0, 16)}...
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReturnToDashboard}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
                >
                  <span>Enter Logistics Command</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setSuccessMsg('Session terminated. You are in guest mode.');
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Auth Form for Sign-In, Sign-Up, and Quick Demo */
            <div className="space-y-5 text-left">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); clearError(); }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
                    authMode === 'signin' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); clearError(); }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
                    authMode === 'signup' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('demo'); clearError(); }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
                    authMode === 'demo' 
                      ? 'bg-cyan-700 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Quick Demo
                </button>
              </div>

              {/* Status Alert Banners */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* MODE 1: SIGN IN */}
              {authMode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Corporate Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="planner@steelpower.in"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">Access Key / Password</label>
                      <button
                        type="button"
                        onClick={() => alert('Password reset link sent if registered with corporate domain.')}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/40 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Authenticate & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="w-full border-t border-slate-800" />
                    <span className="absolute px-3 bg-[#0b1c33] text-[10px] font-mono text-slate-500 uppercase">
                      or federated sign in
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google Workspace</span>
                  </button>
                </form>
              )}

              {/* MODE 2: CREATE ACCOUNT */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Capt. Yashasvi"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Company / Entity</label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Steel & Power Corp"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Operational Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Logistics Planner">Logistics Planner (Freight & Port Allocations)</option>
                      <option value="Senior Vessel Charterer">Senior Vessel Charterer (Fixture Negotiator)</option>
                      <option value="Fleet Operations Master">Fleet Operations Master (Navigational Command)</option>
                      <option value="Port Authority Officer">Port Authority Officer (Berth Planning)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Corporate Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="captain@navifreight.io"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Create Password (min 6 chars)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Register Maritime Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* MODE 3: QUICK DEMO PROFILES */}
              {authMode === 'demo' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Instantly authenticate with pre-configured maritime enterprise credentials to inspect all dashboard modules:
                  </p>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('Logistics Planner', 'East Coast Desk Active', 'User')}
                      className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-left flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-white block group-hover:text-cyan-300 transition-colors">
                            Default Logistics Planner (User)
                          </strong>
                          <span className="text-[10px] text-slate-400">East Coast Desk Active • Steel & Power Procurement</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDemoLogin('Senior Vessel Charterer', 'Paradip & Dhamra Desk', 'Capt. R. Verma')}
                      className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-400 text-left flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-950 text-blue-300 border border-blue-500/40 flex items-center justify-center font-bold text-xs">
                          <Ship className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-white block group-hover:text-blue-300 transition-colors">
                            Senior Vessel Charterer (Capt. R. Verma)
                          </strong>
                          <span className="text-[10px] text-slate-400">Capesize & Panamax Fixtures • Deepwater Berths</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDemoLogin('Casualty & Safety Commander', 'MRCC Coordination Desk', 'Chief Officer Nair')}
                      className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-400 text-left flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-950 text-rose-300 border border-rose-500/40 flex items-center justify-center font-bold text-xs">
                          <Anchor className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-white block group-hover:text-rose-300 transition-colors">
                            Casualty & Safety Commander (Chief Officer Nair)
                          </strong>
                          <span className="text-[10px] text-slate-400">DG Shipping & Coast Guard MRCC Priority Dispatch</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
