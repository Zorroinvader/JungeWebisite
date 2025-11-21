// FILE OVERVIEW
// - Purpose: Public contact page with address, board contact details, map placeholder and a contact form that sends emails.
// - Used by: Route '/contact' in App.js, linked from header and footer.
// - Notes: Production page; submitting the form sends an email via the email service.

import React, { useState } from 'react'
import { MapPin, Mail, Clock, FileText, Crown, UserCheck, Heart, Target, Send, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'
import { sendEmail } from '../services/emailService'
import { secureLog, sanitizeError } from '../utils/secureConfig'

// Helper function to escape HTML to prevent XSS
const escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Bitte geben Sie Ihren Namen ein')
        setLoading(false)
        return
      }
      if (!formData.email.trim()) {
        setError('Bitte geben Sie Ihre E-Mail-Adresse ein')
        setLoading(false)
        return
      }
      if (!formData.message.trim()) {
        setError('Bitte geben Sie eine Nachricht ein')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
        setLoading(false)
        return
      }

      // Prepare email content
      const emailSubject = formData.subject.trim() || 'Kontaktanfrage über Kontaktformular'
      const emailMessage = `Eine neue Kontaktanfrage wurde über das Kontaktformular gesendet.\n\n` +
        `KONTAKTINFORMATIONEN\n` +
        `${'-'.repeat(50)}\n` +
        `Name: ${formData.name}\n` +
        `E-Mail: ${formData.email}\n` +
        `Betreff: ${formData.subject || 'Kein Betreff'}\n\n` +
        `NACHRICHT\n` +
        `${'-'.repeat(50)}\n` +
        `${formData.message}\n\n` +
        `---\n` +
        `Diese Nachricht wurde über das Kontaktformular auf der Website gesendet.`

      // Generate HTML content with escaped user input to prevent XSS
      const escapedName = escapeHtml(formData.name)
      const escapedEmail = escapeHtml(formData.email)
      const escapedSubject = escapeHtml(formData.subject || 'Kein Betreff')
      const escapedMessage = escapeHtml(formData.message).replace(/\n/g, '<br>')
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #252422; border-bottom: 2px solid #A58C81; padding-bottom: 10px;">
            Neue Kontaktanfrage
          </h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #252422; margin-top: 0;">Kontaktinformationen</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${escapedName}</p>
            <p style="margin: 5px 0;"><strong>E-Mail:</strong> <a href="mailto:${escapedEmail}">${escapedEmail}</a></p>
            <p style="margin: 5px 0;"><strong>Betreff:</strong> ${escapedSubject}</p>
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #252422;">Nachricht</h3>
            <div style="white-space: pre-line; line-height: 1.6; background-color: #fff; padding: 15px; border-left: 4px solid #A58C81; border-radius: 3px;">
              ${escapedMessage}
            </div>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Diese Nachricht wurde über das Kontaktformular auf der Website gesendet.
          </p>
        </div>
      `

      // Send email to both recipients
      const recipientEmails = ['jungegesellschaft@wedelheine.de', 'Zorro.invader@gmail.com']
      const emailSent = await sendEmail(recipientEmails, emailSubject, emailMessage, htmlContent)

      if (emailSent) {
        setSuccess(true)
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        })
      } else {
        setError('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per E-Mail.')
      }
    } catch (err) {
      secureLog('error', '[ContactPage] Error sending contact form', { error: sanitizeError(err) })
      setError('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per E-Mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Consistent Design */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-6xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-[#252422] dark:text-[#F4F1E8] mb-6">
                Kontakt
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl text-[#A58C81] dark:text-[#EBE9E9] mb-8">
                Nehmen Sie Kontakt mit uns auf
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-gray-600">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-white mb-6">
                  Kontaktinformationen
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold text-[#252422] dark:text-white">E-Mail</p>
                      <a 
                        href="mailto:jungegesellschaft@wedelheine.de"
                        className="text-lg text-[#A58C81] dark:text-[#A58C81] hover:text-[#252422] dark:hover:text-[#252422] transition-colors"
                      >
                        jungegesellschaft@wedelheine.de
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold text-[#252422] dark:text-white">Adresse</p>
                      <p className="text-lg text-[#252422] dark:text-white">
                        Pferdestall Wedes-Wedel<br />
                        Wedel, Deutschland
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold text-[#252422] dark:text-white">Öffnungszeiten</p>
                      <p className="text-lg text-[#252422] dark:text-white">
                        Nach Vereinbarung<br />
                        Veranstaltungen: siehe Kalender
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-gray-600">
                <div className="flex items-center mb-6">
                  <Crown className="h-8 w-8 mr-4 text-[#A58C81]" />
                  <h2 className="text-3xl font-bold text-[#252422] dark:text-white">
                    Aktueller Vorstand
                  </h2>
                </div>
                <div className="space-y-6">
                  {/* Vorsitzende - Most Important */}
                  <div className="flex items-center p-4 bg-[#A58C81]/5 dark:bg-[#A58C81]/10 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#A58C81] to-[#8B6F5F] rounded-full flex items-center justify-center mr-4">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#252422] dark:text-white mb-1">Charlotte Rode</h3>
                      <p className="text-[#A58C81] dark:text-[#A58C81]">Vorsitzende</p>
                    </div>
                  </div>

                  {/* Other Vorstand Members */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-4">
                        <div className="w-4 h-4 bg-[#A58C81] rounded-full"></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#252422] dark:text-white mb-1">Max Vogeley</h4>
                        <p className="text-[#A58C81] dark:text-[#A58C81]">Stellv. Vorsitzender</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-4">
                        <div className="w-4 h-4 bg-[#A58C81] rounded-full"></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#252422] dark:text-white mb-1">Ben Strich</h4>
                        <p className="text-[#A58C81] dark:text-[#A58C81]">Kassenwart</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-4">
                        <div className="w-4 h-4 bg-[#A58C81] rounded-full"></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#252422] dark:text-white mb-1">Reinhard Strich</h4>
                        <p className="text-[#A58C81] dark:text-[#A58C81]">Stellv. Kassenwart</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-4">
                        <div className="w-4 h-4 bg-[#A58C81] rounded-full"></div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#252422] dark:text-white mb-1">Christian Rode</h4>
                        <p className="text-[#A58C81] dark:text-[#A58C81]">Schriftwart</p>
                      </div>
                    </div>
                  </div>

                  {/* Gründungsmitglieder - Subtle */}
                  <div className="border-t border-[#A58C81]/20 dark:border-[#A58C81]/30 pt-6 mt-6">
                    <div className="flex items-center mb-4">
                      <UserCheck className="h-5 w-5 mr-3 text-[#A58C81]" />
                      <h3 className="text-xl font-semibold text-[#252422] dark:text-white">
                        Weitere Gründungsmitglieder
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-2">
                          <div className="w-2 h-2 bg-[#A58C81] rounded-full"></div>
                        </div>
                        <span className="font-medium text-[#252422] dark:text-white">Joana Rode-Glag</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-2">
                          <div className="w-2 h-2 bg-[#A58C81] rounded-full"></div>
                        </div>
                        <span className="font-medium text-[#252422] dark:text-white">Yvonne Strich</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map and Additional Info */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-gray-600">
                <div className="flex items-center mb-6">
                  <Heart className="h-8 w-8 mr-4 text-[#A58C81]" />
                  <h2 className="text-3xl font-bold text-[#252422] dark:text-white">
                    Unsere Vision
                  </h2>
                </div>
                <p className="text-lg text-[#252422] dark:text-white mb-6 leading-relaxed">
                  Wir sind überzeugt davon, dass das ein tolles Projekt ist, welches bei verantwortungsvollem Handeln 
                  aller Beteiligten auch in Zukunft dafür sorgt, dass wir hier bei uns in Wedelheine einen wirklich 
                  coolen „Lieblingsort für Junge Leute der Gemeinde Meine" und deren Freunde haben.
                </p>
                <div className="flex items-center bg-[#A58C81]/10 dark:bg-[#A58C81]/20 rounded-xl p-4">
                  <Target className="h-6 w-6 mr-3 text-[#A58C81]" />
                  <span className="text-lg font-semibold text-[#252422] dark:text-white">
                    Jede(r) ab 16 kann offiziell Mitglied werden
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-gray-600">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-white mb-6">
                  Standort
                </h2>
                <div className="bg-gray-200 dark:bg-gray-600 rounded-lg h-64 flex items-center justify-center">
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    Karte wird hier angezeigt
                  </p>
                </div>
                <p className="text-lg text-[#252422] dark:text-white mt-4">
                  Der Pferdestall Wedes-Wedel befindet sich im Herzen von Wedel und ist 
                  gut mit öffentlichen Verkehrsmitteln und dem Auto erreichbar.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-gray-600">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-white mb-6">
                  Mitgliedschaft
                </h2>
                <p className="text-lg text-[#252422] dark:text-white mb-6">
                  Möchten Sie Mitglied werden? Laden Sie sich den Mitgliedsantrag herunter 
                  und senden Sie ihn ausgefüllt an uns.
                </p>
                <a
                  href="/assets/Eintrits_Antrag.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-[#252422] dark:bg-[#252422] text-white dark:text-white rounded-lg hover:bg-[#A58C81] dark:hover:bg-[#A58C81] transition-colors"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Mitgliedsantrag herunterladen
                </a>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-gray-600">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-white mb-6">
                  Veranstaltungs-Anfrage
                </h2>
                <p className="text-lg text-[#252422] dark:text-white mb-6">
                  Möchten Sie den Pferdestall für eine private Feier mieten? 
                  Nutzen Sie unser Veranstaltungs-Anfrage-Formular.
                </p>
                <button
                  onClick={() => {
                    const calendar = document.querySelector('.rbc-calendar')
                    if (calendar) {
                      const event = new CustomEvent('openEventRequestModal', {
                        detail: { selectedDate: new Date() }
                      })
                      window.dispatchEvent(event)
                    }
                  }}
                  className="inline-flex items-center px-6 py-3 bg-[#A58C81] dark:bg-[#A58C81] text-white dark:text-white rounded-lg hover:bg-[#8B6F5F] dark:hover:bg-[#8B6F5F] transition-colors"
                >
                  Veranstaltung anfragen
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-6">
                Kontaktformular
              </h2>
              <p className="text-xl text-[#A58C81] dark:text-[#EBE9E9] max-w-3xl mx-auto">
                Schreiben Sie uns direkt eine Nachricht - wir antworten schnellstmöglich
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 lg:p-12 border-2 border-[#A58C81] dark:border-gray-600">
                <div className="flex items-center mb-8">
                  <MessageSquare className="h-10 w-10 mr-4 text-[#A58C81]" />
                  <h3 className="text-3xl font-bold text-[#252422] dark:text-white">
                    Nachricht senden
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Message - Prominent visual feedback */}
                  {success && (
                    <div className="rounded-2xl p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-400 dark:border-green-600 shadow-xl">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 shadow-lg">
                          <CheckCircle className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-green-800 dark:text-green-300 mb-3">
                          Kontaktformular erfolgreich gesendet!
                        </h3>
                        <p className="text-base text-green-700 dark:text-green-400 mb-2 font-medium">
                          ✓ Ihre Nachricht wurde per E-Mail an uns gesendet
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500 mb-6">
                          Wir werden Ihnen schnellstmöglich antworten.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSuccess(false)
                            setError('')
                          }}
                          className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                          Weitere Nachricht senden
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form Fields - Hide when success */}
                  {!success && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-lg font-semibold text-[#252422] dark:text-white mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-[#A58C81] focus:ring-2 focus:ring-[#A58C81]/20 dark:focus:ring-[#A58C81]/20 bg-white dark:bg-gray-800 text-[#252422] dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Ihr vollständiger Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-lg font-semibold text-[#252422] dark:text-white mb-2">
                            E-Mail *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-[#A58C81] focus:ring-2 focus:ring-[#A58C81]/20 dark:focus:ring-[#A58C81]/20 bg-white dark:bg-gray-800 text-[#252422] dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="ihre.email@beispiel.de"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-lg font-semibold text-[#252422] dark:text-white mb-2">
                          Betreff
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          disabled={loading}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-[#A58C81] focus:ring-2 focus:ring-[#A58C81]/20 dark:focus:ring-[#A58C81]/20 bg-white dark:bg-gray-800 text-[#252422] dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="Worum geht es?"
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-lg font-semibold text-[#252422] dark:text-white mb-2">
                          Nachricht *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          rows={6}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-[#A58C81] focus:ring-2 focus:ring-[#A58C81]/20 dark:focus:ring-[#A58C81]/20 bg-white dark:bg-gray-800 text-[#252422] dark:text-white transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="Schreiben Sie hier Ihre Nachricht..."
                        />
                      </div>

                      <div className="text-center pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#A58C81] to-[#8B6F5F] hover:from-[#8B6F5F] hover:to-[#A58C81] text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                              Nachricht wird gesendet...
                            </>
                          ) : (
                            <>
                              <Send className="h-6 w-6 mr-3" />
                              Nachricht senden
                            </>
                          )}
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                          * Pflichtfelder. Ihre Nachricht wird per E-Mail an uns gesendet.
                        </p>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage