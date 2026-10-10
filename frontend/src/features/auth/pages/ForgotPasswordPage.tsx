import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert, PageContainer } from '../../../components/ui';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [successInfo, setSuccessInfo] = useState<{ message: string; devToken?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setErrorMessage(null);
    try {
      const res = await authApi.forgotPassword(data);
      setSuccessInfo(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred. Please try again later.';
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
          <h1 className="text-2xl font-bold text-slate-900">Account Recovery</h1>
          <p className="text-xs text-slate-500 mt-1">
            Request secure reset instructions for your portal account
          </p>
        </div>

        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Password Reset Request
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {successInfo ? (
              <div className="space-y-4">
                <Alert variant="success" title="Request Processed">
                  {successInfo.message}
                </Alert>

                {successInfo.devToken && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
                    <p className="font-bold mb-1">Development Environment Token:</p>
                    <p className="font-mono bg-white p-2 rounded border border-amber-300 break-all select-all">
                      {successInfo.devToken}
                    </p>
                    <p className="mt-2 text-slate-600">
                      Use this token on the{' '}
                      <Link
                        to={`/reset-password?token=${successInfo.devToken}`}
                        className="font-bold text-gov-800 underline"
                      >
                        Reset Password Page
                      </Link>
                      .
                    </p>
                  </div>
                )}

                <Link to="/login" className="block text-center">
                  <Button variant="outline" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <Alert variant="error" title="Request Error">
                    {errorMessage}
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the email address registered with your account. If it exists in our system,
                    we will issue a secure single-use recovery token.
                  </p>

                  <Input
                    label="Registered Email Address"
                    type="email"
                    placeholder="name@example.com"
                    required
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5"
                    isLoading={isSubmitting}
                  >
                    Send Recovery Instructions
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-slate-600">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-gov-700 hover:text-gov-900">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};
