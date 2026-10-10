import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight, UserCheck } from 'lucide-react';
import { MissingInformationItem } from '../../../types/recommendation';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';

interface MissingInformationCardProps {
  missingItems?: MissingInformationItem[];
  missingInformation?: MissingInformationItem[];
}

export const MissingInformationCard: React.FC<MissingInformationCardProps> = ({
  missingItems,
  missingInformation,
}) => {
  const items = missingItems || missingInformation || [];
  if (items.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/30 shadow-sm" data-testid="missing-information-card">
      <CardHeader className="pb-3 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <CardTitle className="text-sm font-bold text-amber-950">
              Complete Profile to Resolve Uncertain Criteria
            </CardTitle>
            <p className="text-xs text-amber-800 mt-0.5">
              The following {items.length} profile attribute(s) are required by this scheme. Updating them will allow the engine to evaluate your eligibility definitively.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-white rounded-md border border-amber-200/80 flex items-start gap-2 text-xs"
            >
              <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">{item.label}</span>
                <span className="text-[11px] text-slate-500">{item.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <Link to="/profile">
            <Button variant="primary" className="text-xs bg-gov-900 hover:bg-gov-800 text-white">
              <span>Update Profile Attributes</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
