import { ExportRequestDto } from '../analytics.types.js';
import { analyticsService } from './analytics.service.js';
import { auditService } from './audit.service.js';
import { AuditResult } from '@prisma/client';

export class ExportService {
  /**
   * Generates formatted data export (CSV or JSON) and records an immutable audit log.
   */
  public async generateExport(
    params: ExportRequestDto,
    actor: { id: string; email: string; role: string; ipAddress?: string },
  ): Promise<{ data: string; contentType: string; filename: string }> {
    const filter = {
      timeRange: params.timeRange,
      startDate: params.startDate,
      endDate: params.endDate,
    };

    let exportContent: unknown;

    switch (params.exportType) {
      case 'PLATFORM':
        exportContent = await analyticsService.getPlatformOverview(filter);
        break;
      case 'USERS':
        exportContent = await analyticsService.getUserAnalytics(filter);
        break;
      case 'SCHEMES':
        exportContent = await analyticsService.getSchemeAnalytics(filter);
        break;
      case 'RECOMMENDATIONS':
        exportContent = await analyticsService.getRecommendationAnalytics(filter);
        break;
      case 'DOCUMENTS':
        exportContent = await analyticsService.getDocumentAnalytics(filter);
        break;
      case 'NOTIFICATIONS':
        exportContent = await analyticsService.getNotificationAnalytics(filter);
        break;
      case 'AI':
        exportContent = await analyticsService.getAiAnalytics(filter);
        break;
      case 'AUDIT': {
        const logs = await auditService.getAuditLogs({
          startDate: params.startDate,
          endDate: params.endDate,
          limit: 100,
        });
        exportContent = logs.items;
        break;
      }
      default:
        exportContent = await analyticsService.getPlatformOverview(filter);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `analytics-${params.exportType.toLowerCase()}-${timestamp}.${params.format.toLowerCase()}`;

    let outputData: string;
    let contentType: string;

    if (params.format === 'JSON') {
      outputData = JSON.stringify(exportContent, null, 2);
      contentType = 'application/json';
    } else {
      // Flatten into CSV lines
      outputData = this.convertToCsv(exportContent);
      contentType = 'text/csv';
    }

    // Audit the export action
    await auditService.recordAuditLog({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'ANALYTICS_EXPORT_GENERATED',
      entityType: 'ANALYTICS_EXPORT',
      entityId: filename,
      result: AuditResult.SUCCESS,
      ipAddress: actor.ipAddress,
      metadata: {
        exportType: params.exportType,
        format: params.format,
        rowCount: Array.isArray(exportContent) ? exportContent.length : 1,
      },
    });

    return {
      data: outputData,
      contentType,
      filename,
    };
  }

  private convertToCsv(data: unknown): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return 'No data available';
      const keys = Object.keys(data[0] as Record<string, unknown>);
      const header = keys.join(',');
      const rows = data.map((item) =>
        keys
          .map((k) => {
            const val = (item as Record<string, unknown>)[k];
            const cleanVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            return `"${cleanVal.replace(/"/g, '""')}"`;
          })
          .join(','),
      );
      return [header, ...rows].join('\n');
    }

    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data as Record<string, unknown>);
      const header = 'Metric,Value';
      const rows = entries.map(([k, v]) => {
        const cleanVal = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
        return `"${k}","${cleanVal.replace(/"/g, '""')}"`;
      });
      return [header, ...rows].join('\n');
    }

    return String(data);
  }
}

export const exportService = new ExportService();
