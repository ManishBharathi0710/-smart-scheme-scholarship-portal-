import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { PageContainer, Button } from '../components/ui';

export const NotFoundPage: React.FC = () => {
  return (
    <PageContainer className="py-20 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-gov-50 text-gov-800 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gov-700">Error 404</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-600 mb-6">
          The requested portal resource does not exist or may have been moved to a new section.
        </p>
        <Link to="/">
          <Button variant="primary" className="inline-flex gap-2">
            <Home className="w-4 h-4" /> Return to Home
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
};
