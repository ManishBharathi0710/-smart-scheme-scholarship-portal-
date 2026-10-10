import React, { useState } from 'react';
import { Modal, Button, Textarea, Alert } from '../../../components/ui';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeId: string;
  schemeName: string;
  mode: 'VERIFY' | 'REJECT';
  onSubmit: (notesOrReason: string) => Promise<void>;
  isLoading: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  schemeName,
  mode,
  onSubmit,
  isLoading,
}) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 5) {
      setError(
        mode === 'VERIFY'
          ? 'Please enter detailed verification notes citing official gazette or department checks (min 5 characters).'
          : 'Please provide a clear reason for rejecting verification so the manager can correct it.',
      );
      return;
    }

    setError(null);
    try {
      await onSubmit(text.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'VERIFY' ? 'Approve Scheme Verification' : 'Reject Scheme Verification'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <p className="text-xs text-slate-600">
          Target Scheme: <strong className="text-slate-900">{schemeName}</strong>
        </p>

        {mode === 'VERIFY' ? (
          <p className="text-xs text-slate-500 leading-relaxed">
            By verifying this scheme, you certify that the eligibility rules, benefits, and official source URLs
            have been audited against authentic government department publications.
          </p>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Specify the inaccuracies or missing documentation. The scheme draft will be returned to the scheme manager
            for revision.
          </p>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {mode === 'VERIFY' ? 'Official Verification Notes *' : 'Rejection Reason *'}
          </label>
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'VERIFY'
                ? 'e.g., Verified against Department G.O. Ms. No. 128 / 2026. Application portal URL confirmed active.'
                : 'e.g., Official source URL is broken; income ceiling in rules does not match the gazette notification.'
            }
            className="text-xs"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isLoading} className="text-xs">
            Cancel
          </Button>
          <Button
            variant={mode === 'VERIFY' ? 'primary' : 'danger'}
            type="submit"
            isLoading={isLoading}
            className="text-xs font-bold"
          >
            {mode === 'VERIFY' ? 'Confirm Official Verification' : 'Reject Verification'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
