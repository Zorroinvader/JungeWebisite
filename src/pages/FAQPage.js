import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, MapPin, Mail, ChevronDown, ChevronUp } from 'lucide-react'

const FAQPage = () => {
  const { user } = useAuth()
  const [openFAQ, setOpenFAQ] = useState(null)

  const faqs = [
    {
      id: 1,
      question: "Wer darf Mitglied bei der Jungen Gesellschaft sein?",
      answer: "Der Jugendclub soll insbesondere für Junge Leute ab 16 zur Verfügung stehen, die dort auch mal ein Bierchen trinken oder Partys mit Gleichaltrigen feiern dürfen. Offizielles Mitglied der Jungen Gesellschaft Pferdestall Wedes-Wedel e.V. kann man deshalb erst mit 16 Jahren werden. Jugendliche unter 16 sind aber jeder Zeit gern gesehene Gäste, dürfen gemäß Jugendschutzgesetz aber noch keinen Alkohol trinken, worauf im Jugendclub geachtet wird. Wenn Du noch nicht 16 bist, können aber gerne auch Deine Eltern stellvertretend für Dich Mitglied werden und somit den Erhalt des Jugendclubs unterstützen."
    },
    {
      id: 2,
      question: "Ab wann kann man Mitglied werden?",
      answer: "Wir pachten den Jugendclub zwar schon seit dem 01.10.2023 und haben den Regelbetrieb für unsere Jungen Leute bereits aufgenommen, aber es müssen noch einige Formalitäten abgearbeitet werden, bevor wir in die Mitgliederwerbung gehen. So warten wir beispielsweise noch auf eine Steuernummer vom Finanzamt, damit wir ein Vereinskonto eröffnen und Mitgliedsbeiträge einziehen können. Wir rechnen aber damit, dass alle Formalitäten bald erledigt sind und dass wir spätestens ab Sommer 2024 aktiv um Eure Mitgliedschaft werben können."
    },
    {
      id: 3,
      question: "Wie hoch soll denn der Mitgliedsbeitrag werden?",
      answer: "Um die laufenden Kosten für Pacht und Unterhaltskosten des Jugendclubs bestreiten zu können, haben wir uns erst einmal für einen standardmäßigen Monatsbeitrag von lediglich 5 € entschieden. Da die Nachfrage doch recht hoch zu sein scheint, gehen wir davon aus, dass damit auch schon ein wesentlicher Beitrag für die laufenden Kosten zusammenkommt. Gerne können auf freiwilliger Basis aber auch höhere Mitgliedsbeiträge gewählt werden, um die Junge Gesellschaft und den Erhalt des Jugendclubs sowie die ständige Pflege und Erweiterung der Jugendclub-Ausstattung sicherzustellen."
    },
    {
      id: 4,
      question: "Wie sollen sich Junge Gesellschaft und Jugendclub finanzieren?",
      answer: "Einen Großteil der Unterhaltskosten für den Jugendclub erhoffen wir uns aus den Mitgliedsbeiträgen finanzieren zu können. Zur Generierung weiterer Einnahmen und auch zur vielseitigeren Nutzung des Jugendclubs für alle Mitbürgerinnen und Mitbürger gibt es mit offizieller Zustimmung der Gemeinde Meine (unserem Verpächter) aber auch die Möglichkeit, den Jugendclub kurzzeitig zu vermieten, so dass beispielsweise auch Geburtstagsfeiern, Kindergeburtstage, Schulfeiern oder andere Veranstaltungen dort stattfinden können. Spenden zum Erhalt und zur Förderung des Jugendclubs sind natürlich auch jeder Zeit gern gesehen."
    },
    {
      id: 5,
      question: "Gibt es feste Öffnungszeiten?",
      answer: "Grundsätzlich steht der Jugend Club allen Mitgliedern und Freunden der Jungen Gesellschaft rund um die Uhr zur Verfügung. Die Schlüssel für den Club können nach Absprache bei den Vorstandsmitgliedern abgeholt werden und müssen nach Verlassen und Verschließen des Clubs umgehend zurück gegeben werden. Der Schlüsselempfänger trägt für den entsprechenden Zeitraum die Verantwortung für die Einhaltung der Hausordnung sowie des Jugendschutzgesetzes und für eventuelle Sachbeschädigungen im entsprechenden Zeitraum. Ansprechpartner für die Schlüssel sind folgende Vorstände: Charlotte Rode, Max Vogeley und Ben Strich"
    },
    {
      id: 6,
      question: "Wie kann ich den Jugend Club für eigene Veranstaltungen mieten und was kostet das?",
      answer: "Über den Menüpunkt 'Vermietung' kommst Du zu den Informationen, wie Du den Jugendclub für Deine eigene Veranstaltung buchen kannst. Dort ist ein Veranstaltungskalender verlinkt, in dem Du nachsehen kannst, ob Dein Wunschtermin noch frei ist und auch alle weiteren Details und die Mietpreise sind dort zu finden."
    },
    {
      id: 7,
      question: "Was habt Ihr für die Zukunft des Jugendclubs vor?",
      answer: "Vorrangiges Ziel unseres Engagements war es, den Jugendclub für unsere Jungen Leute in Wedesbüttel und Wedelheins sowie der ganzen Gemeinde zu erhalten. Dazu wollten wir uns nicht einfach nur dafür einsetzen, dass der Jugendclub seitens der Gemeinde wieder geöffnet wird. Statt dessen wollten wir den Jugendclub in Wedelheine insbesondere für Junge Leute ab 16 attraktiv machen, da es ansonsten keine entsprechende Einrichtung mehr in unserer Gemeinde gibt. Das ist uns mittlerweile offensichtlich gut gelungen, da der Jugendclub seit der Neueröffnung stets gut besucht ist und wir entsprechendes Feedback von den Jungen Leuten und den Eltern, aber auch generell von allen Seiten unserer Dorfgemeinschaften bekommen."
    }
  ]

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F1E8' }}>
      {/* Navigation Header - match HomePage */}
      <nav className="w-full border-b" style={{ backgroundColor: '#F4F1E8', borderColor: '#A58C81' }}>
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                alt="Junge Gesellschaft Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold" style={{ color: '#252422' }}>Junge Gesellschaft</span>
            </div>
            {/* Nav */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>Start</Link>
              <Link to="/about" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>Über uns</Link>
              <Link to="/faq" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>FAQ</Link>
              <Link to="/contact" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>Kontakt</Link>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/profile"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#252422' }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Profil
                  </Link>
                  {user.email === 'admin@admin.com' && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      Admin Panel
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium hover:opacity-70 transition-opacity"
                    style={{ color: '#252422' }}
                  >
                    Anmelden
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#252422' }}
                  >
                    Registrieren
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - left aligned like HomePage and shifted left */}
      <div className="w-full" style={{ backgroundColor: '#F4F1E8' }}>
        <div className="w-full px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="lg:pr-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: '#252422' }}>
                  Häufige Fragen
                </h1>
                <p className="text-lg md:text-xl mb-2 leading-relaxed" style={{ color: '#A58C81' }}>
                  Antworten auf die wichtigsten Fragen zur Jungen Gesellschaft
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Link
                    to="/contact"
                    className="inline-flex items-center px-6 py-3 text-base font-medium text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    style={{ backgroundColor: '#252422' }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Kontakt aufnehmen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - match card styles from HomePage */}
      <div className="w-full px-6 lg:px-8 py-12" style={{ backgroundColor: '#F4F1E8' }}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8" style={{ border: '2px solid #A58C81' }}>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  >
                    <h3 className="text-base font-medium text-gray-900 pr-4">{faq.question}</h3>
                    {openFAQ === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === faq.id && (
                    <div className="px-6 pb-4">
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-gray-700 leading-relaxed text-sm">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact Section */}
            <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Weitere Fragen?
              </h2>
              <p className="text-gray-600 text-center mb-6 text-sm">
                Falls deine Frage hier nicht beantwortet wurde, zögere nicht, uns zu kontaktieren!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:jungegesellschaft@wedelheine.de"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-colors duration-200"
                  style={{ backgroundColor: '#252422' }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  E-Mail schreiben
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Kontaktseite
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - match HomePage */}
      <footer style={{ backgroundColor: '#252422' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">Junge Gesellschaft</h3>
                  <p className="text-sm" style={{ color: '#CCB7AE' }}>Pferdestall Wedes-Wedel e.V.</p>
                </div>
              </div>
              <p className="text-white text-sm opacity-80">
                Die Begegnungsstätte für Junge (und jung gebliebene) Leute in unserer Gemeinde.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Kontakt</h4>
              <div className="space-y-1 text-sm text-white opacity-80">
                <p>Alte Dorfstrasse 46</p>
                <p>38527 Meine</p>
                <p>jungegesellschaft@wedelheine.de</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Links</h4>
              <div className="space-y-1">
                <Link to="/" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">Start</Link>
                <Link to="/about" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">Über uns</Link>
                <Link to="/faq" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">FAQ</Link>
                <Link to="/contact" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">Kontakt</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-white opacity-60" style={{ borderColor: '#CCB7AE' }}>
            <p>&copy; 2024 Junge Gesellschaft Pferdestall Wedes-Wedel e.V. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default FAQPage
