import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Calendar,
  ChevronDown,
  User,
  Check,
  X,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  Compass,
  ShieldCheck,
  Ship,
  Clock,
  Sparkles,
  ExternalLink,
  Sliders,
  RotateCcw
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'warning' | 'market' | 'weather' | 'regulatory' | 'fleet';
  unread: boolean;
  targetTab?: string;
}

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  dateRangeText?: string;
  onDateRangeChange?: (range: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const DATE_PRESETS = [
  { label: 'Jan 2025 – Dec 2026', desc: 'Full 2-Year Planning Baseline' },
  { label: 'Q1 2026 (Jan – Mar)', desc: 'Immediate Spot Procurement' },
  { label: 'Q2 2026 (Apr – Jun)', desc: 'Pre-Monsoon Restocking Period' },
  { label: 'H1 2026 (Jan – Jun)', desc: 'First Half FY26 Fiscal Horizon' },
  { label: 'Full Year 2026', desc: 'Calendar Year 2026 Forecast' },
  { label: 'Trailing 12 Months', desc: 'Historical Comparison Baseline' },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Paradip Port Draft & Turnaround Advisory',
    message: 'Pre-monsoon maintenance scheduled at Berth 5-8. Average turnaround: 48.2 hrs. Panamax vessels recommended.',
    timestamp: '10m ago',
    type: 'warning',
    unread: true,
    targetTab: 'chartering',
  },
  {
    id: 'notif-2',
    title: 'Bunker Fuel (VLSFO Singapore) Update',
    message: 'Current benchmark $624.0/MT (+1.8%). Estimated voyage impact on Australia-India corridor: +$0.42/MT.',
    timestamp: '45m ago',
    type: 'market',
    unread: true,
    targetTab: 'forecast',
  },
  {
    id: 'notif-3',
    title: 'Bay of Bengal Weather Corridor Advisory',
    message: 'Monsoon wave swell in Andaman Sea. Capesize carriers advised to transit via Lombok Strait & Six Degree Channel.',
    timestamp: '2h ago',
    type: 'weather',
    unread: true,
    targetTab: 'forecast',
  },
  {
    id: 'notif-4',
    title: 'MoPSW FY26 Port Efficiency Norms',
    message: 'Ministry of Ports, Shipping and Waterways published FY26 dry bulk benchmarks. Paradip & Dhamra compliant.',
    timestamp: '5h ago',
    type: 'regulatory',
    unread: false,
    targetTab: 'reports',
  },
  {
    id: 'notif-5',
    title: 'AIS Fleet Telemetry: MV Blue Horizon',
    message: 'Laden Panamax 74,500 MT Iron Ore crossed Sunda Trench. On-schedule estimated arrival: 18 Mar 2026.',
    timestamp: '1d ago',
    type: 'fleet',
    unread: false,
    targetTab: 'overview',
  },
];

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  dateRangeText = 'Jan 2025 – Dec 2026',
  onDateRangeChange,
  onNavigateTab,
}) => {
  // Popover states
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Date selection state
  const [currentRange, setCurrentRange] = useState(dateRangeText);
  const [dateMode, setDateMode] = useState<'presets' | 'custom'>('presets');
  const [startMonth, setStartMonth] = useState('Jan');
  const [startYear, setStartYear] = useState('2025');
  const [endMonth, setEndMonth] = useState('Dec');
  const [endYear, setEndYear] = useState('2026');

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Refs for outside click handling
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Sync external prop if changed
  useEffect(() => {
    if (dateRangeText) setCurrentRange(dateRangeText);
  }, [dateRangeText]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(target)) {
        setIsDateOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDateOpen(false);
        setIsNotifOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectPreset = (preset: string) => {
    setCurrentRange(preset);
    onDateRangeChange?.(preset);
    setIsDateOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const custom = `${startMonth} ${startYear} – ${endMonth} ${endYear}`;
    setCurrentRange(custom);
    onDateRangeChange?.(custom);
    setIsDateOpen(false);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const handleDeleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    // Navigate if target tab exists
    if (item.targetTab && onNavigateTab) {
      onNavigateTab(item.targetTab);
      setIsNotifOpen(false);
    }
  };

  const handleSimulateNewAlert = () => {
    const newAlert: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'MoPSW Real-Time Alert: Dhamra Port Berth Clearance',
      message: 'Deep-water Capesize berth cleared at Dhamra. Loading operational throughput increased to 68,000 TPD.',
      timestamp: 'Just now',
      type: 'regulatory',
      unread: true,
      targetTab: 'overview',
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };

  const filteredNotifications =
    notifFilter === 'unread'
      ? notifications.filter((n) => n.unread)
      : notifications;

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'market':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'weather':
        return <Compass className="w-4 h-4 text-sky-600" />;
      case 'regulatory':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'fleet':
        return <Ship className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls (Date, Notifications, User) */}
      <div className="flex items-center gap-3 self-end sm:self-auto relative">
        {/* ========================================================================= */}
        {/* 1. DATE RANGE DROPDOWN SELECTOR */}
        {/* ========================================================================= */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsDateOpen(!isDateOpen);
              setIsNotifOpen(false);
              setIsUserMenuOpen(false);
            }}
            className={`bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-2xs ${
              isDateOpen ? 'ring-2 ring-blue-500/30 border-blue-500 bg-blue-50/30' : ''
            }`}
            title="Select Date Range Horizon"
            aria-expanded={isDateOpen}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-slate-900">{currentRange}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isDateOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>

          {/* Date Picker Popover Panel */}
          {isDateOpen && (
            <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Forecast & Planning Horizon
                  </span>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-0.5 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setDateMode('presets')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      dateMode === 'presets'
                        ? 'bg-white font-bold text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode('custom')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      dateMode === 'custom'
                        ? 'bg-white font-bold text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Mode A: Quick Presets */}
              {dateMode === 'presets' && (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {DATE_PRESETS.map((preset) => {
                    const isSelected = currentRange === preset.label;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectPreset(preset.label)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-bold shadow-2xs'
                            : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold flex items-center gap-2">
                            <span>{preset.label}</span>
                            {isSelected && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-normal mt-0.5">
                            {preset.desc}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mode B: Custom Month/Year Range */}
              {dateMode === 'custom' && (
                <form onSubmit={handleApplyCustom} className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Start */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                        Start Horizon
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={startMonth}
                          onChange={(e) => setStartMonth(e.target.value)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                            (m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            )
                          )}
                        </select>
                        <select
                          value={startYear}
                          onChange={(e) => setStartYear(e.target.value)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                          {['2024', '2025', '2026', '2027'].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* End */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                        End Horizon
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={endMonth}
                          onChange={(e) => setEndMonth(e.target.value)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                            (m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            )
                          )}
                        </select>
                        <select
                          value={endYear}
                          onChange={(e) => setEndYear(e.target.value)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs font-semibold text-slate-800 cursor-pointer"
                        >
                          {['2025', '2026', '2027', '2028'].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('Jan 2025 – Dec 2026')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to default</span>
                    </button>

                    <button
                      type="submit"
                      className="bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg px-4 py-2 text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Range</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. NOTIFICATIONS BELL & FLYOUT PANEL */}
        {/* ========================================================================= */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsDateOpen(false);
              setIsUserMenuOpen(false);
            }}
            className={`p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60 transition-all relative cursor-pointer ${
              isNotifOpen ? 'bg-blue-50 border-blue-300 text-blue-700' : ''
            }`}
            title="Operations & Market Alerts"
            aria-expanded={isNotifOpen}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white absolute top-1 right-1 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
              {/* Header */}
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-xs sm:text-sm">
                    Maritime Operations Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subheader Filter Tabs */}
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNotifFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                      notifFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('unread')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                      notifFilter === 'unread'
                        ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateNewAlert}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  title="Simulate incoming MoPSW alert"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Simulate Alert</span>
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <CheckCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">All caught up!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No {notifFilter === 'unread' ? 'unread' : ''} operations alerts at this moment.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3 text-left transition-colors cursor-pointer relative group flex items-start gap-3 ${
                        item.unread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        {getNotifIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`text-xs leading-snug line-clamp-1 ${
                              item.unread
                                ? 'font-bold text-slate-900'
                                : 'font-semibold text-slate-700'
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {item.timestamp}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                          {item.message}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {item.type}
                          </span>
                          {item.targetTab && (
                            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                              <span>Open in {item.targetTab}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions on hover / click */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                        {item.unread && (
                          <span
                            className="w-2 h-2 rounded-full bg-blue-600 shrink-0"
                            title="Unread"
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotif(item.id, e)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                          title="Dismiss alert"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>AIS Feeds & MoPSW Benchmarks Sync Active</span>
                </span>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNotifications([])}
                    className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. USER PROFILE PILL & DROPDOWN */}
        {/* ========================================================================= */}
        <div className="relative" ref={userDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsDateOpen(false);
              setIsNotifOpen(false);
            }}
            className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
            title="User Profile & Settings"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                <span>User</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">Logistics Planner</div>
            </div>
          </button>

          {/* User Profile Popover */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3.5 animate-fadeIn">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Logistics Planner</div>
                  <div className="text-[10px] text-slate-500">Steel & Power Procurement</div>
                  <span className="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                    East Coast Desk Active
                  </span>
                </div>
              </div>

              <div className="py-2 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between py-1 text-[11px]">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="font-mono text-slate-800 font-semibold">Node.js Native SQLite</span>
                </div>
                <div className="flex justify-between py-1 text-[11px]">
                  <span className="text-slate-400">AIS Satellite Feed:</span>
                  <span className="font-mono text-emerald-600 font-semibold">ONLINE</span>
                </div>
                <div className="flex justify-between py-1 text-[11px]">
                  <span className="text-slate-400">MoPSW Port Audits:</span>
                  <span className="font-mono text-blue-600 font-semibold">FY26 Target Active</span>
                </div>
              </div>

              {onNavigateTab && (
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('settings');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>System Settings & Feeds</span>
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

