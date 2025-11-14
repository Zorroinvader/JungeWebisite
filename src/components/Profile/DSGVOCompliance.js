import React, { useState } from 'react'
import { Download, Trash2, Edit, Shield, CheckCircle, AlertTriangle } from 'lucide-react'
import { dsgvoAPI } from '../../services/httpApi'

const DSGVOCompliance = ({ userId, userEmail }) => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const showMessage = (text, type = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const handleDataExport = async () => {
    if (!userId) {
      showMessage('User ID is required for data export', 'error')
      return
    }

    setLoading(true)
    try {
      const data = await dsgvoAPI.getUserDataExport(userId)
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showMessage('Your data has been exported successfully', 'success')
    } catch (error) {
      showMessage('Error exporting your data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDataUpdate = async () => {
    if (!userId) {
      showMessage('User ID is required for data update', 'error')
      return
    }

    const newEmail = prompt('Enter new email address (or leave empty to keep current):')
    const newName = prompt('Enter new full name (or leave empty to keep current):')

    if (!newEmail && !newName) {
      showMessage('No changes requested', 'info')
      return
    }

    setLoading(true)
    try {
      await dsgvoAPI.updateUserData(userId, newEmail || null, newName || null)
      showMessage('Your data has been updated successfully', 'success')
    } catch (error) {
      showMessage('Error updating your data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDataDeletion = async () => {
    if (!userId) {
      showMessage('User ID is required for data deletion', 'error')
      return
    }

    const confirmation = window.confirm(
      'Are you sure you want to delete all your data? This action cannot be undone and will permanently remove:\n\n' +
      '• Your profile information\n' +
      '• Event requests\n' +
      '• All associated data\n\n' +
      'Type "DELETE" to confirm:'
    )

    if (!confirmation) return

    const finalConfirmation = prompt('Type "DELETE" to confirm data deletion:')
    if (finalConfirmation !== 'DELETE') {
      showMessage('Data deletion cancelled', 'info')
      return
    }

    setLoading(true)
    try {
      await dsgvoAPI.deleteUserData(userId)
      showMessage('Your data has been deleted successfully. You will be logged out.', 'success')
      
      // Redirect to home page after successful deletion
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error) {
      showMessage('Error deleting your data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleConsentWithdrawal = async () => {
    if (!userId) {
      showMessage('User ID is required for consent withdrawal', 'error')
      return
    }

    const consentId = prompt('Enter consent ID to withdraw (or leave empty to cancel):')
    if (!consentId) return

    setLoading(true)
    try {
      await dsgvoAPI.withdrawConsent(consentId)
      showMessage('Consent has been withdrawn successfully', 'success')
    } catch (error) {
      showMessage('Error withdrawing consent. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-[#A58C81]" />
        <h2 className="text-2xl font-bold text-[#252422] dark:text-[#F4F1E8]">DSGVO Datenrechte</h2>
      </div>

      <div className="space-y-4">
        {/* Information */}
        <div className="p-4 bg-[#A58C81]/10 dark:bg-[#A58C81]/20 rounded-lg border border-[#A58C81]/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-[#A58C81] mt-0.5" />
            <div>
              <h3 className="font-medium text-[#252422] dark:text-[#F4F1E8] mb-1">Ihre Datenrechte</h3>
              <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">
                Unter DSGVO haben Sie das Recht auf Zugang, Berichtigung, Löschung und Portabilität Ihrer persönlichen Daten. 
                Sie können Ihre Einwilligung jederzeit widerrufen.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDataExport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-[#6054d9] text-white rounded-lg hover:bg-[#4f44c7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            {loading ? 'Exportiere...' : 'Meine Daten exportieren'}
          </button>

          <button
            onClick={handleDataUpdate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-[#A58C81] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Edit className="h-4 w-4" />
            {loading ? 'Aktualisiere...' : 'Meine Daten aktualisieren'}
          </button>

          <button
            onClick={handleConsentWithdrawal}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            {loading ? 'Verarbeite...' : 'Einwilligung widerrufen'}
          </button>

          <button
            onClick={handleDataDeletion}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? 'Lösche...' : 'Alle meine Daten löschen'}
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-3 rounded-lg ${
            messageType === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
            messageType === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          }`}>
            {message}
          </div>
        )}

        {/* Additional Information */}
        <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">
          <p className="mb-2">
            <strong className="text-[#252422] dark:text-[#F4F1E8]">Datenexport:</strong> Laden Sie eine vollständige Kopie aller Ihrer persönlichen Daten im JSON-Format herunter.
          </p>
          <p className="mb-2">
            <strong className="text-[#252422] dark:text-[#F4F1E8]">Datenaktualisierung:</strong> Fordern Sie Änderungen an Ihren persönlichen Informationen an.
          </p>
          <p className="mb-2">
            <strong className="text-[#252422] dark:text-[#F4F1E8]">Einwilligung widerrufen:</strong> Widerrufen Sie Ihre Einwilligung zur Datenverarbeitung.
          </p>
          <p>
            <strong className="text-[#252422] dark:text-[#F4F1E8]">Datenlöschung:</strong> Löschen Sie dauerhaft alle Ihre persönlichen Daten aus unseren Systemen.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DSGVOCompliance
