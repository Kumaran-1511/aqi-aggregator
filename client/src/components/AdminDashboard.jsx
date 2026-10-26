import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Activity,
  Layers,
  Flame,
  X,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Server
} from 'lucide-react';

export default function AdminDashboard({ isOpen, onClose, onRefreshStations }) {
  const { t } = useTranslation();
  const [token, setToken] = useState(localStorage.getItem('aqi_admin_token') || '');
  const [email, setEmail] = useState('admin@aqi.local');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState(null);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'stations' | 'reports' | 'logs'
  const [stats, setStats] = useState(null);
  const [stations, setStations] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // Form state for adding station
  const [newStation, setNewStation] = useState({
    stationId: '',
    name: '',
    state: 'Tamil Nadu',
    city: 'Chennai',
    lat: '',
    lng: '',
    source: 'CPCB',
    initialAqi: '65'
  });
  const [addMsg, setAddMsg] = useState(null);

  // Auth header config
  const authConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success && res.data.token) {
        if (res.data.user.role !== 'admin') {
          setLoginError('Account does not possess Administrator privileges.');
          return;
        }
        localStorage.setItem('aqi_admin_token', res.data.token);
        setToken(res.data.token);
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Invalid admin credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aqi_admin_token');
    setToken('');
  };

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, stationsRes, reportsRes, logsRes] = await Promise.all([
        axios.get('/api/admin/overview', authConfig),
        axios.get('/api/admin/stations', authConfig),
        axios.get('/api/admin/reports', authConfig),
        axios.get('/api/admin/logs', authConfig)
      ]);

      setStats(statsRes.data.data);
      setStations(stationsRes.data.data);
      setReports(reportsRes.data.data);
      setLogs(logsRes.data.data);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchAdminData();
    }
  }, [isOpen, token]);

  const handleTriggerIngestion = async () => {
    setTriggering(true);
    try {
      await axios.post('/api/admin/trigger-ingestion', {}, authConfig);
      await fetchAdminData();
      if (onRefreshStations) onRefreshStations();
    } catch (e) {
      console.error(e);
    } finally {
      setTriggering(false);
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    setAddMsg(null);
    try {
      const activeToken = token || localStorage.getItem('aqi_admin_token');
      const cfg = {
        headers: { Authorization: `Bearer ${activeToken}` }
      };
      const res = await axios.post('/api/admin/stations', newStation, cfg);
      if (res.data.success) {
        setAddMsg({ type: 'success', text: res.data.message || 'Station successfully registered and activated!' });
        setNewStation({
          stationId: '',
          name: '',
          state: 'Tamil Nadu',
          city: 'Chennai',
          lat: '',
          lng: '',
          source: 'CPCB',
          initialAqi: '65'
        });
        fetchAdminData();
        if (onRefreshStations) onRefreshStations();
      }
    } catch (err) {
      const errorText = err.response?.data?.error ||
        (err.response?.data?.errors && err.response?.data?.errors.map(e => e.msg).join(', ')) ||
        err.message ||
        'Failed to add station';
      setAddMsg({ type: 'error', text: errorText });
    }
  };

  const handleDeleteStation = async (id) => {
    if (!confirm('Are you sure you want to delete this monitoring station?')) return;
    try {
      await axios.delete(`/api/admin/stations/${id}`, authConfig);
      fetchAdminData();
      if (onRefreshStations) onRefreshStations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleModerateReport = async (id, status) => {
    try {
      await axios.patch(`/api/reports/${id}/status`, { status }, authConfig);
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      await axios.delete(`/api/reports/${id}`, authConfig);
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">{t('admin.title')}</h2>
              <p className="text-xs text-slate-400">Role-Based System Control, Moderation & Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!token ? (
          /* Login Screen */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-950/70 border border-slate-800 rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2 font-heading">Admin Sign In</h3>
              <p className="text-xs text-slate-400 mb-6">Default demo credentials pre-filled for direct review.</p>

              {loginError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-semibold">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/20 transition"
                >
                  Enter Admin Console
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nav Tabs */}
            <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
              <div className="flex gap-2">
                {[
                  { id: 'overview', label: t('admin.overview') },
                  { id: 'stations', label: `${t('admin.stations')} (${stations.length})` },
                  { id: 'reports', label: `${t('admin.reports')} (${reports.length})` },
                  { id: 'logs', label: t('admin.logs') }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleTriggerIngestion}
                disabled={triggering}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw size={13} className={triggering ? 'animate-spin' : ''} />
                <span>{triggering ? 'Polling...' : t('admin.triggerIngestion')}</span>
              </button>
            </div>

            {/* Tab Panes */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 block font-medium">Active Stations</span>
                      <span className="text-3xl font-extrabold text-white mt-1 block font-heading">{stats?.stationCount ?? '--'}</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 block font-medium">Recorded Readings</span>
                      <span className="text-3xl font-extrabold text-white mt-1 block font-heading">{stats?.readingCount ?? '--'}</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 block font-medium">Citizen Reports</span>
                      <span className="text-3xl font-extrabold text-white mt-1 block font-heading">{stats?.reportCount ?? '--'}</span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                      <span className="text-xs text-slate-400 block font-medium">Active User Alerts</span>
                      <span className="text-3xl font-extrabold text-white mt-1 block font-heading">{stats?.alertCount ?? '--'}</span>
                    </div>
                  </div>

                  {/* Recent Ingestion Activity */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Recent Ingestion Cycles</h3>
                    <div className="space-y-2">
                      {stats?.recentLogs?.slice(0, 5).map((l, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${l.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            <span className="font-semibold text-white uppercase">{l.source}</span>
                            <span className="text-slate-400">• {l.stationsPolled} stations polled</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                            <span>{l.durationMs}ms</span>
                            <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STATIONS MANAGEMENT */}
              {activeTab === 'stations' && (
                <div className="space-y-6">
                  {/* Add Station Form */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Plus size={14} className="text-cyan-400" />
                      Add New Monitoring Station
                    </h3>

                    {addMsg && (
                      <div className={`p-2.5 rounded-xl mb-3 text-xs font-semibold ${
                        addMsg.type === 'success' ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}>
                        {addMsg.text}
                      </div>
                    )}

                    {/* Quick Preset Buttons */}
                    <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400 font-semibold">Quick Presets:</span>
                      {[
                        { label: 'Alandur (Chennai)', id: 'che-alandur', name: 'Alandur Station', city: 'Chennai', state: 'Tamil Nadu', lat: '13.003', lng: '80.201' },
                        { label: 'Velachery (Chennai)', id: 'che-velachery', name: 'Velachery Station', city: 'Chennai', state: 'Tamil Nadu', lat: '12.981', lng: '80.218' },
                        { label: 'Tambaram (Chennai)', id: 'che-tambaram', name: 'Tambaram Station', city: 'Chennai', state: 'Tamil Nadu', lat: '12.924', lng: '80.127' },
                        { label: 'Gandhipuram (Coimbatore)', id: 'cbe-gandhipuram', name: 'Gandhipuram Station', city: 'Coimbatore', state: 'Tamil Nadu', lat: '11.018', lng: '76.972' },
                        { label: 'Goripalayam (Madurai)', id: 'mdu-goripalayam', name: 'Goripalayam Station', city: 'Madurai', state: 'Tamil Nadu', lat: '9.928', lng: '78.125' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewStation({
                            stationId: p.id,
                            name: p.name,
                            state: p.state,
                            city: p.city,
                            lat: p.lat,
                            lng: p.lng,
                            source: 'CPCB',
                            initialAqi: '65'
                          })}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-300 text-slate-300 border border-slate-700 transition"
                        >
                          + {p.label}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleAddStation} className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Unique Station ID *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. che-alandur"
                          value={newStation.stationId}
                          onChange={(e) => setNewStation({ ...newStation, stationId: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Station Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alandur Metro Station"
                          value={newStation.name}
                          onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">State *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tamil Nadu"
                          value={newStation.state}
                          onChange={(e) => setNewStation({ ...newStation, state: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Chennai"
                          value={newStation.city}
                          onChange={(e) => setNewStation({ ...newStation, city: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Latitude (DD) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="e.g. 13.003"
                          value={newStation.lat}
                          onChange={(e) => setNewStation({ ...newStation, lat: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Longitude (DD) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="e.g. 80.201"
                          value={newStation.lng}
                          onChange={(e) => setNewStation({ ...newStation, lng: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Source Network</label>
                        <select
                          value={newStation.source}
                          onChange={(e) => setNewStation({ ...newStation, source: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="CPCB">CPCB (India)</option>
                          <option value="TNPCB">TNPCB (Tamil Nadu)</option>
                          <option value="OpenAQ">OpenAQ</option>
                          <option value="WAQI">WAQI</option>
                          <option value="Manual">Manual Station</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white text-xs shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} />
                          <span>Register Station</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Stations Table */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-3">ID & Name</th>
                          <th className="p-3">City / Country</th>
                          <th className="p-3">Coordinates</th>
                          <th className="p-3">AQI</th>
                          <th className="p-3">Source</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {stations.map(st => (
                          <tr key={st._id} className="hover:bg-slate-900/50">
                            <td className="p-3">
                              <span className="font-bold text-white block">{st.name}</span>
                              <span className="text-[11px] text-slate-500">{st.stationId}</span>
                            </td>
                            <td className="p-3">{st.city}, {st.country}</td>
                            <td className="p-3 text-slate-400">
                              {st.location?.coordinates?.[1]?.toFixed(3)}, {st.location?.coordinates?.[0]?.toFixed(3)}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-white">{st.lastAqi}</span>
                              <span className="text-[10px] text-slate-400 block">{st.lastCategory}</span>
                            </td>
                            <td className="p-3 uppercase font-medium">{st.source}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteStation(st._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: CITIZEN REPORTS MODERATION */}
              {activeTab === 'reports' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Category & Severity</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Contributor</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500">No citizen reports recorded yet.</td>
                        </tr>
                      ) : (
                        reports.map(rep => (
                          <tr key={rep._id} className="hover:bg-slate-900/50">
                            <td className="p-3">
                              <span className="font-bold text-white capitalize block">{rep.category?.replace(/_/g, ' ')}</span>
                              <span className="text-[10px] text-amber-400 capitalize">{rep.severity} severity</span>
                            </td>
                            <td className="p-3 max-w-xs">{rep.description}</td>
                            <td className="p-3 text-slate-400">{rep.reportedBy}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                rep.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : rep.status === 'rejected'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {rep.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              {rep.status !== 'approved' && (
                                <button
                                  onClick={() => handleModerateReport(rep._id, 'approved')}
                                  title="Approve Report"
                                  className="p-1 rounded-lg text-emerald-400 hover:bg-slate-800"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              {rep.status !== 'rejected' && (
                                <button
                                  onClick={() => handleModerateReport(rep._id, 'rejected')}
                                  title="Reject Report"
                                  className="p-1 rounded-lg text-amber-400 hover:bg-slate-800"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReport(rep._id)}
                                title="Delete Report"
                                className="p-1 rounded-lg text-rose-400 hover:bg-slate-800"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: INGESTION LOGS */}
              {activeTab === 'logs' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Source</th>
                        <th className="p-3">Polled</th>
                        <th className="p-3">Stored</th>
                        <th className="p-3">Latency</th>
                        <th className="p-3">Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {logs.map((log, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.status === 'success' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-white">{log.source}</td>
                          <td className="p-3">{log.stationsPolled}</td>
                          <td className="p-3 font-semibold text-emerald-400">{log.readingsStored}</td>
                          <td className="p-3 text-slate-400">{log.durationMs}ms</td>
                          <td className="p-3 text-[11px] text-slate-400">{log.errorMessage || 'Clean cycle'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
