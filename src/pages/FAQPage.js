// FILE OVERVIEW
// - Purpose: FAQ page with expandable question/answer sections and quick links to membership and event request info.
// - Used by: Route '/faq' in App.js, linked from header and footer.
// - Notes: Production content page; text here explains the basic usage and rules of the venue.

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Mail, Clock, Users, FileText, Calendar } from 'lucide-react'

const FAQPage = () => {
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const faqData = [
    {
      question: "Wie kann ich Mitglied werden?",
      answer: "Um Mitglied zu werden, füllen Sie einfach den Mitgliedsantrag aus, den Sie in unserem Download-Bereich finden. Schicken Sie ihn ausgefüllt an jungegesellschaft@wedelheine.de oder geben Sie ihn persönlich bei einer unserer Veranstaltungen ab."
    },
    {
      question: "Welche Veranstaltungen bietet der Verein an?",
      answer: "Wir organisieren regelmäßig verschiedene Veranstaltungen wie Partys, Workshops, Spieleabende, Grillfeste und kulturelle Events. Den aktuellen Veranstaltungskalender finden Sie auf unserer Startseite."
    },
    {
      question: "Kann ich den Pferdestall für private Feiern mieten?",
      answer: "Ja, der Pferdestall kann für private Feiern gemietet werden. Bitte kontaktieren Sie uns über das Event-Anfrage-Formular auf unserer Website oder per E-Mail, um Verfügbarkeit und Konditionen zu besprechen."
    },
    {
      question: "Gibt es Altersbeschränkungen?",
      answer: "Unser Verein richtet sich an junge Menschen, aber auch jung gebliebene sind herzlich willkommen. Es gibt keine strikten Altersbeschränkungen - wichtig ist das Interesse an Gemeinschaft und gemeinsamen Aktivitäten."
    },
    {
      question: "Wie kann ich mich über aktuelle Veranstaltungen informieren?",
      answer: "Sie können sich über unseren Event-Kalender auf der Website informieren oder uns per E-Mail kontaktieren. Wir senden auch regelmäßig Newsletter mit aktuellen Informationen an unsere Mitglieder."
    },
    {
      question: "Welche Kosten entstehen für die Mitgliedschaft?",
      answer: "Die genauen Mitgliedsbeiträge und Kosten für Veranstaltungen finden Sie in unserer Satzung, die im Download-Bereich verfügbar ist. Viele unserer Aktivitäten sind für Mitglieder kostenlos oder vergünstigt."
    },
    {
      question: "Kann ich auch ohne Mitgliedschaft an Veranstaltungen teilnehmen?",
      answer: "Ja, viele unserer Veranstaltungen sind auch für Nicht-Mitglieder offen. Für bestimmte exklusive Events oder vergünstigte Preise ist jedoch eine Mitgliedschaft erforderlich."
    },
    {
      question: "Wie kann ich mich ehrenamtlich engagieren?",
      answer: "Wir freuen uns über jeden, der sich ehrenamtlich engagieren möchte! Kontaktieren Sie uns einfach per E-Mail oder sprechen Sie uns bei einer Veranstaltung an. Es gibt viele Möglichkeiten, sich einzubringen."
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section - Modern Wide Design */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-6xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-[#252422] dark:text-[#F4F1E8] mb-6">
                FAQ
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl text-[#A58C81] dark:text-[#EBE9E9] mb-8">
                Häufig gestellte Fragen und Antworten
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Modern Wide Design */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8">
            {faqData.map((item, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-8 py-8 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                    {item.question}
                  </h3>
                  {openItems[index] ? (
                    <ChevronUp className="h-6 w-6 text-[#A58C81] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-[#A58C81] flex-shrink-0" />
                  )}
                </button>
                {openItems[index] && (
                  <div className="px-8 pb-8">
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Enhanced Contact Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Weitere Fragen?
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                Falls Sie weitere Fragen haben oder sich engagieren möchten, zögern Sie nicht, uns zu kontaktieren
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
                <div className="flex items-center mb-8">
                  <Mail className="h-10 w-10 mr-4 text-[#A58C81]" />
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Kontaktinformationen
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-[#A58C81] mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">E-Mail</p>
                      <a 
                        href="mailto:jungegesellschaft@wedelheine.de"
                        className="text-lg text-[#A58C81] hover:text-[#8B6F5F] dark:hover:text-[#A58C81] transition-colors"
                      >
                        jungegesellschaft@wedelheine.de
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-[#A58C81] mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Adresse</p>
                      <p className="text-lg text-gray-700 dark:text-gray-300">
                        Pferdestall Wedes-Wedel<br />
                        Wedel, Deutschland
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-6 w-6 text-[#A58C81] mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Öffnungszeiten</p>
                      <p className="text-lg text-gray-700 dark:text-gray-300">
                        Nach Vereinbarung<br />
                        Veranstaltungen: siehe Kalender
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
                  <div className="flex items-center mb-6">
                    <FileText className="h-8 w-8 mr-4 text-[#A58C81]" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Mitgliedschaft
                    </h3>
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                    Möchten Sie Mitglied werden? Laden Sie sich den Mitgliedsantrag herunter.
                  </p>
                  <a
                    href="/assets/Eintrits_Antrag.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-[#A58C81] hover:bg-[#8B6F5F] text-white rounded-xl transition-colors font-semibold"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Mitgliedsantrag herunterladen
                  </a>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
                  <div className="flex items-center mb-6">
                    <Calendar className="h-8 w-8 mr-4 text-[#A58C81]" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Event-Anfrage
                    </h3>
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                    Möchten Sie den Pferdestall für eine private Feier mieten?
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
                    className="inline-flex items-center px-6 py-3 bg-[#252422] hover:bg-[#A58C81] text-white rounded-xl transition-colors font-semibold"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Event anfragen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQPage