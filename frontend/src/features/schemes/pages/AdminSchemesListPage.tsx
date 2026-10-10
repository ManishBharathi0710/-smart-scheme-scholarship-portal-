import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileEdit,
  Eye,
  Send,
  UploadCloud,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { schemesApi } from '../api/schemes.api';
import { useAuth } from '../../auth/context/AuthContext';
import { SchemeStatus, AdminSchemeRecord } from '../../../types/scheme';
import {
  PageContainer,
  Card,
  Button,
  Input,
  Badge,
  Spinner,
  Alert,
} from '../../../components/ui';
import { VerificationModal } from '../components/VerificationModal';

export const AdminSchemesListPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SchemeStatus | ''>('');
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    schemeId: string;
    schemeName: string;
    mode: 'VERIFY' | 'REJECT';
  }>({
    isOpen: false,
    schemeId: '',
    schemeName: '',
    mode: 'VERIFY',
  });
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const userRole = user?.role;
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN' || isSuperAdmin;
  const isVerifier = userRole === 'VERIFIER' || isAdmin;
  const isManager = userRole === 'SCHEME_MANAGER' || isAdmin;

  // Query schemes
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-schemes', page, search, statusFilter],
    queryFn: () =>
      schemesApi.getAllSchemesAdmin({
        page,
        pageSize: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Workflow mutations
  const submitVerificationMutation = useMutation({
    mutationFn: (id: string) => schemesApi.submitForVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      setActionFeedback({ type: 'success', message: 'Scheme submitted for official verification.' });
    },
    onError: (err: unknown) => {
      setActionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit scheme for verification.',
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => schemesApi.publishScheme(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      setActionFeedback({ type: 'success', message: 'Scheme published and active for citizens.' });
    },
    onError: (err: unknown) => {
      setActionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to publish scheme.',
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => schemesApi.unpublishScheme(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      setActionFeedback({ type: 'success', message: 'Scheme unpublished successfully.' });
    },
    onError: (err: unknown) => {
      setActionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to unpublish scheme.',
      });
    },
  });

  const discontinueMutation = useMutation({
    mutationFn: (id: string) => schemesApi.discontinueScheme(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      setActionFeedback({ type: 'success', message: 'Scheme marked as discontinued.' });
    },
    onError: (err: unknown) => {
      setActionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to discontinue scheme.',
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => schemesApi.verifyScheme(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      setActionFeedback({ type: 'success', message: 'Scheme verified and approved.' });
    },
    onError: (err: unknown) => {
      setActionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to verify scheme.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      schemesApi.rejectVerification(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      setActionFeedback({ type: 'success', message: 'Scheme verification rejected with feedback.' });
    },
    onError: (err: unknown) => {
      setActionFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to reject verification.',
      });
    },
  });

  const handleModalSubmit = async (notesOrReason: string) => {
    if (modalState.mode === 'VERIFY') {
      await verifyMutation.mutateAsync({ id: modalState.schemeId, notes: notesOrReason });
    } else {
      await rejectMutation.mutateAsync({ id: modalState.schemeId, reason: notesOrReason });
    }
  };

  const getStatusBadge = (status: SchemeStatus) => {
    switch (status) {
      case 'PUBLISHED':
      case 'ACTIVE':
        return <Badge variant="success">Published</Badge>;
      case 'VERIFIED':
        return <Badge variant="info">Verified</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge variant="warning">Awaiting Review</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral">Draft</Badge>;
      case 'DISCONTINUED':
        return <Badge variant="danger">Discontinued</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <PageContainer className="py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scheme &amp; Benefit Administration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage official welfare programs, register structured eligibility rules, audit notifications, and publish verified schemes.
          </p>
        </div>

        {isManager && (
          <Link to="/admin/schemes/new">
            <Button variant="primary" className="text-xs font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Register New Scheme Draft
            </Button>
          </Link>
        )}
      </div>

      {actionFeedback && (
        <Alert variant={actionFeedback.type === 'success' ? 'success' : 'error'}>
          {actionFeedback.message}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 bg-white p-1 rounded-t-lg shadow-sm text-xs font-semibold">
        {[
          { label: 'All Schemes', value: '' },
          { label: 'Drafts', value: 'DRAFT' },
          { label: 'Awaiting Verification', value: 'PENDING_VERIFICATION' },
          { label: 'Verified (Ready to Publish)', value: 'VERIFIED' },
          { label: 'Published & Active', value: 'PUBLISHED' },
          { label: 'Discontinued', value: 'DISCONTINUED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value as SchemeStatus | '');
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-md transition-colors ${
              statusFilter === tab.value
                ? 'bg-gov-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-b-lg border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, short name, or slug..."
            className="pl-9 text-xs"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Schemes Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Scheme Details</th>
                <th className="py-3 px-4">Department &amp; Level</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Spinner size="md" />
                    <p className="mt-2 text-xs">Loading scheme records...</p>
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-red-600 font-medium">
                    Failed to load administrative scheme catalog.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No schemes found in this status category.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                data?.items.map((scheme: AdminSchemeRecord) => (
                  <tr key={scheme.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Title & Slug */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{scheme.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{scheme.slug}</div>
                      <div className="text-[10px] text-gov-700 font-medium mt-0.5">
                        {scheme.programType.replace(/_/g, ' ')}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="truncate text-slate-800 font-medium">{scheme.department.name}</div>
                      <span className="text-[10px] text-slate-400">{scheme.department.level} Government</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">{getStatusBadge(scheme.status)}</td>

                    {/* Verification Badge */}
                    <td className="py-3 px-4">
                      {scheme.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      ) : scheme.verificationStatus === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {scheme.verificationStatus}
                        </span>
                      )}
                    </td>

                    {/* Version */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      v{scheme.currentVersion}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* View Link */}
                      <Link
                        to={`/schemes/${scheme.slug}`}
                        className="p-1.5 rounded text-slate-600 hover:text-gov-900 hover:bg-slate-100 inline-flex items-center"
                        title="View Public Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>

                      {/* Edit Button */}
                      {isManager && (
                        <Link
                          to={`/admin/schemes/${scheme.id}/edit`}
                          className="p-1.5 rounded text-slate-600 hover:text-gov-900 hover:bg-slate-100 inline-flex items-center"
                          title="Edit Scheme Content"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      {/* Submit for verification (Draft -> Pending) */}
                      {isManager && (scheme.status === 'DRAFT' || scheme.verificationStatus === 'REJECTED') && (
                        <button
                          type="button"
                          onClick={() => submitVerificationMutation.mutate(scheme.id)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] inline-flex items-center gap-1"
                          title="Submit to Verifier"
                        >
                          <Send className="w-3 h-3" /> Submit
                        </button>
                      )}

                      {/* Verify / Reject (Pending -> Verified) */}
                      {isVerifier && scheme.status === 'PENDING_VERIFICATION' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setModalState({
                                isOpen: true,
                                schemeId: scheme.id,
                                schemeName: scheme.name,
                                mode: 'VERIFY',
                              })
                            }
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] inline-flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" /> Verify
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setModalState({
                                isOpen: true,
                                schemeId: scheme.id,
                                schemeName: scheme.name,
                                mode: 'REJECT',
                              })
                            }
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-semibold rounded text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Publish (Verified -> Published) */}
                      {isAdmin && scheme.status === 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => publishMutation.mutate(scheme.id)}
                          className="px-2 py-1 bg-gov-900 hover:bg-gov-800 text-white font-bold rounded text-[11px] inline-flex items-center gap-1"
                        >
                          <UploadCloud className="w-3 h-3" /> Publish
                        </button>
                      )}

                      {/* Unpublish */}
                      {isAdmin && scheme.status === 'PUBLISHED' && (
                        <button
                          type="button"
                          onClick={() => unpublishMutation.mutate(scheme.id)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded text-[11px]"
                        >
                          Unpublish
                        </button>
                      )}

                      {/* Discontinue */}
                      {isAdmin && scheme.status !== 'DISCONTINUED' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Discontinue "${scheme.name}"? Historical records will be retained.`)) {
                              discontinueMutation.mutate(scheme.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded inline-flex items-center"
                          title="Discontinue Scheme"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="text-xs"
          >
            Previous
          </Button>
          <span className="text-xs text-slate-600 px-2 font-medium">
            Page {page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, data.pagination.totalPages))}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      )}

      {/* Verification Modal */}
      {modalState.isOpen && (
        <VerificationModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
          schemeId={modalState.schemeId}
          schemeName={modalState.schemeName}
          mode={modalState.mode}
          onSubmit={handleModalSubmit}
          isLoading={verifyMutation.isPending || rejectMutation.isPending}
        />
      )}
    </PageContainer>
  );
};
