import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert, PageContainer } from '../../../components/ui';

const registerFormSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    consentProfile: z.boolean().refine((val) => val === true, {
      message: 'You must agree to profile processing to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      consentProfile: true,
    },
  });

  const passwordValue = watch('password', '');
  const hasMinLength = passwordValue.length >= 8;
  const hasLetter = /[A-Za-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      await registerAuth({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName || undefined,
      });
      // Redirect directly to profile setup
      navigate('/profile', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Registration could not be completed. Please try a different email address.';
      setErrorMessage(msg);
    }
  };

  return (
    <PageContainer className="py-10 flex justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gov-900 text-amber-400 shadow-md mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Citizen Profile</h1>
          <p className="text-xs text-slate-500 mt-1">
            Free, transparent benefit discovery. Only essential registration details required.
          </p>
        </div>

        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              Account Registration
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {errorMessage && (
              <Alert variant="error" title="Registration Failed">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <Input
                  label="Full Name (Optional)"
                  placeholder="e.g. Manish Kumar"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  required
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Create Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
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

                {/* Password strength visual guidelines */}
                <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasLetter && hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Contains letters and numbers</span>
                  </div>
                </div>
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  required
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              {/* Explicit Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded text-gov-800 border-slate-300 focus:ring-gov-700"
                    {...register('consentProfile')}
                  />
                  <span className="text-xs text-slate-600 leading-normal">
                    I grant consent for the portal to store my basic profile to discover matching schemes.
                    This consent is revocable in my Account Settings at any time.
                  </span>
                </label>
                {errors.consentProfile && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.consentProfile.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 mt-2"
                isLoading={isSubmitting}
              >
                Create Account &amp; Proceed to Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gov-700 hover:text-gov-900 hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};
