import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert, PageContainer } from '../../../components/ui';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token') || '';
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordData) => {
    setErrorMessage(null);
    try {
      await authApi.resetPassword(data);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Password reset failed. The token may be expired or invalid.';
      setErrorMessage(msg);
    }
  };

  return (
    <PageContainer className="py-12 flex justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gov-900 text-amber-400 shadow-md mb-3">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose a strong password to secure your portal account
          </p>
        </div>

        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Reset Your Password
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <Alert variant="success" title="Password Reset Successfully">
                  Your password has been updated. All previous sessions have been securely terminated.
                  Redirecting to sign in...
                </Alert>
                <Link to="/login">
                  <Button variant="primary" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <Alert variant="error" title="Reset Failed">
                    {errorMessage}
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <Input
                    label="Reset Security Token"
                    placeholder="Enter or paste recovery token"
                    required
                    error={errors.token?.message}
                    {...register('token')}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    placeholder="At least 8 characters"
                    required
                    error={errors.newPassword?.message}
                    {...register('newPassword')}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Re-enter new password"
                    required
                    error={errors.confirmNewPassword?.message}
                    {...register('confirmNewPassword')}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5"
                    isLoading={isSubmitting}
                  >
                    Update Password &amp; Invalidate Sessions
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
