// Security Monitoring Configuration
// This file configures monitoring dashboards and alerts for the security system

export const SECURITY_MONITORING_CONFIG = {
  // Dashboard refresh intervals (in milliseconds)
  refreshIntervals: {
    securityMetrics: 30000,    // 30 seconds
    recentActivities: 60000,   // 1 minute
    dsgvoRequests: 300000,     // 5 minutes
    systemHealth: 120000       // 2 minutes
  },

  // Alert thresholds
  thresholds: {
    suspiciousActivities: {
      warning: 5,
      critical: 10
    },
    rateLimitViolations: {
      warning: 3,
      critical: 8
    },
    sqlInjectionAttempts: {
      warning: 1,
      critical: 3
    },
    failedLogins: {
      warning: 5,
      critical: 15
    },
    dataRetentionAlerts: {
      warning: 1,
      critical: 3
    }
  },

  // Security event types to monitor
  eventTypes: {
    suspicious: [
      'sql_injection_attempt',
      'rate_limit_exceeded',
      'failed_login',
      'unauthorized_access',
      'data_breach_attempt'
    ],
    dsgvo: [
      'data_export_request',
      'data_deletion_request',
      'consent_withdrawal',
      'data_rectification_request'
    ],
    system: [
      'high_cpu_usage',
      'memory_leak',
      'database_connection_error',
      'api_rate_limit_hit'
    ]
  },

  // Dashboard widgets configuration
  widgets: {
    securityMetrics: {
      enabled: true,
      position: 'top',
      size: 'large'
    },
    recentActivities: {
      enabled: true,
      position: 'left',
      size: 'medium',
      maxItems: 10
    },
    dsgvoCompliance: {
      enabled: true,
      position: 'right',
      size: 'medium'
    },
    systemHealth: {
      enabled: true,
      position: 'bottom',
      size: 'large'
    }
  },

  // Notification settings
  notifications: {
    enabled: true,
    channels: ['email', 'dashboard'],
    severityLevels: ['low', 'medium', 'high', 'critical'],
    emailRecipients: [
      'admin@junge-gesellschaft.de',
      'security@junge-gesellschaft.de'
    ]
  },

  // Data retention settings
  dataRetention: {
    securityLogs: {
      retentionDays: 90,
      archiveAfterDays: 30
    },
    userData: {
      retentionDays: 2555, // 7 years
      anonymizeAfterDays: 1095 // 3 years
    },
    auditLogs: {
      retentionDays: 2555, // 7 years
      archiveAfterDays: 365 // 1 year
    }
  },

  // Rate limiting configuration
  rateLimiting: {
    endpoints: {
      'event_request_create': {
        maxRequests: 5,
        windowMinutes: 60
      },
      'user_login': {
        maxRequests: 10,
        windowMinutes: 15
      },
      'data_export': {
        maxRequests: 3,
        windowMinutes: 60
      },
      'api_general': {
        maxRequests: 100,
        windowMinutes: 60
      }
    }
  },

  // Security headers configuration
  securityHeaders: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://*.supabase.co;",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

// Helper functions for monitoring
export const MonitoringHelpers = {
  // Check if a metric exceeds threshold
  exceedsThreshold: (value, threshold) => {
    return value >= threshold
  },

  // Get severity level based on value and thresholds
  getSeverityLevel: (value, thresholds) => {
    if (value >= thresholds.critical) return 'critical'
    if (value >= thresholds.warning) return 'warning'
    return 'normal'
  },

  // Format timestamp for display
  formatTimestamp: (timestamp) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },

  // Generate alert message
  generateAlertMessage: (type, value, threshold) => {
    const messages = {
      suspiciousActivities: `Suspicious activities detected: ${value} (threshold: ${threshold})`,
      rateLimitViolations: `Rate limit violations: ${value} (threshold: ${threshold})`,
      sqlInjectionAttempts: `SQL injection attempts detected: ${value} (threshold: ${threshold})`,
      failedLogins: `Failed login attempts: ${value} (threshold: ${threshold})`,
      dataRetentionAlerts: `Data retention alerts: ${value} (threshold: ${threshold})`
    }
    return messages[type] || `Alert: ${type} = ${value}`
  },

  // Calculate uptime percentage
  calculateUptime: (uptimeSeconds) => {
    const totalSeconds = 30 * 24 * 60 * 60 // 30 days
    return ((totalSeconds - uptimeSeconds) / totalSeconds * 100).toFixed(2)
  }
}

export default SECURITY_MONITORING_CONFIG
