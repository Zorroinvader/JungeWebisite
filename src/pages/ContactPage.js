import React from 'react'
import { MapPin, Mail, Clock, Users, FileText } from 'lucide-react'

const ContactPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-5xl ml-0 lg:ml-[12vw] xl:ml-[12vw] 2xl:ml-[12vw]">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#252422] dark:text-[#F4F1E8] mb-6">
                Kontakt
              </h1>
              <p className="text-xl md:text-2xl text-[#A58C81] dark:text-[#EBE9E9] mb-8">
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
              <div className="bg-white dark:bg-[#EBE9E9] rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-[#252422]">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-[#252422] mb-6">
                  Kontaktinformationen
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold text-[#252422] dark:text-[#252422]">E-Mail</p>
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
                      <p className="text-lg font-semibold text-[#252422] dark:text-[#252422]">Adresse</p>
                      <p className="text-lg text-[#252422] dark:text-[#252422]">
                        Pferdestall Wedes-Wedel<br />
                        Wedel, Deutschland
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-semibold text-[#252422] dark:text-[#252422]">Öffnungszeiten</p>
                      <p className="text-lg text-[#252422] dark:text-[#252422]">
                        Nach Vereinbarung<br />
                        Veranstaltungen: siehe Kalender
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#EBE9E9] rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-[#252422]">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-[#252422] mb-6">
                  Vorstand
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] mr-3" />
                    <span className="text-lg text-[#252422] dark:text-[#252422]">
                      Vorsitzender: [Name]
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] mr-3" />
                    <span className="text-lg text-[#252422] dark:text-[#252422]">
                      Stellvertreter: [Name]
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-[#A58C81] dark:text-[#A58C81] mr-3" />
                    <span className="text-lg text-[#252422] dark:text-[#252422]">
                      Schatzmeister: [Name]
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map and Additional Info */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-[#EBE9E9] rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-[#252422]">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-[#252422] mb-6">
                  Standort
                </h2>
                <div className="bg-gray-200 dark:bg-gray-600 rounded-lg h-64 flex items-center justify-center">
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    Karte wird hier angezeigt
                  </p>
                </div>
                <p className="text-lg text-[#252422] dark:text-[#252422] mt-4">
                  Der Pferdestall Wedes-Wedel befindet sich im Herzen von Wedel und ist 
                  gut mit öffentlichen Verkehrsmitteln und dem Auto erreichbar.
                </p>
              </div>

              <div className="bg-white dark:bg-[#EBE9E9] rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-[#252422]">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-[#252422] mb-6">
                  Mitgliedschaft
                </h2>
                <p className="text-lg text-[#252422] dark:text-[#252422] mb-6">
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

              <div className="bg-white dark:bg-[#EBE9E9] rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-[#252422]">
                <h2 className="text-3xl font-bold text-[#252422] dark:text-[#252422] mb-6">
                  Event-Anfrage
                </h2>
                <p className="text-lg text-[#252422] dark:text-[#252422] mb-6">
                  Möchten Sie den Pferdestall für eine private Feier mieten? 
                  Nutzen Sie unser Event-Anfrage-Formular.
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
                  Event anfragen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage