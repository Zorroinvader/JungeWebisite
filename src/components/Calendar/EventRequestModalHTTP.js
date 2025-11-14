import React, { useState, useEffect } from 'react'
import { X, Upload, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { eventRequestsAPI } from '../../services/httpApi'
import PDFLink from '../UI/PDFLink'

const EventRequestModalHTTP = ({ isOpen, onClose, selectedDate }) => {
  const { user } = useAuth()
  // eslint-disable-next-line no-unused-vars
  const { isDarkMode } = useDarkMode()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requester_name: '',
    requester_email: '',
    start_date: '',
    end_date: '',
    schluesselannahme_time: '',
    schluesselabgabe_time: '',
    location: '',
    event_type: 'Privates Event',
    max_participants: '',
    is_private: true,
    hausordnung_accepted: false,
    mietvertrag_accepted: false,
    terms_accepted: false,
    youth_protection_accepted: false,
    additional_notes: ''
  })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Helper function to format date in local timezone
  const formatDateLocal = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Update form data when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      let dateString = ''
      
      // Handle different selectedDate formats
      if (selectedDate.start) {
        // If it's an object with start property
        dateString = formatDateLocal(selectedDate.start)
      } else if (selectedDate instanceof Date) {
        // If it's a Date object
        dateString = formatDateLocal(selectedDate)
      } else if (typeof selectedDate === 'string') {
        // If it's already a string
        dateString = selectedDate
      }
      
      if (dateString) {
        setFormData(prev => ({
          ...prev,
          start_date: dateString,
          end_date: dateString
        }))
      }
    }
  }, [selectedDate])

  // Reset form when modal opens (but preserve selected date)
  useEffect(() => {
    if (isOpen) {
      let currentDate = formatDateLocal(new Date())
      
      if (selectedDate) {
        if (selectedDate.start) {
          currentDate = formatDateLocal(selectedDate.start)
        } else if (selectedDate instanceof Date) {
          currentDate = formatDateLocal(selectedDate)
        } else if (typeof selectedDate === 'string') {
          currentDate = selectedDate
        }
      }
      
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        requester_name: '',
        requester_email: '',
        start_date: currentDate,
        end_date: currentDate,
        schluesselannahme_time: '',
        schluesselabgabe_time: '',
        location: '',
        event_type: 'Privates Event',
        max_participants: '',
        is_private: true,
        hausordnung_accepted: false,
        mietvertrag_accepted: false,
        terms_accepted: false,
        youth_protection_accepted: false,
        additional_notes: ''
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
    if (!formData.start_date) {
      setError('Bitte wählen Sie ein Startdatum aus')
      return false
    }
    if (!formData.end_date) {
      setError('Bitte wählen Sie ein Enddatum aus')
      return false
    }
    if (formData.start_date > formData.end_date) {
      setError('Das Enddatum muss nach dem Startdatum liegen')
      return false
    }
    if (!formData.schluesselannahme_time) {
      setError('Bitte wählen Sie eine Zeit für die Schlüsselannahme aus')
      return false
    }
    if (!formData.schluesselabgabe_time) {
      setError('Bitte wählen Sie eine Zeit für die Schlüsselabgabe aus')
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
      // Convert file to base64 safely using FileReader to avoid stack overflows
      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result || ''
          // result is a data URL like: data:<mime>;base64,<data>
          const commaIndex = result.indexOf(',')
          resolve(commaIndex >= 0 ? result.substring(commaIndex + 1) : '')
        }
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
      })

      const base64String = await toBase64(uploadedFile)

      const requestData = {
        title: formData.title,
        description: formData.description || '',
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        start_date: formData.start_date,
        end_date: formData.end_date,
        schluesselannahme_time: formData.schluesselannahme_time,
        schluesselabgabe_time: formData.schluesselabgabe_time,
        location: formData.location || '',
        event_type: formData.event_type || 'Privates Event',
        max_participants: formData.max_participants || null,
        is_private: formData.event_type === 'Privates Event',
        hausordnung_accepted: formData.hausordnung_accepted,
        mietvertrag_accepted: formData.mietvertrag_accepted,
        terms_accepted: formData.terms_accepted,
        youth_protection_accepted: formData.youth_protection_accepted,
        additional_notes: formData.additional_notes || '',
        uploaded_file_name: uploadedFile.name,
        uploaded_file_size: uploadedFile.size,
        uploaded_file_type: uploadedFile.type,
        uploaded_file_data: base64String,
        requested_by: user.id,
        created_by: user.id,
        status: 'pending'
      }


      // Use the API service to create the event request
      try {
        await eventRequestsAPI.createInitialRequest(requestData)
        setSuccess(true)
      } catch (apiError) {
        console.error('Failed to create event request:', apiError)
        setError('Fehler beim Erstellen der Anfrage. Bitte versuchen Sie es erneut.')
        setLoading(false)
        return
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
      <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-[#A58C81] dark:border-[#4a4a4a]">
        <div className="flex items-center justify-between p-8 border-b border-[#A58C81] dark:border-[#EBE9E9]">
          <div>
            <h2 className="text-2xl font-bold text-[#252422] dark:text-[#F4F1E8]">Event anfragen</h2>
            <p className="text-sm mt-1 text-[#A58C81] dark:text-[#EBE9E9]">
              Füllen Sie das Formular aus, um ein Event anzufragen
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-70 transition-opacity rounded-lg text-[#A58C81] dark:text-[#EBE9E9]"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">✅ Event-Anfrage erfolgreich erstellt!</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Name des Events *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-[#A58C81] dark:border-[#6a6a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="z.B. Geburtstagsfeier"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Name des Buchers *
              </label>
              <input
                type="text"
                name="requester_name"
                value={formData.requester_name}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-[#A58C81] dark:border-[#6a6a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Ihr vollständiger Name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Von (Startdatum) *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-[#A58C81] dark:border-[#6a6a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Bis (Enddatum) *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-[#A58C81] dark:border-[#6a6a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Mietablauf</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>1. Schlüsselannahme:</strong> Zeit am Startdatum für Schlüsselübergabe<br/>
              <strong>2. Schlüsselabgabe:</strong> Zeit am Enddatum für Schlüsselrückgabe nach Reinigung
            </p>
            {formData.start_date && formData.end_date && (
              <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800/30 rounded text-xs text-blue-800 dark:text-blue-200">
                <strong>Mietzeitraum:</strong> {formData.start_date} {formData.start_date !== formData.end_date ? `bis ${formData.end_date}` : ''}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Schlüsselannahme (am Startdatum) *
              </label>
              <input
                type="time"
                name="schluesselannahme_time"
                value={formData.schluesselannahme_time}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-[#A58C81] dark:border-[#6a6a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Schlüsselabgabe (am Enddatum) *
              </label>
              <input
                type="time"
                name="schluesselabgabe_time"
                value={formData.schluesselabgabe_time}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-[#A58C81] dark:border-[#6a6a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3 text-[#252422] dark:text-[#F4F1E8]">
                Event-Typ *
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="private_event"
                    name="event_type"
                    value="Privates Event"
                    checked={formData.event_type === 'Privates Event'}
                    onChange={handleInputChange}
                    className="h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 dark:border-gray-600 text-[#A58C81] dark:text-[#8a8a8a] focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a]"
                  />
                  <label htmlFor="private_event" className="ml-3 block text-sm font-medium text-[#252422] dark:text-[#F4F1E8]">
                    Privates Event
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="public_event"
                    name="event_type"
                    value="Öffentliches Event"
                    checked={formData.event_type === 'Öffentliches Event'}
                    onChange={handleInputChange}
                    className="h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 dark:border-gray-600 text-[#A58C81] dark:text-[#8a8a8a] focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a]"
                  />
                  <label htmlFor="public_event" className="ml-3 block text-sm font-medium text-[#252422] dark:text-[#F4F1E8]">
                    Öffentliches Event
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="hausordnung_accepted"
                name="hausordnung_accepted"
                checked={formData.hausordnung_accepted}
                onChange={handleInputChange}
                className="h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 dark:border-gray-600 rounded mt-1 text-[#A58C81] dark:text-[#8a8a8a] focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a]"
                required
              />
              <label htmlFor="hausordnung_accepted" className="ml-3 block text-sm text-[#252422] dark:text-[#F4F1E8]">
                Ich habe die <PDFLink href="/assets/Junge_Geseltschaft_Hausordnung.pdf" className="font-medium hover:opacity-80 transition-opacity text-[#A58C81] dark:text-[#EBE9E9]">Hausordnung</PDFLink> gelesen und akzeptiert *
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="mietvertrag_accepted"
                name="mietvertrag_accepted"
                checked={formData.mietvertrag_accepted}
                onChange={handleInputChange}
                className="h-4 w-4 focus:ring-2 focus:ring-opacity-50 border-gray-300 dark:border-gray-600 rounded mt-1 text-[#A58C81] dark:text-[#8a8a8a] focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a]"
                required
              />
              <label htmlFor="mietvertrag_accepted" className="ml-3 block text-sm text-[#252422] dark:text-[#F4F1E8]">
                Ich habe die <PDFLink href="/assets/Junge_Geseltschaft_Mietvertrag.pdf" className="font-medium hover:opacity-80 transition-opacity text-[#A58C81] dark:text-[#EBE9E9]">Nutzungsvereinbarung</PDFLink> gelesen und akzeptiert *
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
              Weitere Dinge
            </label>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-3 border border-[#A58C81] dark:border-[#6a6a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#8a8a8a] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Zusätzliche Informationen, Wünsche oder Anmerkungen..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
              Ausgefüllter Mietvertrag hochladen *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg border-[#A58C81] dark:border-[#6a6a6a] bg-gray-50 dark:bg-[#1a1a1a]">
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-12 w-12 text-[#A58C81] dark:text-[#EBE9E9]" />
                <div className="flex text-sm text-gray-600 dark:text-gray-300">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-[#2a2a2a] rounded-md font-medium hover:opacity-80 transition-opacity focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-opacity-50 text-[#A58C81] dark:text-[#8a8a8a] focus-within:ring-[#A58C81] dark:focus-within:ring-[#8a8a8a]">
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
                <p className="text-xs text-[#A58C81] dark:text-[#EBE9E9]">PDF bis zu 1MB</p>
                {fileError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fileError}</p>
                )}
                {uploadedFile && (
                  <p className="text-xs text-green-600 dark:text-green-400">
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
              className="px-6 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity border-2 border-[#A58C81] dark:border-[#6a6a6a] text-[#252422] dark:text-[#e0e0e0] bg-transparent hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-opacity bg-[#A58C81] dark:bg-[#6a6a6a] hover:bg-[#8a6a5a] dark:hover:bg-[#8a8a8a]"
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
