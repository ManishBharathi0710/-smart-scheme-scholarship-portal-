import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert, PageContainer } from '../../../components/ui';

const loginFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Return to previous target page or profile
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'We could not sign you in. Please verify your email and password.';
      setErrorMessage(msg);
    }
  };

  return (
    <PageContainer className="py-12 flex justify-center">
      <div className="w-full max-w-md">
        {/* Portal crest identity banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gov-900 text-amber-400 shadow-md mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Citizen Sign In</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your verified profile, saved schemes, and personalized recommendations
          </p>
        </div>

        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Enter Account Credentials
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {errorMessage && (
              <Alert variant="error" title="Sign In Unsuccessful">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-gov-700 hover:text-gov-900 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full rounded-md border px-3 py-2 pr-10 text-sm text-slate-900 bg-white placeholder-slate-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      errors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                        : 'border-slate-300 focus:border-gov-600 focus:ring-gov-600'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 mt-2"
                isLoading={isSubmitting}
              >
                Sign In to Portal
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Link to Registration */}
        <div className="text-center mt-6 text-sm text-slate-600">
          New to the portal?{' '}
          <Link to="/register" className="font-semibold text-gov-700 hover:text-gov-900 hover:underline">
            Create an Account
          </Link>
        </div>

        {/* Privacy Note */}
        <p className="text-[11px] text-center text-slate-400 mt-4 leading-normal">
          By signing in, you agree to our data minimization principles. We do not sell or share citizen data with third parties.
        </p>
      </div>
    </PageContainer>
  );
};
