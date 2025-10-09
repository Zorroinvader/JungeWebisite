import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, MapPin, Mail, Calendar, FileText, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

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
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.avif" 
                alt="Junge Gesellschaft Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Junge Gesellschaft</h1>
                <p className="text-xs text-gray-500">Pferdestall Wedes-Wedel e.V.</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Start</Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Über uns</Link>
              <Link to="/faq" className="text-gray-900 text-sm font-medium">FAQ</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Kontakt</Link>
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Users className="h-4 w-4 mr-1.5" />
                    Profil
                  </Link>
                  {user.email === 'admin@admin.com' && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Anmelden
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Registrieren
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
              Häufige Fragen
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Hier findest du Antworten auf die wichtigsten Fragen zur Jungen Gesellschaft
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
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
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors duration-200"
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

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.avif" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Junge Gesellschaft</h3>
                  <p className="text-xs text-gray-500">Pferdestall Wedes-Wedel e.V.</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Die Begegnungsstätte für Junge (und jung gebliebene) Leute in unserer Gemeinde.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Kontakt</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Alte Dorfstrasse 46</p>
                <p>38527 Meine</p>
                <p>jungegesellschaft@wedelheine.de</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Links</h4>
              <div className="space-y-1">
                <Link to="/" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Start</Link>
                <Link to="/about" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Über uns</Link>
                <Link to="/faq" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
                <Link to="/contact" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Kontakt</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 Junge Gesellschaft Pferdestall Wedes-Wedel e.V. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default FAQPage
