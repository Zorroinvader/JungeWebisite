import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
      {/* Hero Section - Modern & Compact like HomePage */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-5xl ml-0 lg:ml-[12vw] xl:ml-[12vw] 2xl:ml-[12vw]">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#252422] dark:text-[#F4F1E8] mb-6">
                FAQ
              </h1>
              <p className="text-xl md:text-2xl text-[#A58C81] dark:text-[#EBE9E9] mb-8">
                Häufig gestellte Fragen und Antworten
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Modern FAQ Design */}
      <div className="w-full px-6 lg:px-8 py-12 bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {faqData.map((item, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-[#EBE9E9] rounded-2xl shadow-lg border-2 border-[#A58C81] dark:border-[#252422] overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#A58C81] transition-colors"
                >
                  <h3 className="text-xl font-semibold text-[#252422] dark:text-[#252422] pr-4">
                    {item.question}
                  </h3>
                  {openItems[index] ? (
                    <ChevronUp className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] flex-shrink-0" />
                  )}
                </button>
                {openItems[index] && (
                  <div className="px-8 pb-6">
                    <p className="text-lg text-[#252422] dark:text-[#252422] leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 bg-white dark:bg-[#EBE9E9] rounded-2xl shadow-lg border-2 border-[#A58C81] dark:border-[#252422] p-8">
            <h2 className="text-2xl font-bold text-[#252422] dark:text-[#252422] mb-4">
              Weitere Fragen?
            </h2>
            <p className="text-lg text-[#252422] dark:text-[#252422] mb-6">
              Falls Sie weitere Fragen haben, zögern Sie nicht, uns zu kontaktieren:
            </p>
            <div className="space-y-2">
              <p className="text-lg text-[#252422] dark:text-[#252422]">
                📧 E-Mail: <a href="mailto:jungegesellschaft@wedelheine.de" className="text-[#A58C81] dark:text-[#A58C81] hover:text-[#252422] dark:hover:text-[#252422] transition-colors">jungegesellschaft@wedelheine.de</a>
              </p>
              <p className="text-lg text-[#252422] dark:text-[#252422]">
                📍 Adresse: Pferdestall Wedes-Wedel, Wedel
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQPage