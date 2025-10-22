import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, Clock, Users, Database, Eye, Trash2, Download } from 'lucide-react'
import { securityAPI, dsgvoAPI } from '../../services/httpApi'

const SecurityDashboard = () => {
  const [securityMetrics, setSecurityMetrics] = useState({
    suspiciousActivities: 0,
    rateLimitViolations: 0,
    sqlInjectionAttempts: 0,
    failedLogins: 0,
    activeUsers: 0,
    dataRetentionAlerts: 0
  })
  
  const [recentActivities, setRecentActivities] = useState([])
  const [dsgvoRequests, setDsgvoRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSecurityData()
    const interval = setInterval(loadSecurityData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSecurityData = async () => {
    try {
      // Load security metrics
      const activities = await securityAPI.logSuspiciousActivity('dashboard_load', 'Security dashboard loaded', 'low')
      
      // Simulate loading security data (replace with actual API calls)
      setSecurityMetrics({
        suspiciousActivities: Math.floor(Math.random() * 10),
        rateLimitViolations: Math.floor(Math.random() * 5),
        sqlInjectionAttempts: Math.floor(Math.random() * 3),
        failedLogins: Math.floor(Math.random() * 8),
        activeUsers: Math.floor(Math.random() * 50) + 20,
        dataRetentionAlerts: Math.floor(Math.random() * 2)
      })

      // Load recent activities
      setRecentActivities([
        {
          id: 1,
          type: 'login_success',
          description: 'User logged in successfully',
          severity: 'low',
          timestamp: new Date().toISOString(),
          user: 'user@example.com'
        },
        {
          id: 2,
          type: 'rate_limit_exceeded',
          description: 'Rate limit exceeded for event requests',
          severity: 'medium',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          user: 'user2@example.com'
        },
        {
          id: 3,
          type: 'data_export_request',
          description: 'User requested data export',
          severity: 'low',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          user: 'user3@example.com'
        }
      ])

      setLoading(false)
    } catch (error) {
      console.error('Error loading security data:', error)
      setLoading(false)
    }
  }

  const handleDataExport = async (userId) => {
    try {
      const data = await dsgvoAPI.getUserDataExport(userId)
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-export-${userId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting user data:', error)
    }
  }

  const handleDataDeletion = async (userId) => {
    if (window.confirm('Are you sure you want to delete all data for this user? This action cannot be undone.')) {
      try {
        await dsgvoAPI.deleteUserData(userId)
        alert('User data deleted successfully')
        loadSecurityData()
      } catch (error) {
        console.error('Error deleting user data:', error)
        alert('Error deleting user data')
      }
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#252422] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#A58C81] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading security dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#252422] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-[#A58C81]" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor security events, DSGVO compliance, and system health
          </p>
        </div>

        {/* Security Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspicious Activities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{securityMetrics.suspiciousActivities}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rate Limit Violations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{securityMetrics.rateLimitViolations}</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SQL Injection Attempts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{securityMetrics.sqlInjectionAttempts}</p>
              </div>
              <Database className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Logins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{securityMetrics.failedLogins}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{securityMetrics.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Retention Alerts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{securityMetrics.dataRetentionAlerts}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Security Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                    {activity.severity}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DSGVO Compliance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">DSGVO Compliance</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-400">Data Protection Active</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All user data is encrypted and protected according to DSGVO requirements.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-400">User Rights</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Users can request data export, rectification, and deletion.
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800 dark:text-purple-400">Consent Management</span>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  All consent is tracked with timestamps and can be withdrawn.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleDataExport('test-user')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export User Data
            </button>
            <button
              onClick={() => handleDataDeletion('test-user')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete User Data
            </button>
            <button
              onClick={loadSecurityData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityDashboard
