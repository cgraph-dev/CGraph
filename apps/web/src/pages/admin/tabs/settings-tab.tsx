/**
 * Admin settings tab component.
 * @module
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { adminApi } from '@/modules/admin/api';
import { LoadingState, SettingToggle, SettingNumber } from '@/modules/admin/components';

// ============================================================================
// Settings Tab - System configuration management
// ============================================================================

export function SettingsTab() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['admin', 'config'],
    queryFn: () => adminApi.getConfig(),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => adminApi.updateConfig(updates),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          System Configuration
        </h2>

        <div className="space-y-6">
          <SettingToggle
            label="Registration Enabled"
            description="Allow new users to register"
            value={config?.registrationEnabled ?? true}
            onChange={(value) => updateConfigMutation.mutate({ registrationEnabled: value })}
          />

          <SettingToggle
            label="Email Verification Required"
            description="Require email verification for new accounts"
            value={config?.emailVerificationRequired ?? true}
            onChange={(value) => updateConfigMutation.mutate({ emailVerificationRequired: value })}
          />

          <SettingToggle
            label="Maintenance Mode"
            description="Put the application in maintenance mode"
            value={config?.maintenanceMode ?? false}
            onChange={(value) => updateConfigMutation.mutate({ maintenanceMode: value })}
          />

          <SettingNumber
            label="Max Message Length"
            description="Maximum characters per message"
            value={config?.maxMessageLength ?? 4000}
            onChange={(value) => updateConfigMutation.mutate({ maxMessageLength: value })}
          />

          <SettingNumber
            label="Max File Upload Size (MB)"
            description="Maximum file upload size in megabytes"
            value={config?.maxFileUploadMb ?? 50}
            onChange={(value) => updateConfigMutation.mutate({ maxFileUploadMb: value })}
          />
        </div>
      </div>
    </motion.div>
  );
}
