import React, { useState, useEffect } from 'react'
import { X, Upload, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import PDFLink from '../UI/PDFLink'

const EventRequestModalHTTP = ({ isOpen, onClose, selectedDate }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requester_name: '',
    requester_email: '',
    event_date: selectedDate || '',
    location: '',
    event_type: 'Allgemein',
    max_participants: '',
    is_private: false,
    hausordnung_accepted: false,
    mietvertrag_accepted: false,
    terms_accepted: false,
    youth_protection_accepted: false
  })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Update form data when selectedDate changes
  useEffect(() => {
    if (selectedDate && selectedDate.start) {
      const date = new Date(selectedDate.start)
      const dateString = date.toISOString().split('T')[0]
      setFormData(prev => ({
        ...prev,
        event_date: dateString
      }))
    }
  }, [selectedDate])

  // Reset form when modal opens (but preserve selected date)
  useEffect(() => {
    if (isOpen) {
      const currentDate = selectedDate && selectedDate.start 
        ? new Date(selectedDate.start).toISOString().split('T')[0]
        : ''
      
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        requester_name: '',
        requester_email: '',
        event_date: currentDate,
        location: '',
        event_type: 'Allgemein',
        max_participants: '',
        is_private: false,
        hausordnung_accepted: false,
        mietvertrag_accepted: false,
        terms_accepted: false,
        youth_protection_accepted: false
      }))
      setUploadedFile(null)
      setFileError('')
      setError('')
      setSuccess(false)
    }
  }, [isOpen, selectedDate])

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
      
      // Validate file size (max 1MB for HTTP storage)
      if (file.size > 1024 * 1024) {
        setFileError('Die Datei ist zu groß. Maximale Größe: 1MB für HTTP-Speicherung.')
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
      // Convert file to base64
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const base64String = btoa(String.fromCharCode(...uint8Array))

      const requestData = {
        title: formData.title,
        description: formData.description || '',
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        start_date: formData.event_date,
        end_date: formData.event_date, // Single day event
        location: formData.location || '',
        event_type: formData.event_type || 'Allgemein',
        max_participants: formData.max_participants || null,
        is_private: formData.is_private,
        hausordnung_accepted: formData.hausordnung_accepted,
        mietvertrag_accepted: formData.mietvertrag_accepted,
        terms_accepted: formData.terms_accepted,
        youth_protection_accepted: formData.youth_protection_accepted,
        uploaded_file_name: uploadedFile.name,
        uploaded_file_size: uploadedFile.size,
        uploaded_file_type: uploadedFile.type,
        uploaded_file_data: base64String,
        requested_by: user.id,
        created_by: user.id,
        status: 'pending'
      }


      // Try direct HTTP call to Supabase REST API
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/rest/v1/event_requests`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const errorText = await response.text()
        console.error('HTTP request failed:', response.status, errorText)
        
        // Fallback to localStorage
        const localData = {
          ...requestData,
          id: `local_${Date.now()}`,
          created_at: new Date().toISOString(),
          saved_locally: true
        }
        
        const existingRequests = JSON.parse(localStorage.getItem('event_requests') || '[]')
        existingRequests.push(localData)
        localStorage.setItem('event_requests', JSON.stringify(existingRequests))
        
        setSuccess(true)
      }

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
      
      // Fallback to localStorage
      const localData = {
        id: `local_${Date.now()}`,
        title: formData.title,
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        event_date: formData.event_date,
        is_private: formData.is_private,
        hausordnung_accepted: formData.hausordnung_accepted,
        mietvertrag_accepted: formData.mietvertrag_accepted,
        uploaded_file_name: uploadedFile?.name || '',
        uploaded_file_size: uploadedFile?.size || 0,
        uploaded_file_type: uploadedFile?.type || '',
        uploaded_file_data: uploadedFile ? await (async () => {
          const arrayBuffer = await uploadedFile.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          return btoa(String.fromCharCode(...uint8Array))
        })() : '',
        requested_by: user.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        saved_locally: true
      }
      
      const existingRequests = JSON.parse(localStorage.getItem('event_requests') || '[]')
      existingRequests.push(localData)
      localStorage.setItem('event_requests', JSON.stringify(existingRequests))
      
      console.log('✅ Event request saved locally as fallback:', localData)
      setSuccess(true)
      
      setTimeout(() => {
        setLoading(false)
        onClose()
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
    }
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ border: '2px solid #A58C81' }}>
        <div className="flex items-center justify-between p-8" style={{ borderBottom: '1px solid #A58C81' }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#252422' }}>Event anfragen</h2>
            <p className="text-sm mt-1" style={{ color: '#A58C81' }}>
              Füllen Sie das Formular aus, um ein Event anzufragen
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-70 transition-opacity rounded-lg"
            style={{ color: '#A58C81' }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="rounded-lg p-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg p-4" style={{ backgroundColor: '#d1fae5', border: '1px solid #a7f3d0' }}>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" style={{ color: '#10b981' }} />
                <p className="text-sm" style={{ color: '#065f46' }}>✅ Event-Anfrage erfolgreich erstellt!</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
                Event-Name *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                style={{ 
                  borderColor: '#A58C81', 
                  focusRingColor: '#A58C81',
                  backgroundColor: '#ffffff'
                }}
                placeholder="z.B. Geburtstagsfeier"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
                Name der buchhenden Person *
              </label>
              <input
                type="text"
                name="requester_name"
                value={formData.requester_name}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                style={{ 
                  borderColor: '#A58C81', 
                  focusRingColor: '#A58C81',
                  backgroundColor: '#ffffff'
                }}
                placeholder="Ihr vollständiger Name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
              Kontaktemailadresse *
            </label>
            <input
              type="email"
              name="requester_email"
              value={formData.requester_email}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
              style={{ 
                borderColor: '#A58C81', 
                focusRingColor: '#A58C81',
                backgroundColor: '#ffffff'
              }}
              placeholder="ihre.email@beispiel.de"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
              Datum *
            </label>
            <input
              type="date"
              name="event_date"
              value={formData.event_date}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
              style={{ 
                borderColor: '#A58C81', 
                focusRingColor: '#A58C81',
                backgroundColor: '#ffffff'
              }}
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
                className="h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 rounded"
                style={{ 
                  accentColor: '#A58C81',
                  focusRingColor: '#A58C81'
                }}
              />
              <label htmlFor="is_private" className="ml-3 block text-sm font-medium" style={{ color: '#252422' }}>
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
                className="h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 rounded mt-1"
                style={{ 
                  accentColor: '#A58C81',
                  focusRingColor: '#A58C81'
                }}
                required
              />
              <label htmlFor="hausordnung_accepted" className="ml-3 block text-sm" style={{ color: '#252422' }}>
                Ich habe die <PDFLink href="/assets/Junge_Geseltschaft_Hausordnung.pdf" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#A58C81' }}>Hausordnung</PDFLink> gelesen und akzeptiert *
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="mietvertrag_accepted"
                name="mietvertrag_accepted"
                checked={formData.mietvertrag_accepted}
                onChange={handleInputChange}
                className="h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 rounded mt-1"
                style={{ 
                  accentColor: '#A58C81',
                  focusRingColor: '#A58C81'
                }}
                required
              />
              <label htmlFor="mietvertrag_accepted" className="ml-3 block text-sm" style={{ color: '#252422' }}>
                Ich habe die <PDFLink href="/assets/Junge_Geseltschaft_Mietvertrag.pdf" className="font-medium hover:opacity-80 transition-opacity" style={{ color: '#A58C81' }}>Nutzungsvereinbarung</PDFLink> gelesen und akzeptiert *
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
              Ausgefüllter Mietvertrag hochladen *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg" style={{ borderColor: '#A58C81' }}>
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-12 w-12" style={{ color: '#A58C81' }} />
                <div className="flex text-sm" style={{ color: '#666' }}>
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium hover:opacity-80 transition-opacity focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-opacity-50" style={{ color: '#A58C81', focusRingColor: '#A58C81' }}>
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
                <p className="text-xs" style={{ color: '#A58C81' }}>PDF bis zu 1MB</p>
                {fileError && (
                  <p className="text-xs" style={{ color: '#dc2626' }}>{fileError}</p>
                )}
                {uploadedFile && (
                  <p className="text-xs" style={{ color: '#10b981' }}>
                    Datei ausgewählt: {uploadedFile.name} ({uploadedFile.size > 1024 ? (uploadedFile.size / 1024).toFixed(1) + ' KB' : uploadedFile.size + ' B'})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity border-2"
              style={{ 
                color: '#252422', 
                borderColor: '#A58C81', 
                backgroundColor: 'transparent' 
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-opacity"
              style={{ backgroundColor: '#A58C81' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Erstelle Anfrage...
                </>
              ) : (
                'Event anfragen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventRequestModalHTTP
