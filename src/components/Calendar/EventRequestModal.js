import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { eventRequestAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'
import { X, Calendar, MapPin, Clock, Users, FileText, AlertCircle, CheckCircle, Upload, XCircle } from 'lucide-react'
import eventBus from '../../utils/eventBus'

const EventRequestModal = ({ selectedDate, onClose, onSuccess }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    requester_name: '',
    requester_email: '',
    event_date: '',
    terms_accepted: false,
    youth_protection_accepted: false,
    is_private: false,
    hausordnung_accepted: false,
    mietvertrag_accepted: false
  })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Set default date if selectedDate is provided
  React.useEffect(() => {
    if (selectedDate?.start) {
      try {
        const dateObj = new Date(selectedDate.start)
        if (!isNaN(dateObj.getTime())) {
          const date = dateObj.toISOString().split('T')[0] // Get YYYY-MM-DD format
          setFormData(prev => ({ ...prev, event_date: date }))
        }
      } catch (error) {
        console.warn('Invalid selectedDate.start:', error)
      }
    }
  }, [selectedDate])

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Anmeldung erforderlich
          </h2>
          <p className="text-gray-600 mb-6">
            Sie müssen angemeldet sein, um Event-Anfragen zu stellen.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                onClose()
                window.location.href = '/login'
              }}
              className="flex-1 px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors duration-200"
            >
              Anmelden
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
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
      console.log('📁 File selected:', {
        name: file.name,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type
      })
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        setFileError('Bitte laden Sie nur PDF-Dateien hoch.')
        return
      }
      
      // Validate file size (max 5MB for better performance)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('Die Datei ist zu groß. Maximale Größe: 5MB für bessere Performance.')
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
    if (!formData.requester_email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
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
      setError('Bitte akzeptieren Sie den Mietvertrag')
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
    console.log('Event request form submitted:', formData)
    console.log('User ID:', user?.id)
    setLoading(true)
    setError('')

    if (!validateForm()) {
      console.log('Form validation failed')
      setLoading(false)
      return
    }

    try {
      // First, upload the file if present
      let uploadedFileUrl = null
      if (uploadedFile) {
        console.log('🔄 Starting file upload:', uploadedFile.name)
        setUploading(true)
        setUploadProgress('Vorbereitung...')
        
        const formData = new FormData()
        formData.append('file', uploadedFile)
        formData.append('folder', 'mietvertraege')
        
        setUploadProgress('Lade Datei zu Supabase hoch...')
        console.log('🔄 Uploading to Supabase Storage...')
        console.log('📊 Upload details:', {
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          fileSizeMB: (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB',
          uploadPath: `mietvertraege/${user.id}_${Date.now()}_${uploadedFile.name}`
        })
        
        // Try Supabase Storage first, fallback to database storage
        console.log('🚀 Attempting Supabase Storage upload...')
        
        try {
          const uploadStartTime = Date.now()
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(`mietvertraege/${user.id}_${Date.now()}_${uploadedFile.name}`, uploadedFile)
          
          const uploadEndTime = Date.now()
          const uploadDuration = uploadEndTime - uploadStartTime
          console.log(`⏱️ Storage upload completed in ${uploadDuration}ms`)
          
          if (uploadError) {
            throw uploadError
          }
          
          setUploadProgress('Erstelle öffentliche URL...')
          console.log('✅ File uploaded to storage, getting public URL...')
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(uploadData.path)
          
          uploadedFileUrl = urlData.publicUrl
          console.log('✅ Storage upload successful:', uploadedFileUrl)
          
        } catch (storageError) {
          console.warn('⚠️ Storage upload failed, falling back to database storage:', storageError.message)
          
          setUploadProgress('Konvertiere Datei für Datenbank...')
          console.log('🔄 Converting file to base64 for database storage...')
          
          // Fallback: Convert file to base64 for database storage
          const arrayBuffer = await uploadedFile.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          const base64String = btoa(String.fromCharCode(...uint8Array))
          
          console.log(`✅ Base64 conversion complete (${base64String.length} chars)`)
          
          // Store file data in the request data instead of separate storage
          uploadedFileUrl = 'database_stored' // Flag to indicate file is stored in database
          
          // Add file data to request data
          requestData.uploaded_file_name = uploadedFile.name
          requestData.uploaded_file_size = uploadedFile.size
          requestData.uploaded_file_type = uploadedFile.type
          requestData.uploaded_file_data = base64String
          
          setUploadProgress('Datei für Datenbank vorbereitet!')
          console.log('✅ File prepared for database storage')
        }
        setUploadProgress('Datei erfolgreich hochgeladen!')
        
        // Small delay to show success message
        await new Promise(resolve => setTimeout(resolve, 1000))
        setUploading(false)
        setUploadProgress('')
      }

      const requestData = {
        title: formData.title,
        description: `Anfrage von ${formData.requester_name} (${formData.requester_email})`,
        start_date: formData.event_date + 'T10:00:00.000Z', // Set default time to 10:00 AM
        end_date: formData.event_date + 'T18:00:00.000Z', // Set default end time to 6:00 PM
        requested_by: user.id,
        status: 'pending',
        is_private: formData.is_private || false,
        hausordnung_accepted: formData.hausordnung_accepted,
        mietvertrag_accepted: formData.mietvertrag_accepted,
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        uploaded_mietvertrag_url: uploadedFileUrl
      }

      console.log('Sending event request:', requestData)
      const { data, error } = await eventRequestAPI.createEventRequest(requestData)
      console.log('Event request response:', { data, error })
      
      if (error) {
        console.error('Event request error:', error)
        if (error.message && error.message.includes('foreign key constraint')) {
          setError('Sie müssen zuerst ein Profil erstellen. Bitte melden Sie sich ab und wieder an.')
        } else {
          setError(error.message || 'Fehler beim Erstellen der Event-Anfrage')
        }
      } else {
        console.log('Event request successful:', data)
        setSuccess(true)
        
        // Emit event to notify other components
        eventBus.emit('eventRequestCreated', data)
        
        setTimeout(() => {
          onSuccess?.(data)
          onClose()
        }, 3000) // Show success for 3 seconds
      }
    } catch (err) {
      console.error('Event request error:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-8 shadow-xl border-2 border-green-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ✅ Event-Anfrage erfolgreich gesendet!
            </h3>
            <p className="text-base text-gray-700 mb-4">
              Ihre Event-Anfrage wurde erfolgreich übermittelt und wird von einem Administrator überprüft.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-sm text-green-800 font-medium">
                📋 Status: Wartend auf Genehmigung
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Das Formular schließt sich automatisch in 3 Sekunden...
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Event anfragen
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event-Name *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="z.B. Team-Meeting, Workshop, etc."
              />
            </div>

            {/* Requester Name */}
            <div>
              <label htmlFor="requester_name" className="block text-sm font-medium text-gray-700 mb-2">
                Name der buchhenden Person *
              </label>
              <input
                type="text"
                id="requester_name"
                name="requester_name"
                value={formData.requester_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ihr vollständiger Name"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="requester_email" className="block text-sm font-medium text-gray-700 mb-2">
                Kontakt-E-Mail-Adresse *
              </label>
              <input
                type="email"
                id="requester_email"
                name="requester_email"
                value={formData.requester_email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="ihre@email.de"
              />
            </div>

            {/* Event Date */}
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                An welchem Tag soll das Event stattfinden? *
              </label>
              <input
                type="date"
                id="event_date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wählen Sie das Datum für Ihr Event aus (bis zu 1 Jahr im Voraus)
              </p>
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sichtbarkeit des Events
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="public_event"
                    name="is_private"
                    value="false"
                    checked={formData.is_private === false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.value === 'true' }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="public_event" className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Öffentlich</span> - Das Event ist für alle Benutzer sichtbar
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="private_event"
                    name="is_private"
                    value="true"
                    checked={formData.is_private === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.value === 'true' }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="private_event" className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Privat</span> - Das Event ist nur für Administratoren sichtbar
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sie können die Sichtbarkeit später nicht mehr ändern. Administratoren können das Event bei der Genehmigung anpassen.
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="hausordnung_accepted"
                  name="hausordnung_accepted"
                  checked={formData.hausordnung_accepted}
                  onChange={handleChange}
                  required
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hausordnung_accepted" className="ml-3 text-sm text-gray-700">
                  Ich habe die{' '}
                  <a href="/assets/Junge_Geseltschaft_Hausordnung.pdf" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500 underline font-medium">
                    Hausordnung
                  </a>{' '}
                  gelesen und akzeptiert *
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="mietvertrag_accepted"
                  name="mietvertrag_accepted"
                  checked={formData.mietvertrag_accepted}
                  onChange={handleChange}
                  required
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="mietvertrag_accepted" className="ml-3 text-sm text-gray-700">
                  Ich habe den{' '}
                  <a href="/assets/Junge_Geseltschaft_Mietvertrag.pdf" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500 underline font-medium">
                    Mietvertrag
                  </a>{' '}
                  gelesen und akzeptiert *
                </label>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="inline h-4 w-4 mr-1" />
                  Ausgefüllten Mietvertrag hochladen *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors duration-200">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Datei auswählen</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">oder per Drag & Drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF bis zu 10MB</p>
                  </div>
                </div>
                
                {uploadedFile && !uploading && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Datei ausgewählt: {uploadedFile.name}</span>
                  </div>
                )}
                
                {uploading && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Lade Datei hoch...</span>
                    </div>
                    {uploadProgress && (
                      <div className="text-xs text-gray-600">
                        {uploadProgress}
                      </div>
                    )}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                )}
                
                {fileError && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Lade hoch...</span>
                  </div>
                ) : loading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Erstelle Anfrage...</span>
                  </div>
                ) : (
                  'Event anfragen'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EventRequestModal
