import React from 'react'
import { MapPin, Mail, Heart, Crown, UserCheck, Shield, Users, Target, Camera } from 'lucide-react'
import MuseumGallery from '../components/UI/MuseumGallery'

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Modern Wide Design */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-6xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-[#252422] dark:text-[#F4F1E8] mb-6">
                Über uns
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl text-[#A58C81] dark:text-[#EBE9E9] mb-8">
                Die Begegnungsstätte für Junge (und jung gebliebene) Leute in unserer Gemeinde
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - New Layout Design */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="max-w-7xl mx-auto">
          
          {/* New Hero Content Section */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left: Vision & Mission */}
              <div className="space-y-12">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
                  <div className="flex items-center mb-8">
                    <Heart className="h-12 w-12 mr-6 text-[#A58C81]" />
                    <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
                      Unsere Vision
                    </h2>
                  </div>
                  <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                    Wir sind überzeugt davon, dass das ein tolles Projekt ist, welches bei verantwortungsvollem Handeln 
                    aller Beteiligten auch in Zukunft dafür sorgt, dass wir hier bei uns in Wedelheine einen wirklich 
                    coolen „Lieblingsort für Junge Leute der Gemeinde Meine" und deren Freunde haben.
                  </p>
                  <div className="flex items-center bg-gradient-to-r from-[#A58C81]/10 to-[#8B6F5F]/10 dark:from-[#A58C81]/20 dark:to-[#8B6F5F]/20 rounded-2xl p-6">
                    <Target className="h-8 w-8 mr-4 text-[#A58C81]" />
                    <span className="text-xl font-semibold text-gray-900 dark:text-white">
                      Jede(r) ab 16 kann offiziell Mitglied werden
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Who We Are */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
                <div className="flex items-center mb-8">
                  <Users className="h-12 w-12 mr-6 text-[#A58C81]" />
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
                    Wer wir sind
                  </h2>
                </div>
                <div className="space-y-6">
                  <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                    Wir sind eine Gruppe von Jugendlichen und Erwachsenen, die sich für die Jugend in unserer Gemeinde einsetzen.
                  </p>
                  <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                    Wir sind ein eingetragener Verein (e.V.), und schaffen Veranstlatung daher selbständig.
                  </p>
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-[#A58C81] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                      Wir sehen es als unsere Aufgabe, Jugendlichen und Interessierten eine Plattform zu bieten, um sich gemeinsam zu treffen, zu lernern und eigenen Möglichkeiten und Ideen zu finden.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Vorstand Section - Modern Design */}
          <div className="mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
              <div className="flex items-center mb-8">
                <Crown className="h-10 w-10 mr-4 text-[#A58C81]" />
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Aktueller Vorstand
                </h2>
              </div>
              
              {/* Vorstand Members - Modern List Design */}
              <div className="space-y-8">
                {/* Vorsitzende - Most Important */}
                <div className="flex items-center p-6 bg-[#A58C81]/10 dark:bg-[#A58C81]/20 rounded-2xl">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#A58C81] to-[#8B6F5F] rounded-full flex items-center justify-center mr-6">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Charlotte Rode</h3>
                    <p className="text-lg text-[#A58C81] dark:text-[#A58C81]">Vorsitzende</p>
                  </div>
                </div>

                {/* Other Vorstand Members */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-12 h-12 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-4">
                      <div className="w-6 h-6 bg-[#A58C81] rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Max Vogeley</h4>
                      <p className="text-[#A58C81] dark:text-[#A58C81]">Stellv. Vorsitzender</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-12 h-12 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-4">
                      <div className="w-6 h-6 bg-[#A58C81] rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ben Strich</h4>
                      <p className="text-[#A58C81] dark:text-[#A58C81]">Kassenwart</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-12 h-12 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-4">
                      <div className="w-6 h-6 bg-[#A58C81] rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Reinhard Strich</h4>
                      <p className="text-[#A58C81] dark:text-[#A58C81]">Stellv. Kassenwart</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-12 h-12 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-4">
                      <div className="w-6 h-6 bg-[#A58C81] rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Christian Rode</h4>
                      <p className="text-[#A58C81] dark:text-[#A58C81]">Schriftwart</p>
                    </div>
                  </div>
                </div>

                {/* Gründungsmitglieder - Modern */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-8 mt-8">
                  <div className="flex items-center mb-6">
                    <UserCheck className="h-6 w-6 mr-3 text-[#A58C81]" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Weitere Gründungsmitglieder
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-3">
                        <div className="w-3 h-3 bg-[#A58C81] rounded-full"></div>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Joana Rode-Glag</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#A58C81]/20 dark:bg-[#A58C81]/30 rounded-full flex items-center justify-center mr-3">
                        <div className="w-3 h-3 bg-[#A58C81] rounded-full"></div>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Yvonne Strich</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Museum Gallery Section with Button */}
          <div className="mb-20">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
              <MuseumGallery 
                title="Unser Clubhaus - Eine visuelle Entdeckungsreise"
                showFullGalleryButton={true}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AboutPage