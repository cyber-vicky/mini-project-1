import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import MunicipalSidebar from '../components/MunicipalSidebar';
import MunicipalTopNav from '../components/MunicipalTopNav';
import { AuthContext } from '../context/AuthContext';
import { Map, MapPin, Search, X, Layers, AlertCircle, ArrowRight } from 'lucide-react';

// Exact Theme Palette for Priorities and Statuses
const PRIORITY_THEME = {
  CRITICAL: {
    color: '#E45757',
    border: '#A82828',
    bg: 'badge-priority-critical',
    icon: '!',
  },
  HIGH: {
    color: '#FF8A3D',
    border: '#C95F1A',
    bg: 'badge-priority-high',
    icon: '▲',
  },
  MEDIUM: {
    color: '#F4B740',
    border: '#A97510',
    bg: 'badge-priority-medium',
    icon: '●',
  },
  LOW: {
    color: '#4C8DFF',
    border: '#2762C9',
    bg: 'badge-priority-low',
    icon: '▼',
  },
};

const STATUS_THEME = {
  SUBMITTED: { label: 'Submitted', color: '#F4B740', badge: 'badge-submitted' },
  ACKNOWLEDGED: { label: 'Acknowledged', color: '#4C8DFF', badge: 'badge-acknowledged' },
  ASSIGNED: { label: 'Assigned', color: '#292D32', badge: 'badge-assigned' },
  IN_PROGRESS: { label: 'In Progress', color: '#FF8A3D', badge: 'badge-in-progress' },
  RESOLVED: { label: 'Resolved', color: '#20A779', badge: 'badge-resolved' },
  CLOSED: { label: 'Closed', color: '#747982', badge: 'badge-closed' },
  REOPENED: { label: 'Reopened', color: '#E45757', badge: 'badge-reopened' },
  VERIFIED: { label: 'Verified', color: '#20A779', badge: 'badge-verified' },
};

// Create custom SVG Leaflet pin icons
const createCustomMarkerIcon = (priority, isSelected = false) => {
  const theme = PRIORITY_THEME[priority] || PRIORITY_THEME.MEDIUM;
  const pinColor = theme.color;
  const borderColor = isSelected ? '#FFFFFF' : '#17191C';
  const size = isSelected ? 42 : 34;
  const pulseHtml = (priority === 'CRITICAL' || isSelected)
    ? `<div style="position:absolute; top:-5px; left:-5px; width:${size + 10}px; height:${size + 10}px; border-radius:50%; background:${pinColor}; opacity:0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
    : '';

  const html = `
    <div style="position:relative; width:${size}px; height:${size}px; display:flex; align-items:center; justify-content:center; filter: drop-shadow(0 3px 6px rgba(23,25,28,0.4));">
      ${pulseHtml}
      <svg viewBox="0 0 36 48" width="${size}" height="${size * 1.33}" style="display:block;">
        <path d="M18 0 C8 0 0 8 0 18 C0 31.5 18 48 18 48 C18 48 36 31.5 36 18 C36 8 28 0 18 0 Z"
              fill="${pinColor}"
              stroke="${borderColor}"
              stroke-width="${isSelected ? 3 : 1.5}" />
        <circle cx="18" cy="18" r="9" fill="#17191C" />
        <text x="18" y="22" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, sans-serif">
          ${theme.icon}
        </text>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: html,
    iconSize: [size, size * 1.33],
    iconAnchor: [size / 2, size * 1.33],
    popupAnchor: [0, -(size * 1.33) + 6],
  });
};

const MunicipalMap = () => {
  const { user } = useContext(AuthContext);

  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Map DOM and instance refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerLookupRef = useRef({});

  // 1. Fetch map issues and departments on mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [mapRes, deptsRes] = await Promise.all([
          api.get('/issues/map').catch(async (err) => {
            console.warn('Map endpoint fallback to /issues/all:', err);
            return api.get('/issues/all');
          }),
          api.get('/departments').catch(() => ({ data: [] }))
        ]);

        if (isMounted) {
          const rawIssues = Array.isArray(mapRes.data) ? mapRes.data : [];
          setIssues(rawIssues);
          setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load municipal map data:', err);
          setErrorMsg(err.response?.data?.message || 'Failed to load authorized map data.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize Leaflet OpenStreetMap instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors | CivicConnect Municipal Operations',
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Helper: coordinate validator
  const isValidCoord = (issue) => {
    if (!issue || issue.latitude == null || issue.longitude == null) return false;
    const lat = Number(issue.latitude);
    const lng = Number(issue.longitude);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  const getDeptName = (deptId) => {
    if (!deptId) return 'Unassigned';
    const d = departments.find(item => item.id === deptId);
    return d ? d.name : deptId;
  };

  // 3. Filter issues
  const filteredIssues = issues.filter(issue => {
    if (!isValidCoord(issue)) return false;

    if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false;

    if (user.role === 'ADMIN' && departmentFilter !== 'ALL') {
      const matchDept = issue.assignedDepartmentId === departmentFilter || issue.recommendedDepartmentId === departmentFilter;
      if (!matchDept) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = issue.id?.toLowerCase().includes(term);
      const matchTitle = issue.title?.toLowerCase().includes(term);
      const matchAddress = issue.address?.toLowerCase().includes(term);
      const matchCategory = issue.category?.toLowerCase().includes(term);
      if (!matchId && !matchTitle && !matchAddress && !matchCategory) return false;
    }

    return true;
  });

  const uniqueCategories = Array.from(new Set(issues.map(i => i.category).filter(Boolean)));

  // 4. Update Leaflet Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerLookupRef.current = {};

    if (filteredIssues.length === 0) return;

    const latLngBounds = [];

    filteredIssues.forEach(issue => {
      const lat = parseFloat(issue.latitude);
      const lng = parseFloat(issue.longitude);
      const isSelected = selectedIssue?.id === issue.id;

      const marker = L.marker([lat, lng], {
        icon: createCustomMarkerIcon(issue.priority, isSelected),
        title: issue.title,
        riseOnHover: true,
      });

      const statusMeta = STATUS_THEME[issue.status] || { label: issue.status, color: '#666' };
      const priorityMeta = PRIORITY_THEME[issue.priority] || PRIORITY_THEME.MEDIUM;
      const deptDisplay = getDeptName(issue.assignedDepartmentId || issue.recommendedDepartmentId);

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; max-width: 290px; padding: 4px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #747982; text-transform: uppercase;">${issue.category || 'Civic Issue'}</span>
            <span style="font-size: 10px; font-weight: 800; color: #ffffff; background: ${priorityMeta.color}; padding: 2px 6px; border-radius: 9999px;">
              ${issue.priority}
            </span>
          </div>
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #202226; line-height: 1.3;">${issue.title}</h4>
          <div style="display:inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: ${statusMeta.color}20; color: ${statusMeta.color}; border: 1px solid ${statusMeta.color}40; margin-bottom: 8px;">
            ${statusMeta.label}
          </div>
          <div style="font-size: 11px; color: #747982; margin-bottom: 4px;">
            <strong>Dept:</strong> ${deptDisplay}
          </div>
          ${issue.address ? `<div style="font-size: 11px; color: #747982; margin-bottom: 6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><strong>Loc:</strong> ${issue.address}</div>` : ''}
          <div style="display:flex; gap: 6px;">
            <a href="/municipal/issues/${issue.id}" style="display:block; width:100%; text-align:center; background:#FF8A3D; color:#ffffff; font-size:11px; font-weight:700; padding:6px 10px; border-radius:8px; text-decoration:none;">
              ${user.role === 'WORKER' ? 'Manage Task &rarr;' : 'Open Complaint &rarr;'}
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300, offset: [0, -10] });

      marker.on('click', () => {
        setSelectedIssue(issue);
      });

      marker.addTo(markersLayer);
      markerLookupRef.current[issue.id] = marker;
      latLngBounds.push([lat, lng]);
    });

    if (latLngBounds.length > 0 && !selectedIssue) {
      try {
        const bounds = L.latLngBounds(latLngBounds);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (err) {
        console.warn('Error adjusting bounds:', err);
      }
    }
  }, [filteredIssues, selectedIssue?.id]);

  const handleLocateIssue = (issue) => {
    setSelectedIssue(issue);
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = parseFloat(issue.latitude);
    const lng = parseFloat(issue.longitude);
    map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });

    const marker = markerLookupRef.current[issue.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 600);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setDepartmentFilter('ALL');
    setSearchTerm('');
  };

  const getRoleHeader = () => {
    if (user.role === 'ADMIN') {
      return {
        title: 'Geographic Operations Map',
        subtitle: 'Complete administrative GIS tracking across all municipal divisions.',
        badge: 'Full City Scope',
      };
    }
    if (user.role === 'OFFICER') {
      const myDeptName = getDeptName(user.departmentId);
      return {
        title: `Department Operations Map (${myDeptName})`,
        subtitle: `Authorized departmental scope: complaints within ${myDeptName}.`,
        badge: `Dept: ${myDeptName}`,
      };
    }
    return {
      title: 'Worker Field Task Map',
      subtitle: 'Field operations view: locations of civic complaints assigned directly to you.',
      badge: `Worker: ${user.name || user.employeeId}`,
    };
  };

  const roleHeader = getRoleHeader();

  const metrics = {
    total: filteredIssues.length,
    critical: filteredIssues.filter(i => i.priority === 'CRITICAL').length,
    inProgress: filteredIssues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: filteredIssues.filter(i => ['RESOLVED', 'CLOSED', 'VERIFIED'].includes(i.status)).length,
  };

  // Strict citizen defense: Non-municipal users are redirected
  if (!user || user.role === 'citizen') {
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return (
    <div className="municipal-layout bg-[#F4F5F6] font-sans">
      <MunicipalSidebar />

      <div className="municipal-main flex flex-col min-w-0 overflow-hidden">
        <MunicipalTopNav title={roleHeader.title} breadcrumb="Operations Map" />

        {/* Top Control Bar */}
        <div className="bg-white border-b border-[#E2E4E7] px-4 sm:px-6 py-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#17191C] text-[#FF8A3D] border border-[#292D32]">
                  {roleHeader.badge}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight flex items-center gap-2">
                <Map className="w-5 h-5 text-[#FF8A3D] shrink-0" />
                <span>{roleHeader.title}</span>
              </h1>
              <p className="text-xs text-[#747982] mt-0.5">{roleHeader.subtitle}</p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="bg-[#F4F5F6] px-3 py-1.5 rounded-lg border border-[#E2E4E7] text-[#202226]">
                Markers: <strong className="font-bold">{metrics.total}</strong>
              </div>
              <div className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 text-[#E45757]">
                Critical: <strong className="font-bold">{metrics.critical}</strong>
              </div>
              <div className="bg-[#FFF3EB] px-3 py-1.5 rounded-lg border border-[#FF8A3D]/30 text-[#FF8A3D]">
                In Progress: <strong className="font-bold">{metrics.inProgress}</strong>
              </div>
              <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-[#20A779]">
                Resolved: <strong className="font-bold">{metrics.resolved}</strong>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 pt-3 border-t border-[#E2E4E7] flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#747982] pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search title, ID, address..."
                className="form-input-clean pl-8 text-xs py-1.5"
              />
            </div>

            {user.role === 'ADMIN' && (
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="form-input-clean text-xs py-1.5 sm:w-auto bg-white"
              >
                <option value="ALL">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="form-input-clean text-xs py-1.5 sm:w-auto bg-white"
            >
              <option value="ALL">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="form-input-clean text-xs py-1.5 sm:w-auto bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input-clean text-xs py-1.5 sm:w-auto bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="VERIFIED">Verified</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>

            {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || departmentFilter !== 'ALL' || searchTerm) && (
              <button
                onClick={handleResetFilters}
                className="btn-white-outline text-xs py-1.5 px-3 text-[#E45757] hover:border-[#E45757]"
              >
                <span>Reset</span>
                <X className="w-3 h-3 ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Map & List Split View */}
        <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
          {/* Real Leaflet Map */}
          <div className="flex-1 relative flex flex-col min-h-[350px] sm:min-h-[450px]">
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-xs">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-[#FF8A3D] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs font-semibold text-[#202226]">Loading GIS Map...</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-[#E45757] text-xs">
                <strong>Error:</strong> {errorMsg}
              </div>
            )}

            <div
              id="civicconnect-osm-map"
              ref={mapContainerRef}
              className="w-full h-full min-h-[350px] sm:min-h-[450px] lg:min-h-[520px] flex-1 z-0"
            />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 rounded-xl shadow-md border border-[#E2E4E7] text-xs">
              <div className="font-bold text-[#202226] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF8A3D]" />
                <span>Priority Pins</span>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E45757] shrink-0"></span>
                  <span className="text-[#202226]">Critical (!)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF8A3D] shrink-0"></span>
                  <span className="text-[#202226]">High (▲)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F4B740] shrink-0"></span>
                  <span className="text-[#202226]">Medium (●)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4C8DFF] shrink-0"></span>
                  <span className="text-[#202226]">Low (▼)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Operations List Panel */}
          <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-[#E2E4E7] flex flex-col h-auto max-h-[500px] lg:max-h-none lg:h-[calc(100vh-140px)] shadow-xs">
            <div className="p-4 border-b border-[#E2E4E7] bg-[#F4F5F6] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#202226] text-xs uppercase tracking-wider">
                  {user.role === 'WORKER' ? 'My Assigned Work Sites' : 'Mapped Complaints'}
                </h3>
                <p className="text-[11px] text-[#747982]">
                  {filteredIssues.length} location{filteredIssues.length !== 1 ? 's' : ''} in view
                </p>
              </div>

              {selectedIssue && (
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-xs text-[#747982] hover:text-[#202226] font-semibold px-2 py-1 rounded-lg hover:bg-white transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Clear</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Selected Card preview */}
            {selectedIssue && (
              <div className="p-4 border-b border-[#E2E4E7] bg-[#FFF3EB]/60">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#FF8A3D] bg-white px-2 py-0.5 rounded border border-[#FF8A3D]/30">
                    {selectedIssue.id}
                  </span>
                  <span className={`badge-status text-[10px] ${PRIORITY_THEME[selectedIssue.priority]?.bg}`}>
                    {selectedIssue.priority}
                  </span>
                </div>

                <h4 className="font-bold text-[#202226] text-xs mt-2 line-clamp-2">
                  {selectedIssue.title}
                </h4>

                <p className="text-[11px] text-[#747982] mt-1 line-clamp-2">
                  {selectedIssue.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-[#FF8A3D]/20 text-[11px] space-y-1 text-[#747982]">
                  <div><strong className="text-[#202226]">Category:</strong> {selectedIssue.category}</div>
                  <div><strong className="text-[#202226]">Dept:</strong> {getDeptName(selectedIssue.assignedDepartmentId || selectedIssue.recommendedDepartmentId)}</div>
                  <div><strong className="text-[#202226]">Status:</strong> {selectedIssue.status}</div>
                </div>

                <div className="mt-3">
                  <Link
                    to={`/municipal/issues/${selectedIssue.id}`}
                    className="btn-orange-primary w-full py-1.5 text-xs font-bold"
                  >
                    <span>{user.role === 'WORKER' ? 'Manage Task' : 'Open Complaint'}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            )}

            {/* Scrollable Marker List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E2E4E7]">
              {filteredIssues.length === 0 ? (
                <div className="p-8 text-center text-[#747982]">
                  <MapPin className="w-8 h-8 text-[#E2E4E7] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#202226]">No matching coordinates found</p>
                  <p className="text-[11px] text-[#747982] mt-1">Adjust filters or search parameters.</p>
                </div>
              ) : (
                filteredIssues.map(issue => {
                  const isSelected = selectedIssue?.id === issue.id;
                  const priority = PRIORITY_THEME[issue.priority] || PRIORITY_THEME.MEDIUM;
                  const status = STATUS_THEME[issue.status] || { label: issue.status, color: '#666' };

                  return (
                    <div
                      key={issue.id}
                      onClick={() => handleLocateIssue(issue)}
                      className={`p-3.5 cursor-pointer transition flex items-start gap-3 hover:bg-[#F4F5F6] ${
                        isSelected ? 'bg-[#FFF3EB] border-l-4 border-[#FF8A3D]' : ''
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 flex items-center justify-center text-[8px] text-white font-bold"
                        style={{ backgroundColor: priority.color }}
                      >
                        {priority.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-bold text-[#202226] truncate">
                            {issue.title}
                          </p>
                          <span className={`badge-status text-[9px] py-0.5 px-1.5 shrink-0 ${status.badge}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#747982] flex items-center gap-1.5">
                          <span>{issue.category}</span>
                          <span>&bull;</span>
                          <span className="font-mono text-[10px]">{issue.id}</span>
                        </div>

                        {issue.address && (
                          <div className="text-[11px] text-[#747982] truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#FF8A3D] shrink-0" />
                            <span className="truncate">{issue.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MunicipalMap;
