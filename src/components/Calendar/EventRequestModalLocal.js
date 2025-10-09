import React, { useState } from 'react'
import { X, Upload, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const EventRequestModalLocal = ({ isOpen, onClose, selectedDate }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    requester_name: '',
    requester_email: '',
    event_date: selectedDate || '',
    is_private: false,
    hausordnung_accepted: false,
    mietvertrag_accepted: false
  })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (error) setError('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFileError('')
    
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setFileError('Bitte laden Sie nur PDF-Dateien hoch.')
        return
      }
      
      // Validate file size (max 500KB for local storage)
      if (file.size > 500 * 1024) {
        setFileError('Die Datei ist zu groß. Maximale Größe: 500KB für lokale Speicherung.')
        return
      }
      
      setUploadedFile(file)
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Bitte geben Sie einen Event-Namen ein')
      return false
    }
    if (!formData.requester_name.trim()) {
      setError('Bitte geben Sie Ihren Namen ein')
      return false
    }
    if (!formData.requester_email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein')
      return false
    }
    if (!formData.event_date) {
      setError('Bitte wählen Sie ein Datum aus')
      return false
    }
    if (!formData.hausordnung_accepted) {
      setError('Bitte akzeptieren Sie die Hausordnung')
      return false
    }
    if (!formData.mietvertrag_accepted) {
      setError('Bitte akzeptieren Sie die Nutzungsvereinbarung')
      return false
    }
    if (!uploadedFile) {
      setError('Bitte laden Sie den ausgefüllten Mietvertrag hoch')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setError('Bitte melden Sie sich an, um eine Event-Anfrage zu stellen')
      return
    }

    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      console.log('Event request form submitted:', formData)

      // Convert file to base64 for local storage
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const base64String = btoa(String.fromCharCode(...uint8Array))

      const requestData = {
        id: `local_${Date.now()}`,
        title: formData.title,
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        event_date: formData.event_date,
        is_private: formData.is_private,
        hausordnung_accepted: formData.hausordnung_accepted,
        mietvertrag_accepted: formData.mietvertrag_accepted,
        uploaded_file_name: uploadedFile.name,
        uploaded_file_size: uploadedFile.size,
        uploaded_file_type: uploadedFile.type,
        uploaded_file_data: base64String,
        requested_by: user.id,
        requested_by_email: user.email,
        status: 'pending',
        created_at: new Date().toISOString(),
        saved_locally: true
      }

      console.log('Request data:', requestData)

      // Save to localStorage
      const existingRequests = JSON.parse(localStorage.getItem('event_requests') || '[]')
      existingRequests.push(requestData)
      localStorage.setItem('event_requests', JSON.stringify(existingRequests))
      
      console.log('✅ Event request saved locally:', requestData)
      setSuccess(true)

      // Show success and close after delay
      setTimeout(() => {
        setLoading(false)
        onClose()
        // Reset form
        setFormData({
          title: '',
          requester_name: '',
          requester_email: '',
          event_date: selectedDate || '',
          is_private: false,
          hausordnung_accepted: false,
          mietvertrag_accepted: false
        })
        setUploadedFile(null)
        setSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Event request error:', error)
      setError(`Fehler: ${error.message}`)
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Event anfragen (Lokal gespeichert)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-sm text-green-800">✅ Event-Anfrage erfolgreich lokal gespeichert!</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> Diese Anfrage wird lokal in Ihrem Browser gespeichert, da die Datenbankverbindung nicht verfügbar ist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event-Name *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Geburtstagsfeier"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name der buchhenden Person *
              </label>
              <input
                type="text"
                name="requester_name"
                value={formData.requester_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ihr vollständiger Name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kontaktemailadresse *
            </label>
            <input
              type="email"
              name="requester_email"
              value={formData.requester_email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ihre.email@beispiel.de"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum *
            </label>
            <input
              type="date"
              name="event_date"
              value={formData.event_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_private"
                name="is_private"
                checked={formData.is_private}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_private" className="ml-2 block text-sm text-gray-700">
                Privates Event (nur für Admin sichtbar)
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="hausordnung_accepted"
                name="hausordnung_accepted"
                checked={formData.hausordnung_accepted}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                required
              />
              <label htmlFor="hausordnung_accepted" className="ml-2 block text-sm text-gray-700">
                Ich habe die <a href="/assets/Junge_Geseltschaft_Hausordnung.pdf" target="_blank" className="text-blue-600 hover:underline">Hausordnung</a> gelesen und akzeptiert *
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="mietvertrag_accepted"
                name="mietvertrag_accepted"
                checked={formData.mietvertrag_accepted}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                required
              />
              <label htmlFor="mietvertrag_accepted" className="ml-2 block text-sm text-gray-700">
                Ich habe die <a href="/assets/Junge_Geseltschaft_Mietvertrag.pdf" target="_blank" className="text-blue-600 hover:underline">Nutzungsvereinbarung</a> gelesen und akzeptiert *
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ausgefüllter Mietvertrag hochladen *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>PDF-Datei auswählen</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                      required
                    />
                  </label>
                  <p className="pl-1">oder per Drag & Drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF bis zu 500KB</p>
                {fileError && (
                  <p className="text-xs text-red-500">{fileError}</p>
                )}
                {uploadedFile && (
                  <p className="text-xs text-green-600">
                    Datei ausgewählt: {uploadedFile.name} ({uploadedFile.size > 1024 ? (uploadedFile.size / 1024).toFixed(1) + ' KB' : uploadedFile.size + ' B'})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Speichere lokal...
                </>
              ) : (
                'Event anfragen (Lokal)'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventRequestModalLocal
