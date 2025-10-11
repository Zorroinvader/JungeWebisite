import React from 'react'
import { MapPin, Mail, Heart, Crown, UserCheck, Shield, Users, Target } from 'lucide-react'

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-5xl ml-0 lg:ml-[12vw] xl:ml-[12vw] 2xl:ml-[12vw]">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#252422] dark:text-[#F4F1E8] mb-6">
                Über uns
            </h1>
              <p className="text-xl md:text-2xl text-[#A58C81] dark:text-[#EBE9E9] mb-8">
                Die Begegnungsstätte für Junge (und jung gebliebene) Leute in unserer Gemeinde
            </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          
          {/* 1. Vision Section - Most Important, Moved to Top */}
          <div className="mb-24">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#252422]/5 to-[#1a1a1a]/5 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#A58C81]/10 rounded-full -translate-y-36 translate-x-36"></div>
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#8B6F5F]/10 rounded-full translate-y-28 -translate-x-28"></div>
              
              <div className="relative z-10 p-12">
                <div className="flex items-center mb-8">
                  <Heart className="h-10 w-10 mr-4 text-[#A58C81]" />
                  <h2 className="text-4xl font-bold text-[#252422] dark:text-[#F4F1E8]">
                    Unsere Vision
            </h2>
            </div>
                <p className="text-xl text-[#252422] dark:text-[#F4F1E8] mb-8 leading-relaxed max-w-4xl">
                  Wir sind überzeugt davon, dass das ein tolles Projekt ist, welches bei verantwortungsvollem Handeln 
                  aller Beteiligten auch in Zukunft dafür sorgt, dass wir hier bei uns in Wedelheine einen wirklich 
                  coolen „Lieblingsort für Junge Leute der Gemeinde Meine" und deren Freunde haben.
                </p>
                <div className="flex items-center bg-gradient-to-r from-[#A58C81]/10 to-[#8B6F5F]/10 rounded-2xl p-6">
                  <Target className="h-8 w-8 mr-4 text-[#A58C81]" />
                  <span className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8]">
                    Jede(r) ab 16 kann offiziell Mitglied werden
                  </span>
              </div>
              </div>
            </div>
          </div>

          {/* 2. Vorstand Section - Clean List Design */}
          <div className="mb-24">
            <div className="relative">
              {/* Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#A58C81]/5 to-[#8B6F5F]/5 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#A58C81]/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8B6F5F]/10 rounded-full translate-y-24 -translate-x-24"></div>
              
              <div className="relative z-10 p-12">
                <div className="flex items-center mb-12">
                  <Crown className="h-10 w-10 mr-4 text-[#A58C81]" />
                  <h2 className="text-4xl font-bold text-[#252422] dark:text-[#F4F1E8]">
                    Aktueller Vorstand
            </h2>
                </div>
                
                {/* Vorstand Members - Clean List Design */}
                <div className="space-y-8">
                  {/* Vorsitzende - Most Important */}
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#A58C81] to-[#8B6F5F] rounded-full flex items-center justify-center mr-6">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-1">Charlotte Rode</h3>
                      <p className="text-lg text-[#A58C81] dark:text-[#A58C81]">Vorsitzende</p>
                    </div>
                  </div>

                  {/* Other Vorstand Members */}
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-[#A58C81]/20 rounded-full flex items-center justify-center mr-6">
                        <div className="w-6 h-6 bg-[#A58C81] rounded-full"></div>
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">Max Vogeley</h4>
                        <p className="text-[#A58C81] dark:text-[#A58C81]">Stellv. Vorsitzender</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-[#A58C81]/20 rounded-full flex items-center justify-center mr-6">
                        <div className="w-6 h-6 bg-[#A58C81] rounded-full"></div>
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">Ben Strich</h4>
                        <p className="text-[#A58C81] dark:text-[#A58C81]">Kassenwart</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-[#A58C81]/20 rounded-full flex items-center justify-center mr-6">
                        <div className="w-6 h-6 bg-[#A58C81] rounded-full"></div>
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">Reinhard Strich</h4>
                        <p className="text-[#A58C81] dark:text-[#A58C81]">Stellv. Kassenwart</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-[#A58C81]/20 rounded-full flex items-center justify-center mr-6">
                        <div className="w-6 h-6 bg-[#A58C81] rounded-full"></div>
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">Christian Rode</h4>
                        <p className="text-[#A58C81] dark:text-[#A58C81]">Schriftwart</p>
                      </div>
                  </div>
                </div>
              </div>

                {/* Gründungsmitglieder - Subtle */}
                <div className="border-t border-[#A58C81]/20 pt-8 mt-12">
                  <div className="flex items-center mb-6">
                    <UserCheck className="h-6 w-6 mr-3 text-[#A58C81]" />
                    <h3 className="text-2xl font-semibold text-[#252422] dark:text-[#F4F1E8]">
                      Weitere Gründungsmitglieder
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#A58C81]/20 rounded-full flex items-center justify-center mr-3">
                        <div className="w-3 h-3 bg-[#A58C81] rounded-full"></div>
                      </div>
                      <span className="font-medium text-[#252422] dark:text-[#F4F1E8]">Joana Rode-Glag</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#A58C81]/20 rounded-full flex items-center justify-center mr-3">
                        <div className="w-3 h-3 bg-[#A58C81] rounded-full"></div>
                      </div>
                      <span className="font-medium text-[#252422] dark:text-[#F4F1E8]">Yvonne Strich</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Wer wir sind - Modern Layout */}
          <div className="mb-24">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#A58C81]/5 to-[#8B6F5F]/5 rounded-3xl"></div>
              <div className="absolute top-0 left-0 w-64 h-64 bg-[#A58C81]/10 rounded-full -translate-y-32 -translate-x-32"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#8B6F5F]/10 rounded-full translate-y-24 translate-x-24"></div>
              
              <div className="relative z-10 p-12">
                <div className="flex items-center mb-8">
                  <Users className="h-10 w-10 mr-4 text-[#A58C81]" />
                  <h2 className="text-4xl font-bold text-[#252422] dark:text-[#F4F1E8]">
                    Wer wir sind
            </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                    <p className="text-lg text-[#252422] dark:text-[#F4F1E8] mb-6 leading-relaxed">
                      Unser Verein wurde vor kurzem von 7 Personen gegründet und besteht aktuell aus 8 offiziellen Mitgliedern. 
                      Für die Wiedereröffnung und Neuausrichtung des Jugendclubs in Wedelheine haben wir ein neues Betreiberkonzept 
                      erarbeitet und einen eingetragenen Verein (e.V.) gegründet.
                    </p>
                    <p className="text-lg text-[#252422] dark:text-[#F4F1E8] leading-relaxed">
                      Wir wollen in Abstimmung mit der Gemeinde Meine den Jugendclub offiziell von der Gemeinde pachten und 
                      in Eigenverantwortung betreiben können.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-6 flex items-center">
                      <Shield className="h-8 w-8 mr-3 text-[#A58C81]" />
                      Aktueller Stand
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-3 h-3 bg-[#A58C81] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <div>
                          <p className="text-lg font-semibold text-[#252422] dark:text-[#F4F1E8]">Vereins-Steuernummer erhalten</p>
                          <p className="text-[#252422] dark:text-[#F4F1E8]">Offizielles Vereinskonto eröffnet</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-3 h-3 bg-[#A58C81] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <div>
                          <p className="text-lg font-semibold text-[#252422] dark:text-[#F4F1E8]">Vollumfängliche Vereinsversicherung</p>
                          <p className="text-[#252422] dark:text-[#F4F1E8]">Dank der Unterstützung durch Torsten Marienfeld</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-3 h-3 bg-[#A58C81] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <div>
                          <p className="text-lg font-semibold text-[#252422] dark:text-[#F4F1E8]">Erste Mitgliedsanträge eingegangen</p>
                          <p className="text-[#252422] dark:text-[#F4F1E8]">Vereinssatzung wird überarbeitet</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Kontakt und Standort - Clean Design */}
          <div className="mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#A58C81]/5 to-[#8B6F5F]/5 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-56 h-56 bg-[#A58C81]/10 rounded-full -translate-y-28 translate-x-28"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#8B6F5F]/10 rounded-full translate-y-20 -translate-x-20"></div>
              
              <div className="relative z-10 p-12">
                <div className="flex items-center mb-8">
                  <MapPin className="h-10 w-10 mr-4 text-[#A58C81]" />
                  <h2 className="text-4xl font-bold text-[#252422] dark:text-[#F4F1E8]">
                    Kontakt & Standort
            </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-[#A58C81]/10 rounded-full flex items-center justify-center mr-6">
                        <MapPin className="h-8 w-8 text-[#A58C81]" />
                </div>
                <div>
                        <h3 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">Standort</h3>
                        <p className="text-lg text-[#252422] dark:text-[#F4F1E8]">Pferdestall Wedes-Wedel, Wedel</p>
                      </div>
                </div>
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-[#A58C81]/10 rounded-full flex items-center justify-center mr-6">
                        <Mail className="h-8 w-8 text-[#A58C81]" />
                </div>
                <div>
                        <h3 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">E-Mail</h3>
                        <a 
                          href="mailto:jungegesellschaft@wedelheine.de"
                          className="text-lg text-[#A58C81] hover:text-[#8B6F5F] transition-colors"
                        >
                          jungegesellschaft@wedelheine.de
              </a>
            </div>
          </div>
        </div>
                  <div className="bg-white/60 dark:bg-[#EBE9E9]/60 backdrop-blur-sm rounded-2xl p-8 border border-[#A58C81]/20">
                    <h3 className="text-2xl font-bold text-[#252422] dark:text-[#252422] mb-6">Nächste Schritte</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-[#A58C81] rounded-full mr-4"></div>
                        <span className="text-[#252422] dark:text-[#252422]">Vereinssatzung finalisieren</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-[#A58C81] rounded-full mr-4"></div>
                        <span className="text-[#252422] dark:text-[#252422]">Mitgliederanwerbung starten</span>
      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-[#A58C81] rounded-full mr-4"></div>
                        <span className="text-[#252422] dark:text-[#252422]">Regelbetrieb aufnehmen</span>
                </div>
              </div>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage