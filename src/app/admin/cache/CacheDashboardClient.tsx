"use client";

import { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Trash2, 
  Zap, 
  Activity, 
  Database, 
  AlertTriangle,
  CheckCircle2,
  Server
} from "lucide-react";
import { toast } from "sonner";

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  errors: number;
  latency: {
    avg: number;
    p95: number;
    p99: number;
  };
  memory: {
    used: number;
    peak: number;
  };
  keys: number;
  redisAvailable: boolean;
  timestamp: string;
}

export default function CacheDashboardClient() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warming, setWarming] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/cache/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch cache statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleWarmCache = async (strategy?: string) => {
    setWarming(true);
    try {
      const response = await fetch("/api/admin/cache/warm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      
      if (!response.ok) throw new Error("Failed to warm cache");
      
      const data = await response.json();
      toast.success(data.message);
      fetchStats();
    } catch (error) {
      console.error("Error warming cache:", error);
      toast.error("Failed to warm cache");
    } finally {
      setWarming(false);
    }
  };

  const handleClearCache = async (type: 'all' | 'pattern', value?: string) => {
    if (!confirm(type === 'all' ? "Are you sure you want to clear ALL cache?" : `Clear cache for pattern: ${value}?`)) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch("/api/admin/cache/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === 'all' ? { all: true } : { pattern: value }
        ),
      });
      
      if (!response.ok) throw new Error("Failed to clear cache");
      
      const data = await response.json();
      toast.success(data.message);
      fetchStats();
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast.error("Failed to clear cache");
    } finally {
      setClearing(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hitRate = stats ? 
    (stats.hits / (stats.hits + stats.misses || 1) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Redis Status</h3>
            <Server className={`h-4 w-4 ${stats?.redisAvailable ? "text-green-500" : "text-red-500"}`} />
          </div>
          <div className="text-2xl font-bold flex items-center gap-2">
            {stats?.redisAvailable ? "Connected" : "Disconnected"}
            {stats?.redisAvailable && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.redisAvailable ? "Operational" : "Using fallback"}
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Cache Hit Rate</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{hitRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.hits} hits / {stats?.misses} misses
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Avg Latency</h3>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats?.latency.avg}ms</div>
          <p className="text-xs text-muted-foreground mt-1">
            P95: {stats?.latency.p95}ms / P99: {stats?.latency.p99}ms
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Operations</h3>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats?.sets}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Sets / {stats?.invalidations} Invalidations
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Cache Warming</h3>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Pre-populate critical cache entries to improve initial performance.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleWarmCache()}
              disabled={warming}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {warming ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Warm All Caches
            </button>
            <button
              onClick={() => handleWarmCache('availableDoctors')}
              disabled={warming}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Warm Doctors
            </button>
            <button
              onClick={() => handleWarmCache('adminStats')}
              disabled={warming}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Warm Stats
            </button>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Cache Management</h3>
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            Clear cache entries. Use with caution in production.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleClearCache('all')}
              disabled={clearing}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
            >
              {clearing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Clear All Cache
            </button>
            <button
              onClick={() => handleClearCache('pattern', 'medibook:doctors:*')}
              disabled={clearing}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Clear Doctors
            </button>
            <button
              onClick={() => handleClearCache('pattern', 'medibook:appointments:*')}
              disabled={clearing}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Clear Appointments
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>
    </div>
  );
}
