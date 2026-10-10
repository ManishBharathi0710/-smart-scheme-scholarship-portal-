import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { SingleConditionEvaluation } from '../../../types/recommendation';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui';

interface MatchExplanationProps {
  matchedConditions?: SingleConditionEvaluation[];
  failedConditions?: SingleConditionEvaluation[];
  unknownConditions?: SingleConditionEvaluation[];
  explanation?: {
    summary?: string;
    matched?: string[];
    failed?: string[];
    unknown?: string[];
    conditions?: SingleConditionEvaluation[];
    matchedConditions?: SingleConditionEvaluation[];
    failedConditions?: SingleConditionEvaluation[];
    unknownConditions?: SingleConditionEvaluation[];
  };
}

export const MatchExplanation: React.FC<MatchExplanationProps> = ({
  matchedConditions: propMatched = [],
  failedConditions: propFailed = [],
  unknownConditions: propUnknown = [],
  explanation,
}) => {
  // Derive lists from explanation object if provided
  let matched = [...propMatched];
  let failed = [...propFailed];
  let unknown = [...propUnknown];

  if (explanation) {
    if (explanation.matchedConditions) {
      matched = explanation.matchedConditions;
    } else if (explanation.conditions) {
      matched = explanation.conditions.filter((c) => c.result === 'MATCH');
    } else if (explanation.matched) {
      matched = explanation.matched.map((text) => ({
        field: 'criterion',
        fieldLabel: 'Eligibility Requirement',
        operator: 'EQUALS',
        requiredValue: 'Met',
        actualValue: 'Satisfied',
        result: 'MATCH',
        mandatory: true,
        explanation: text,
        description: text,
      }));
    }

    if (explanation.failedConditions) {
      failed = explanation.failedConditions;
    } else if (explanation.conditions) {
      failed = explanation.conditions.filter((c) => c.result === 'FAIL');
    } else if (explanation.failed) {
      failed = explanation.failed.map((text) => ({
        field: 'criterion',
        fieldLabel: 'Eligibility Requirement',
        operator: 'EQUALS',
        requiredValue: 'Met',
        actualValue: 'Not Met',
        result: 'FAIL',
        mandatory: true,
        explanation: text,
        description: text,
      }));
    }

    if (explanation.unknownConditions) {
      unknown = explanation.unknownConditions;
    } else if (explanation.conditions) {
      unknown = explanation.conditions.filter((c) => c.result === 'UNKNOWN');
    } else if (explanation.unknown) {
      unknown = explanation.unknown.map((text) => ({
        field: 'criterion',
        fieldLabel: 'Information Required',
        operator: 'EQUALS',
        requiredValue: 'Required',
        actualValue: null,
        result: 'UNKNOWN',
        mandatory: true,
        explanation: text,
        description: text,
      }));
    }
  }

  return (
    <div className="space-y-6" data-testid="match-explanation-container">
      {/* 1. Failed Conditions (if any) */}
      {failed.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/20 shadow-sm">
          <CardHeader className="pb-3 border-b border-rose-100/80">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <CardTitle className="text-sm font-bold text-rose-900">
                Criteria Not Satisfied ({failed.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs text-rose-700">
              Your profile currently does not meet the following statutory requirements. These are mandatory conditions prescribed by the department.
            </p>
            <ul className="space-y-2.5">
              {failed.map((cond, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-rose-950">{cond.fieldLabel || cond.field}</span>
                    {cond.mandatory && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 font-medium">{cond.explanation}</p>
                  <div className="pt-1.5 border-t border-rose-50 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Required:{' '}
                      <strong className="text-slate-800 font-mono">
                        {String(cond.requiredValue)}
                      </strong>
                    </span>
                    <span>
                      Your Profile:{' '}
                      <strong className="text-rose-700 font-mono">
                        {cond.actualValue !== null && cond.actualValue !== undefined
                          ? String(cond.actualValue)
                          : 'Not Provided'}
                      </strong>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 2. Criteria Requiring Verification / Unknowns */}
      {unknown.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
          <CardHeader className="pb-3 border-b border-amber-100/80">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-sm font-bold text-amber-900">
                Criteria Requiring Confirmation ({unknown.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs text-amber-800">
              The engine could not determine eligibility for these criteria because the relevant information is not currently recorded in your profile.
            </p>
            <ul className="space-y-2.5">
              {unknown.map((cond, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900">{cond.fieldLabel || cond.field}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      Needs Verification
                    </span>
                  </div>
                  <p className="text-slate-600">{cond.explanation}</p>
                  {cond.description && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Statutory rule: {cond.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 3. Matched Conditions */}
      {matched.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm">
          <CardHeader className="pb-3 border-b border-emerald-100/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-sm font-bold text-emerald-900">
                Satisfied Statutory Criteria ({matched.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            <ul className="space-y-2">
              {matched.map((cond, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-emerald-100 flex items-start gap-2.5 text-xs shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{cond.fieldLabel || cond.field}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Satisfied
                      </span>
                    </div>
                    <p className="text-slate-600">{cond.explanation}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {matched.length === 0 && failed.length === 0 && unknown.length === 0 && (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" />
          <span>No statutory eligibility rules were evaluated for this general welfare scheme.</span>
        </div>
      )}
    </div>
  );
};
