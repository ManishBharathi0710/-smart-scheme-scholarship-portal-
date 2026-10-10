import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { DetailedSystemHealthDto, HealthStatus } from '../../../types/analytics';

export interface SystemHealthStatusProps {
  health: DetailedSystemHealthDto | null;
  isLoading?: boolean;
  onRefresh: () => void;
}

export const SystemHealthStatus: React.FC<SystemHealthStatusProps> = ({
  health,
  isLoading = false,
  onRefresh,
}) => {
  const getBadgeVariant = (status: HealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'UNAVAILABLE':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${Math.floor(seconds % 60)}s`;
  };

  if (!health) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No health telemetry data currently available.</p>
        <Button size="sm" variant="outline" onClick={onRefresh} className="mt-3">
          Check System Diagnostics
        </Button>
      </div>
    );
  }

  const { overallStatus, uptimeSeconds, timestamp, services } = health;

  const serviceList = [
    {
      name: 'Application API Gateway',
      key: 'api',
      data: services.api,
      desc: 'Express HTTP routing, middleware, rate-limiting & auth guards',
    },
    {
      name: 'Relational Database (Prisma/SQLite/Postgres)',
      key: 'database',
      data: services.database,
      desc: 'Transactional persistent storage for users, schemes & logs',
    },
    {
      name: 'Document Storage Vault',
      key: 'storage',
      data: services.storage,
      desc: 'Encrypted citizen document repository & file system access',
    },
    {
      name: 'OCR Processing Engine',
      key: 'ocr',
      data: services.ocr,
      desc: 'Automated document text extraction & field confidence scoring',
    },
    {
      name: 'AI Intelligence Provider',
      key: 'ai',
      data: services.ai,
      desc: 'Multilingual assistant, grounding verifier & scheme explanation',
    },
    {
      name: 'Notification Dispatcher',
      key: 'notifications',
      data: services.notifications,
      desc: 'In-app notification queue & transactional email channel',
    },
    {
      name: 'Cron Job Scheduler',
      key: 'scheduler',
      data: services.scheduler,
      desc: 'Background daemon for deadline reminders & document cleanup',
    },
  ];

  return (
    <div className="space-y-6" data-testid="system-health-dashboard">
      {/* Overall Status Banner */}
      <Card
        className={`border-2 ${
          overallStatus === 'HEALTHY'
            ? 'border-emerald-300 bg-emerald-50/40'
            : overallStatus === 'DEGRADED'
            ? 'border-amber-300 bg-amber-50/40'
            : 'border-rose-300 bg-rose-50/40'
        }`}
      >
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`h-4 w-4 rounded-full ${
                overallStatus === 'HEALTHY'
                  ? 'bg-emerald-500 animate-pulse'
                  : overallStatus === 'DEGRADED'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500 animate-ping'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Platform Operational Status:</h3>
                <Badge variant={getBadgeVariant(overallStatus)}>{overallStatus}</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                System uptime: <strong>{formatUptime(uptimeSeconds)}</strong> • Last diagnostic check:{' '}
                {new Date(timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={onRefresh}
            className="bg-white hover:bg-slate-50"
          >
            {isLoading ? 'Running Diagnostics...' : 'Refresh Health'}
          </Button>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceList.map((svc) => (
          <Card key={svc.key} className="border-slate-200 hover:border-slate-300 transition-colors">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">{svc.name}</CardTitle>
              <Badge variant={getBadgeVariant(svc.data.status)}>{svc.data.status}</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-slate-500">{svc.desc}</p>
              {typeof svc.data.latencyMs === 'number' && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Latency:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {svc.data.latencyMs} ms
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
