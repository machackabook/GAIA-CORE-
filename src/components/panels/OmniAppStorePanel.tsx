/**
 * Omni AppStore & Google Account Co-Facts Hub
 * Aggregates all Signed-In-With-Google applications into an Omni AppStore floating index.
 * Provides searchable directory of authorized websites, single-click install/sign-up,
 * a tabbed HTML5 window browser manager on an HTMX 2.0 canvas, and native HTTPDFS mounting.
 */

import React, { useState, useMemo } from 'react';
import {
  Store,
  Globe,
  Search,
  Plus,
  Check,
  ExternalLink,
  ShieldCheck,
  FolderTree,
  FileCode,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  Play,
  Layers,
  Sparkles,
  Lock,
  Smartphone,
  Cpu,
  UserCheck,
  Zap,
} from 'lucide-react';
import { OmniWebApplet, HttpDfsFileNode, GoogleCoFactTelemetry } from '../../types';
import {
  getStoredWebApplets,
  saveStoredWebApplets,
  getActiveGoogleAccount,
  setActiveGoogleAccount,
  createNewWebAppletFromDomain,
  getGoogleCoFacts,
  getInitialHttpDfsTree,
} from '../../utils/omniAppStoreData';
import { audioEngine } from '../../utils/audioEngine';

interface OmniAppStorePanelProps {
  userLat: number;
  userLng: number;
  userAltitude: number;
  userPlusCode: string;
  friendsCount: number;
}

export const OmniAppStorePanel: React.FC<OmniAppStorePanelProps> = ({
  userLat,
  userLng,
  userAltitude,
  userPlusCode,
  friendsCount,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'appstore' | 'authorized_directory' | 'browser_canvas' | 'httpdfs'>('appstore');
  const [apps, setApps] = useState<OmniWebApplet[]>(getStoredWebApplets);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeAccount, setActiveAccount] = useState<string>(getActiveGoogleAccount);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');
  const [singleClickFeedback, setSingleClickFeedback] = useState<string | null>(null);

  // Tabbed browser windows state on HTMX 2.0 Canvas
  const [openBrowserTabs, setOpenBrowserTabs] = useState<OmniWebApplet[]>([
    apps.find((a) => a.id === 'app-garmin-connect') || apps[0],
    apps.find((a) => a.id === 'app-google-drive') || apps[1],
  ]);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState<string>(
    openBrowserTabs[0]?.id || 'app-garmin-connect'
  );

  // HTTPDFS virtual filesystem tree state
  const [httpdfsTree, setHttpdfsTree] = useState<HttpDfsFileNode[]>(getInitialHttpDfsTree);
  const [selectedFile, setSelectedFile] = useState<HttpDfsFileNode | null>(null);
  const [mountedPathInput, setMountedPathInput] = useState('');

  // Co-Facts real-time telemetry
  const coFacts: GoogleCoFactTelemetry = useMemo(
    () => getGoogleCoFacts(activeAccount, friendsCount, userLat, userLng),
    [activeAccount, friendsCount, userLat, userLng]
  );

  // Filtered webapplets for AppStore Floating Index
  const installedApplets = useMemo(() => {
    return apps.filter((a) => a.isInstalled);
  }, [apps]);

  // Filtered apps for Authorized Sign-In With Google Directory
  const directoryApps = useMemo(() => {
    return apps.filter((a) => {
      const matchSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [apps, searchQuery, selectedCategory]);

  const handleToggleInstall = (appId: string) => {
    const updated = apps.map((a) => {
      if (a.id === appId) {
        const nextState = !a.isInstalled;
        if (nextState) {
          audioEngine.playNote(78, 0.7);
        } else {
          audioEngine.playNote(52, 0.4);
        }
        return { ...a, isInstalled: nextState, lastAccessed: 'Just now' };
      }
      return a;
    });
    setApps(updated);
    saveStoredWebApplets(updated);
  };

  const handleSingleClickAdd = (app: OmniWebApplet) => {
    if (!app.isInstalled) {
      handleToggleInstall(app.id);
    }
    // Automatically launch into the browser window canvas
    handleLaunchInBrowser(app);
    setSingleClickFeedback(`Signed in with Google & added ${app.name} (${app.domain}) to Omni AppStore!`);
    audioEngine.playNote(84, 0.85);
    setTimeout(() => setSingleClickFeedback(null), 3500);
  };

  const handleCreateCustomDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomainInput.trim()) return;
    const newApp = createNewWebAppletFromDomain(customDomainInput.trim(), customNameInput.trim() || undefined);
    setApps(getStoredWebApplets());
    setCustomDomainInput('');
    setCustomNameInput('');
    handleLaunchInBrowser(newApp);
    setSingleClickFeedback(`Generated WebApplet logo for ${newApp.domain} & linked Google Auth!`);
    audioEngine.playNote(88, 0.9);
    setTimeout(() => setSingleClickFeedback(null), 3500);
  };

  const handleLaunchInBrowser = (app: OmniWebApplet) => {
    if (!openBrowserTabs.some((t) => t.id === app.id)) {
      setOpenBrowserTabs((prev) => [...prev, app]);
    }
    setActiveBrowserTabId(app.id);
    setActiveSubTab('browser_canvas');
    audioEngine.playNote(74, 0.6);
  };

  const handleCloseBrowserTab = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openBrowserTabs.filter((t) => t.id !== appId);
    setOpenBrowserTabs(remaining);
    if (activeBrowserTabId === appId && remaining.length > 0) {
      setActiveBrowserTabId(remaining[0].id);
    }
    audioEngine.playNote(58, 0.4);
  };

  const handleSwitchGoogleAccount = () => {
    const newEmail = activeAccount === 'machackabook@gmail.com' ? 'operator.mesh@google.internal' : 'machackabook@gmail.com';
    setActiveAccount(newEmail);
    setActiveGoogleAccount(newEmail);
    audioEngine.playNote(82, 0.8);
  };

  const handleMountHttpDfs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mountedPathInput.trim()) return;
    const cleanPath = mountedPathInput.trim().replace(/^\//, '');
    const parts = cleanPath.split('/');
    const nodeName = parts[parts.length - 1];

    const newNode: HttpDfsFileNode = {
      name: nodeName,
      path: `/${cleanPath}`,
      type: 'directory',
      lastModified: new Date().toISOString().replace('T', ' ').substring(0, 16),
      children: [
        {
          name: 'mount_manifest.json',
          path: `/${cleanPath}/mount_manifest.json`,
          type: 'file',
          sizeBytes: 4096,
          lastModified: 'Just now',
          contentSnippet: `{"mountPoint": "/${cleanPath}", "fsType": "httpdfs_v2", "status": "mounted_readwrite", "protocol": "tls1.3"}`,
        },
      ],
    };

    setHttpdfsTree((prev) => [...prev, newNode]);
    setMountedPathInput('');
    audioEngine.playNote(76, 0.7);
  };

  const activeAppForBrowser = openBrowserTabs.find((t) => t.id === activeBrowserTabId) || openBrowserTabs[0];

  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      {/* 1. Google Account Co-Facts Live Telemetry Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-3 rounded-xl border border-slate-700/80 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-emerald-500 to-amber-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-white text-base">
                G
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Google Sovereign Account</span>
              <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] px-2 py-0.2 rounded-full font-mono flex items-center gap-1">
                <Check className="w-2.5 h-2.5" />
                <span>Verified Identity</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono mt-0.5">
              Account: <span className="text-cyan-400 font-semibold">{activeAccount}</span> • Hash: <span className="text-slate-400">{coFacts.sessionTokenHash.substring(0, 16)}...</span>
            </div>
          </div>
        </div>

        {/* Co-Facts Data Metrics for Find My Hub & Garmin Peers */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-[10px] font-mono">
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <span className="text-slate-400 block text-[9px] uppercase">CO-FACTS LINKED</span>
            <span className="text-cyan-400 font-bold">{coFacts.coFactsCount} Data Points</span>
          </div>
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <span className="text-slate-400 block text-[9px] uppercase">FIND MY PEERS</span>
            <span className="text-emerald-400 font-bold">{friendsCount} Active Peers</span>
          </div>
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <span className="text-slate-400 block text-[9px] uppercase">GNSS RTK LOCK</span>
            <span className="text-amber-400 font-bold">28 Sats (Dual-Band)</span>
          </div>

          <button
            onClick={handleSwitchGoogleAccount}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[11px] shadow-sm ml-1 flex-shrink-0"
            title="Single-click switch active Google authorized identity"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>

      {singleClickFeedback && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{singleClickFeedback}</span>
        </div>
      )}

      {/* 2. Sub-navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('appstore')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'appstore' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-cyan-400" />
            <span>Omni AppStore ({installedApplets.length} Applets)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('authorized_directory')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'authorized_directory' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authorized Sign-In With Google Directory</span>
          </button>

          <button
            onClick={() => setActiveSubTab('browser_canvas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'browser_canvas' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>HTMX 2.0 Canvas Browser ({openBrowserTabs.length} Tabs)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('httpdfs')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'httpdfs' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>Native HTTPDFS Mount</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>OAuth 2.0 Certified Ecosystem</span>
        </div>
      </div>

      {/* 3. SUBTAB CONTENT */}

      {/* SUBTAB 1: OMNI APPSTORE FLOATING INDEX */}
      {activeSubTab === 'appstore' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">
              Floating Index: Signed-In-With-Google Verified Application WebApplets
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Click any applet to launch in-app on HTMX 2.0 Browser Canvas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto pr-1">
            {installedApplets.map((app) => (
              <div
                key={app.id}
                onClick={() => handleLaunchInBrowser(app)}
                className="group relative bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-500/60 p-3 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all shadow-md hover:shadow-cyan-500/10 hover:-translate-y-0.5"
              >
                {/* Resized WebApplet Icon Logo */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center p-2 mb-2 shadow-inner border border-white/10 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: app.iconBg }}
                >
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="w-full h-full object-contain filter drop-shadow"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${app.domain}&sz=64`;
                    }}
                  />
                </div>

                <span className="font-semibold text-white text-xs truncate w-full" title={app.name}>
                  {app.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate w-full mt-0.5">
                  {app.domain}
                </span>

                {/* HTTPDFS Mount badge */}
                <div className="mt-2 flex items-center gap-1 text-[9px] bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-700 font-mono text-cyan-400">
                  <HardDrive className="w-2.5 h-2.5" />
                  <span>HTTPDFS</span>
                </div>

                {/* Launch overlay on hover */}
                <div className="absolute inset-0 bg-cyan-950/70 backdrop-blur-[2px] rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                  <Play className="w-5 h-5 text-white fill-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Launch App</span>
                </div>
              </div>
            ))}

            {/* Quick add custom website card */}
            <div
              onClick={() => setActiveSubTab('authorized_directory')}
              className="bg-slate-900/40 hover:bg-slate-800/60 border border-dashed border-slate-700 hover:border-cyan-500/60 p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all text-slate-400 hover:text-cyan-300 min-h-[140px]"
            >
              <Plus className="w-6 h-6 mb-1 text-cyan-400" />
              <span className="font-medium text-xs">Add Website</span>
              <span className="text-[10px] text-slate-500 font-mono">Sign in with Google</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: AUTHORIZED SIGN-IN WITH GOOGLE DIRECTORY (SEARCHABLE) */}
      {activeSubTab === 'authorized_directory' && (
        <div className="space-y-3">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60">
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search authorized Google websites or domains..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
              {['ALL', 'productivity', 'geospatial', 'fitness', 'social', 'smarthome', 'media'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded text-[10px] font-medium uppercase whitespace-nowrap transition-colors ${
                    selectedCategory === cat ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Single-Click Website to WebApplet Form */}
          <form
            onSubmit={handleCreateCustomDomain}
            className="flex flex-col md:flex-row items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60"
          >
            <div className="flex-1 flex items-center gap-2 w-full">
              <span className="text-[11px] font-medium text-cyan-400 whitespace-nowrap">Single-Click Add:</span>
              <input
                type="text"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                placeholder="e.g. overpass-turbo.eu, linear.app, strava.com"
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <input
                type="text"
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                placeholder="App Title (Optional)"
                className="w-36 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-cyan-500 hidden sm:block"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 whitespace-nowrap shadow-sm"
            >
              <Zap className="w-3 h-3" />
              <span>Sign In &amp; Add Applet</span>
            </button>
          </form>

          {/* Searchable Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {directoryApps.map((app) => (
              <div
                key={app.id}
                className="bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 p-2.5 rounded-xl flex items-start gap-3 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center p-1.5 shadow"
                  style={{ backgroundColor: app.iconBg }}
                >
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${app.domain}&sz=64`;
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-white truncate text-xs">{app.name}</span>
                    <span className="text-[9px] bg-slate-900 text-cyan-400 px-1.5 py-0.2 rounded border border-slate-700 font-mono">
                      {app.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">{app.domain}</span>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-snug">
                    {app.description}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/50">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Google OAuth 2.0</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSingleClickAdd(app)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                          app.isInstalled
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        {app.isInstalled ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
                        <span>{app.isInstalled ? 'Launch App' : 'Add Applet'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: HTMX 2.0 CANVAS & TABBED HTML5 BROWSER WINDOWS */}
      {activeSubTab === 'browser_canvas' && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* HTMX 2.0 Canvas Chrome Header & Tab Bar */}
          <div className="bg-slate-950 px-2 py-1.5 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
              {openBrowserTabs.map((tab) => {
                const isActive = tab.id === activeBrowserTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveBrowserTabId(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-t-lg text-xs font-medium cursor-pointer border-t-2 transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white border-cyan-500 shadow'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ backgroundColor: tab.iconBg }}>
                      <img src={tab.iconUrl} alt="" className="w-2.5 h-2.5 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <span className="truncate max-w-[110px]">{tab.name}</span>
                    <button
                      onClick={(e) => handleCloseBrowserTab(tab.id, e)}
                      className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => setActiveSubTab('authorized_directory')}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 ml-1"
                title="Open new app from directory"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
              <span className="bg-slate-800/80 px-2 py-0.5 rounded text-cyan-400">HTMX 2.0 Virtual Canvas Engine</span>
            </div>
          </div>

          {/* Browser Address Bar */}
          {activeAppForBrowser && (
            <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={() => audioEngine.playNote(60, 0.4)}
                  className="p-1 rounded hover:bg-slate-800 hover:text-white"
                  title="Reload webapplet"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* URL bar */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex items-center gap-2 text-[11px] font-mono">
                <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-400">https://</span>
                <span className="text-white font-medium">{activeAppForBrowser.domain}</span>
                <span className="text-slate-500">/auth/google/callback?token={coFacts.sessionTokenHash.substring(0, 8)}</span>
              </div>

              {/* Mount indicator */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded text-[10px] font-mono text-cyan-400">
                <HardDrive className="w-3 h-3" />
                <span>{activeAppForBrowser.httpdfsMountedPath}</span>
              </div>

              <a
                href={activeAppForBrowser.appUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-white"
                title="Open in external tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Browser Sandboxed Window Body */}
          {activeAppForBrowser ? (
            <div className="relative h-64 bg-slate-950 p-4 flex flex-col justify-between overflow-hidden">
              <div className="space-y-3 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl p-2 flex items-center justify-center shadow" style={{ backgroundColor: activeAppForBrowser.iconBg }}>
                      <img src={activeAppForBrowser.iconUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{activeAppForBrowser.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">Google OAuth Bearer Active • Session ID: {activeAccount}</p>
                    </div>
                  </div>

                  <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
                    Sandboxed HTML5 WebApplet
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  {activeAppForBrowser.description}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">SCOPES AUTHORIZED</span>
                    <span className="text-cyan-300 font-semibold">{activeAppForBrowser.scopes.join(', ')}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">HTTPDFS MOUNT STATUS</span>
                    <span className="text-emerald-400 font-semibold">Mounted &amp; Active</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">GEODETIC ANCHOR</span>
                    <span className="text-amber-400 font-semibold">{userLat.toFixed(3)}°, {userLng.toFixed(3)}°</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">PLUS CODE ANCHOR</span>
                    <span className="text-cyan-400 font-semibold">{userPlusCode}</span>
                  </div>
                </div>
              </div>

              {/* Bottom WebApplet Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      audioEngine.playNote(82, 0.7);
                      alert(`Synchronized telemetry between ${activeAppForBrowser.name} and Find My Hub!`);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Co-Facts with Applet</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('httpdfs')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 border border-slate-700"
                  >
                    <FolderTree className="w-3 h-3 text-amber-400" />
                    <span>Inspect Mounted HTTPDFS Files</span>
                  </button>
                </div>

                <span className="text-[10px] text-slate-500 font-mono">HTMX Canvas Protocol: v2.0-SOVEREIGN</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 italic">No webapplets currently open in browser tabs.</div>
          )}
        </div>
      )}

      {/* SUBTAB 4: NATIVE HTTPDFS FILE ACCESS MOUNTING */}
      {activeSubTab === 'httpdfs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Left: Filesystem Tree */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">HTTPDFS File System Tree</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Mounted: /mnt/httpdfs</span>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-700 font-mono text-[11px] max-h-52 overflow-y-auto space-y-1">
                <div className="text-cyan-400 font-semibold">📁 /mnt/httpdfs/</div>
                {httpdfsTree[0]?.children?.[0]?.children?.map((dir) => (
                  <div key={dir.path} className="ml-3">
                    <div className="text-amber-300 flex items-center gap-1">
                      <span>📁 {dir.name}/</span>
                    </div>
                    {dir.children?.map((file) => (
                      <div
                        key={file.path}
                        onClick={() => {
                          setSelectedFile(file);
                          audioEngine.playNote(68, 0.4);
                        }}
                        className={`ml-3 cursor-pointer py-0.5 px-1 rounded flex items-center justify-between transition-colors ${
                          selectedFile?.path === file.path ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">📄 {file.name}</span>
                        <span className="text-[9px] text-slate-400">{(file.sizeBytes! / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Mount custom directory form */}
            <form onSubmit={handleMountHttpDfs} className="space-y-1.5 pt-2 border-t border-slate-700/60">
              <label className="text-[10px] text-slate-400 block font-mono">Mount New HTTPDFS Target:</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={mountedPathInput}
                  onChange={(e) => setMountedPathInput(e.target.value)}
                  placeholder="/mnt/httpdfs/field_recon"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded text-xs font-medium"
                >
                  Mount
                </button>
              </div>
            </form>
          </div>

          {/* Right: Selected File Inspector & HTTPDFS Content Viewer */}
          <div className="md:col-span-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">HTTPDFS File Inspector</span>
                {selectedFile && (
                  <span className="text-[10px] font-mono text-cyan-400">
                    {selectedFile.path} • {selectedFile.lastModified}
                  </span>
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-emerald-300 min-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {selectedFile.contentSnippet || '[EMPTY_FILE_CONTENT]'}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>MIME: application/octet-stream</span>
                    <span>Size: {selectedFile.sizeBytes} bytes</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 italic">
                  Select a file from `/mnt/httpdfs/` on the left to inspect raw binary or structured telemetry logs.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <button
                onClick={() => {
                  if (selectedFile) {
                    const blob = new Blob([selectedFile.contentSnippet || ''], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = selectedFile.name;
                    a.click();
                    URL.revokeObjectURL(url);
                    audioEngine.playNote(82, 0.7);
                  }
                }}
                disabled={!selectedFile}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export File to Local Disk</span>
              </button>

              <span className="text-[10px] text-slate-500 font-mono">
                Native File System Access API: Enabled (Read/Write)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
