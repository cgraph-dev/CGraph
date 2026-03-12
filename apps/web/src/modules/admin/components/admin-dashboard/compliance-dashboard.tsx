/**
 * Compliance Dashboard Panel
 *
 * Displays compliance status across SOC2, GDPR, and HIPAA frameworks.
 * Allows running audits and viewing check results.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { complianceApi } from '../../api/enterprise-api';
import type { ComplianceStatus, ComplianceReport } from '../../api/enterprise-types';

const FRAMEWORK_INFO: Record<string, { label: string; icon: string; description: string }> = {
  soc2: { label: 'SOC 2', icon: '🛡️', description: 'Service Organization Control 2' },
  gdpr: { label: 'GDPR', icon: '🇪🇺', description: 'General Data Protection Regulation' },
  hipaa: {
    label: 'HIPAA',
    icon: '🏥',
    description: 'Health Insurance Portability and Accountability',
  },
};

function ScoreBadge({ score }: { score: number }): React.ReactElement {
  const color =
    score >= 80
      ? 'text-green-400 bg-green-500/20'
      : score >= 60
        ? 'text-yellow-400 bg-yellow-500/20'
        : 'text-red-400 bg-red-500/20';

  return <span className={`rounded-full px-3 py-1 text-sm font-bold ${color}`}>{score}%</span>;
}

/** Displays SOC2, GDPR, and HIPAA compliance status with audit trigger support. */
export function ComplianceDashboard(): React.ReactElement {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [activeReport, setActiveReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);

  // In a real implementation, this comes from selected org
  const orgId = 'current';

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await complianceApi.getStatus(orgId);
      setStatus(result);
    } catch {
      // Error handled by API layer
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const runAudit = useCallback(
    async (framework: string) => {
      setAuditing(true);
      try {
        const report = await complianceApi.runAudit(orgId, framework);
        setActiveReport(report);
        void fetchStatus(); // Refresh overall status
      } catch {
        // Error handled by API layer
      } finally {
        setAuditing(false);
      }
    },
    [orgId, fetchStatus]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      key="compliance"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance</h1>
          <p className="mt-1 text-sm text-gray-400">
            Regulatory framework compliance status and auditing
          </p>
        </div>
        {status && (
          <div className="text-right">
            <p className="text-sm text-gray-400">Overall Score</p>
            <p className="text-3xl font-bold text-white">{status.overallScore}%</p>
          </div>
        )}
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {status?.frameworks.map((fw) => {
          const info = FRAMEWORK_INFO[fw.framework] || {
            label: fw.framework,
            icon: '📋',
            description: '',
          };
          return (
            <div key={fw.framework} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{info.icon}</span>
                <ScoreBadge score={fw.score} />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{info.label}</h3>
              <p className="mt-1 text-sm text-gray-400">{info.description}</p>
              <button
                onClick={() => runAudit(fw.framework)}
                disabled={auditing}
                className="mt-4 w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                {auditing ? 'Running...' : 'Run Audit'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Report */}
      {activeReport && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {FRAMEWORK_INFO[activeReport.framework]?.label || activeReport.framework} Audit Report
            </h3>
            <ScoreBadge score={activeReport.score} />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Generated {new Date(activeReport.generatedAt).toLocaleString()}
          </p>
          <div className="mt-4 space-y-2">
            {activeReport.checks.map((check, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{check.name}</p>
                  <p className="text-xs text-gray-500">{check.description}</p>
                </div>
                <span
                  className={`text-sm font-medium ${check.passed ? 'text-green-400' : 'text-red-400'}`}
                >
                  {check.passed ? '✓ Pass' : '✕ Fail'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
