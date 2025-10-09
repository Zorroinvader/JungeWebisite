import React, { useState } from 'react'
import { X, Upload, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const EventRequestModalStorage = ({ isOpen, onClose, selectedDate }) => {
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
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

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
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('Die Datei ist zu groß. Maximale Größe: 5MB.')
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

  const uploadFileWithRetry = async (file, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`)
        setUploadProgress(`Upload-Versuch ${attempt}/${maxRetries}...`)
        
        const fileName = `mietvertraege/${user.id}_${Date.now()}_${file.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file)

        if (uploadError) {
          console.error(`❌ Upload attempt ${attempt} failed:`, uploadError)
          
          if (attempt === maxRetries) {
            throw new Error(`Upload fehlgeschlagen nach ${maxRetries} Versuchen: ${uploadError.message}`)
          }
          
          // Wait before retry
          setUploadProgress(`Warte 2 Sekunden vor nächstem Versuch...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }

        console.log(`✅ Upload successful on attempt ${attempt}:`, uploadData)
        return uploadData

      } catch (error) {
        console.error(`❌ Upload attempt ${attempt} error:`, error)
        
        if (attempt === maxRetries) {
          throw error
        }
        
        // Wait before retry
        setUploadProgress(`Warte 2 Sekunden vor nächstem Versuch...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
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
      console.log('User ID:', user.id)

      let uploadedFileUrl = null

      if (uploadedFile) {
        console.log('🔄 Starting file upload:', uploadedFile.name)
        
        setUploading(true)
        setUploadProgress('Lade Datei hoch...')

        try {
          const uploadData = await uploadFileWithRetry(uploadedFile)
          
          setUploadProgress('Erstelle öffentliche URL...')
          console.log('✅ File uploaded, getting public URL...')
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(uploadData.path)
          
          uploadedFileUrl = urlData.publicUrl
          console.log('✅ Public URL created:', uploadedFileUrl)
          
          setUploadProgress('Datei erfolgreich hochgeladen!')
          
        } catch (uploadError) {
          console.error('❌ File upload failed:', uploadError)
          throw new Error(`Datei-Upload fehlgeschlagen: ${uploadError.message}`)
        } finally {
          setUploading(false)
          setUploadProgress('')
        }
      }

      setUploadProgress('Erstelle Event-Anfrage...')
      console.log('🔄 Creating event request...')

      const requestData = {
        title: formData.title,
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        event_date: formData.event_date,
        is_private: formData.is_private,
        hausordnung_accepted: formData.hausordnung_accepted,
        mietvertrag_accepted: formData.mietvertrag_accepted,
        uploaded_mietvertrag_url: uploadedFileUrl,
        requested_by: user.id,
        status: 'pending'
      }

      console.log('Request data:', requestData)

      const { data, error: requestError } = await supabase
        .from('event_requests')
        .insert([requestData])
        .select()

      if (requestError) {
        console.error('❌ Event request error:', requestError)
        throw new Error(`Fehler beim Erstellen der Anfrage: ${requestError.message}`)
      }

      console.log('✅ Event request created:', data)
      setUploadProgress('Event-Anfrage erfolgreich erstellt!')

      // Show success message briefly
      setTimeout(() => {
        setLoading(false)
        setUploading(false)
        setUploadProgress('')
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
      }, 1500)

    } catch (error) {
      console.error('Event request error:', error)
      setError(error.message)
      setLoading(false)
      setUploading(false)
      setUploadProgress('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Event anfragen</h2>
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
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

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
                <p className="text-xs text-gray-500">PDF bis zu 5MB</p>
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

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <p className="text-sm text-blue-800">{uploadProgress}</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Lade hoch...
                </>
              ) : loading ? (
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

export default EventRequestModalStorage
