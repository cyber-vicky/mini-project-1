import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MunicipalSidebar from '../components/MunicipalSidebar';
import MunicipalTopNav from '../components/MunicipalTopNav';
import { Flame, BarChart3, TrendingUp, AlertTriangle, Layers, MapPin } from 'lucide-react';

const BAR_COLORS = {
  SUBMITTED: '#F4B740',
  ACKNOWLEDGED: '#4C8DFF',
  ASSIGNED: '#292D32',
  IN_PROGRESS: '#FF8A3D',
  RESOLVED: '#20A779',
  VERIFIED: '#20A779',
  CLOSED: '#747982',
  REOPENED: '#E45757',
};

const PRIORITY_COLORS = {
  CRITICAL: '#E45757',
  HIGH: '#FF8A3D',
  MEDIUM: '#F4B740',
  LOW: '#4C8DFF',
};

const StatCard = ({ label, value, color }) => (
  <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
    <p className="text-[10px] sm:text-[11px] text-[#747982] font-bold uppercase tracking-wider">{label}</p>
    <p className="text-2xl sm:text-3xl font-black text-[#202226] mt-1 tracking-tight">{value}</p>
    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }}></div>
  </div>
);

const BarChart = ({ data, colors, title }) => {
  const values = Object.values(data || {});
  const max = Math.max(...(values.length > 0 ? values : [1]), 1);

  return (
    <div className="civic-card p-5 sm:p-6 space-y-4">
      <div className="pb-3 border-b border-[#E2E4E7] flex justify-between items-center">
        <h3 className="font-bold text-sm text-[#202226]">{title}</h3>
        <span className="text-xs text-[#747982] font-semibold">{Object.keys(data || {}).length} Categories</span>
      </div>

      <div className="space-y-3">
        {data && Object.keys(data).length > 0 ? (
          Object.entries(data).map(([key, count]) => {
            const pct = Math.round((count / max) * 100);
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-[#202226] truncate">{key}</span>
                  <span className="font-bold text-[#202226] shrink-0">{count}</span>
                </div>
                <div className="w-full bg-[#F4F5F6] rounded-full h-2 overflow-hidden border border-[#E2E4E7]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(pct, 4)}%`,
                      backgroundColor: colors?.[key] || '#FF8A3D'
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-[#747982] text-center py-4">No statistical data recorded</p>
        )}
      </div>
    </div>
  );
};

const MunicipalAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, hotspotRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/analytics/hotspots').catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setHotspots(Array.isArray(hotspotRes.data) ? hotspotRes.data : []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="municipal-layout bg-[#F4F5F6] font-sans">
      <MunicipalSidebar />

      <div className="municipal-main flex flex-col min-w-0">
        <MunicipalTopNav title="Municipal Infrastructure Analytics" breadcrumb="Analytics" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1">
          {/* Header */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A3D] block mb-0.5">
              City Governance Intelligence
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
              Analytics &amp; Cluster Hotspots
            </h1>
            <p className="text-xs text-[#747982] mt-0.5">
              Resolution velocity, category bottlenecks, and geographic civic complaint clustering.
            </p>
          </div>

          {loading ? (
            <div className="civic-card p-12 text-center text-[#747982] text-sm">
              Loading analytics and infrastructure performance metrics...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-[#E45757] text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* Summary stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                <StatCard label="Total Lodged" value={stats?.total ?? 0} color="#17191C" />
                <StatCard
                  label="Active Pipeline"
                  value={(stats?.byStatus?.IN_PROGRESS || 0) + (stats?.byStatus?.ASSIGNED || 0)}
                  color="#FF8A3D"
                />
                <StatCard
                  label="Resolved / Verified"
                  value={(stats?.byStatus?.RESOLVED || 0) + (stats?.byStatus?.VERIFIED || 0) + (stats?.byStatus?.CLOSED || 0)}
                  color="#20A779"
                />
                <StatCard
                  label="Critical Priority"
                  value={stats?.byPriority?.CRITICAL ?? 0}
                  color="#E45757"
                />
              </div>

              {/* Bar Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChart
                  data={stats?.byStatus || {}}
                  colors={BAR_COLORS}
                  title="Complaints by Workflow Status"
                />
                <BarChart
                  data={stats?.byPriority || {}}
                  colors={PRIORITY_COLORS}
                  title="Complaints by Severity Priority"
                />
              </div>

              {/* Department Workload Breakdown */}
              {stats?.byDepartment && (
                <BarChart
                  data={stats.byDepartment}
                  colors={{}}
                  title="Departmental Complaint Allocation"
                />
              )}

              {/* Hotspots Section */}
              <div className="civic-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E4E7]">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#FF8A3D]" />
                    <h3 className="font-bold text-sm sm:text-base text-[#202226]">
                      Geographic Hotspots &amp; Problem Zones
                    </h3>
                  </div>
                  <span className="text-xs text-[#747982]">High Density Incident Clusters</span>
                </div>

                {hotspots.length === 0 ? (
                  <p className="text-xs text-[#747982] py-4 text-center">
                    No active complaint clusters detected. Incidents are distributed normally.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotspots.map((spot, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#F4F5F6] border border-[#E2E4E7] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#FF8A3D] bg-white px-2 py-0.5 rounded border border-[#E2E4E7]">
                            Zone #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-[#202226]">
                            {spot.count} Issues
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#202226] truncate">
                          {spot.location || spot.address || 'Coordinates Cluster'}
                        </p>
                        {spot.category && (
                          <p className="text-[11px] text-[#747982]">
                            Primary: <strong className="text-[#202226]">{spot.category}</strong>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MunicipalAnalytics;
