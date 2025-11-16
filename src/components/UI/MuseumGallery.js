// FILE OVERVIEW
// - Purpose: Image gallery component for displaying clubhouse photos with lightbox, navigation, and download features.
// - Used by: AboutPage to show clubhouse images; provides full-screen viewing and image navigation.
// - Notes: Production component. Supports keyboard navigation, zoom, and download; shows image metadata and location info.

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, Download, Eye, Info, MapPin, Users, Calendar } from 'lucide-react'

const MuseumGallery = ({ images = [], title = "Unser Clubhaus - Eine visuelle Entdeckungsreise", showFullGalleryButton = false }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const modalRef = useRef(null)

  // Museum-style gallery images with detailed descriptions
  const museumImages = images.length > 0 ? images : [
    { 
      src: '/assets/2e24d4_d61674f27ed544f8b42c45dd48886889~mv2.jpg', 
      alt: 'Clubhaus Außenansicht', 
      category: 'Architektur',
      description: 'Das Herzstück unserer Gemeinschaft - das wunderschöne Clubhaus im Herzen von Wedelheine',
      details: 'Tradition trifft Moderne in diesem historischen Gebäude'
    },
    { 
      src: '/assets/2e24d4_9d7c792d40664bf984842b78ce297461~mv2.jpg', 
      alt: 'Ausstattung für feierliche Anlässe', 
      category: 'Ausstattung',
      description: 'Elegante Ausstattung für besondere Anlässe und festliche Veranstaltungen',
      details: 'Hochwertige Möbel und Dekoration für jeden Anlass'
    },
    { 
      src: '/assets/2e24d4_e9c6b836e3d5458db75bbd18cc50acfc~mv2.jpg', 
      alt: 'Ausstattung für gesellige Spieleabende', 
      category: 'Gemeinschaft',
      description: 'Gemütliche Ecken für gesellige Runden und entspannte Spieleabende',
      details: 'Der perfekte Ort für gemeinsame Aktivitäten und neue Freundschaften'
    },
    { 
      src: '/assets/2e24d4_97313ec3f73f41b3a44e54f5f23c604e~mv2.jpg', 
      alt: 'Party Ausrüstung', 
      category: 'Events',
      description: 'Vollständige Party-Ausrüstung für unvergessliche Feiern und Events',
      details: 'Von der Soundanlage bis zur Beleuchtung - alles für den perfekten Abend'
    },
    { 
      src: '/assets/2e24d4_5bcafcfe41aa41a9b2ea006250941a18~mv2.jpg', 
      alt: 'Impressionen - Clubhaus Innen', 
      category: 'Atmosphäre',
      description: 'Die warme und einladende Atmosphäre unserer Räumlichkeiten',
      details: 'Ein Ort, der sofort zum Wohlfühlen einlädt'
    },
    { 
      src: '/assets/2e24d4_20a249b933f34d87a6e6344b5a834c38~mv2.jpg', 
      alt: 'Impressionen - Gesellschaftsraum', 
      category: 'Gemeinschaft',
      description: 'Unser zentraler Gesellschaftsraum - das Herzstück des Clubhauses',
      details: 'Hier kommen Jung und Alt zusammen für gemeinsame Aktivitäten'
    },
    { 
      src: '/assets/2e24d4_3d2a85ad148c45a89660c2ee6bad2dd9~mv2.jpg', 
      alt: 'Impressionen - Küchenbereich', 
      category: 'Ausstattung',
      description: 'Moderne Küchenausstattung für kulinarische Erlebnisse',
      details: 'Von Kaffee bis zum großen Festessen - alles ist möglich'
    },
    { 
      src: '/assets/2e24d4_3c9970e8a01f4a8a953f3558deb48037~mv2.jpg', 
      alt: 'Impressionen - Lounge', 
      category: 'Entspannung',
      description: 'Entspannungsbereich für ruhige Momente und Gespräche',
      details: 'Die perfekte Oase für entspannte Begegnungen'
    },
    { 
      src: '/assets/2e24d4_68bc72273ab64fd78cb25f4e9e23f30b~mv2.jpg', 
      alt: 'Impressionen - Veranstaltungsraum', 
      category: 'Events',
      description: 'Flexibler Veranstaltungsraum für verschiedene Anlässe',
      details: 'Von kleinen Treffen bis zu großen Feiern - der Raum passt sich an'
    },
    { 
      src: '/assets/2e24d4_dc296a3fdf3f437ea17bb25bb883422d~mv2.jpg', 
      alt: 'Große Veranstaltung', 
      category: 'Events',
      description: 'Einblicke in unsere größeren Veranstaltungen und Feiern',
      details: 'Hier entstehen unvergessliche Erinnerungen und neue Verbindungen'
    },
    { 
      src: '/assets/2e24d4_f87f7655c6794033b9de637050db38c4~mv2.jpg', 
      alt: 'Gesellige Runde', 
      category: 'Gemeinschaft',
      description: 'Momentaufnahmen aus unserem lebendigen Gemeinschaftsleben',
      details: 'Der Geist der Gemeinschaft wird hier täglich gelebt'
    },
    { 
      src: '/assets/2e24d4_63a9b80dc3e641f9a9d415d0f4d24675~mv2.jpg', 
      alt: 'Clubhaus Panorama', 
      category: 'Panorama',
      description: 'Weitwinkelblick auf unsere gesamte Anlage und Umgebung',
      details: 'Ein Ort, der in die Landschaft eingebettet ist'
    }
  ]

  const categories = [...new Set(museumImages.map(img => img.category))]
  const [selectedCategory, setSelectedCategory] = useState('Alle')

  const filteredImages = selectedCategory === 'Alle' 
    ? museumImages 
    : museumImages.filter(img => img.category === selectedCategory)

  const openModal = (image, index) => {
    setSelectedImage(image)
    setCurrentIndex(index)
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
    document.body.style.overflow = 'unset'
  }

  const navigateImage = useCallback((direction) => {
    setCurrentIndex(prevIndex => {
      const newIndex = direction === 'next' 
        ? (prevIndex + 1) % filteredImages.length
        : (prevIndex - 1 + filteredImages.length) % filteredImages.length
      setSelectedImage(filteredImages[newIndex])
      return newIndex
    })
  }, [filteredImages])

  const downloadImage = async (imageSrc, imageAlt) => {
    try {
      setIsLoading(true)
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${imageAlt.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isModalOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeModal()
          break
        case 'ArrowLeft':
          navigateImage('prev')
          break
        case 'ArrowRight':
          navigateImage('next')
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isModalOpen, navigateImage])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModalOpen])

  return (
    <div className="w-full">
      {/* Museum Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#A58C81] to-[#8B6F5F] rounded-full mb-8">
          <Eye className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-5xl md:text-6xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-6 leading-tight">
          {title}
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
          Betreten Sie unsere Räumlichkeiten durch eine visuelle Reise. 
          Entdecken Sie jeden Winkel, jede Ecke und die einzigartige Atmosphäre, 
          die unser Clubhaus zu einem besonderen Ort macht.
        </p>
      </div>

      {/* Museum Category Navigation */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {['Alle', ...categories].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-[#A58C81] to-[#8B6F5F] text-white shadow-xl'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-[#A58C81] hover:bg-[#A58C81]/5'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Museum Gallery Grid - Large Format */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
        {filteredImages.map((image, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl hover:shadow-3xl museum-card cursor-pointer"
            onClick={() => openModal(image, index)}
          >
            {/* Large Image Container */}
            <div className="aspect-[4/3] relative overflow-hidden">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover museum-image"
                loading="lazy"
              />
              
              {/* Museum-style Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent museum-overlay">
                <div className="absolute bottom-0 left-0 right-0 p-6 museum-overlay">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-[#A58C81] text-white text-xs font-semibold rounded-full">
                      {image.category}
                    </span>
                    <div className="flex space-x-2">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <ZoomIn className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <Download className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2 line-clamp-2">
                    {image.alt}
                  </h3>
                  <p className="text-white/90 text-sm line-clamp-2">
                    {image.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Museum Card Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {image.alt}
                  </h3>
                  <p className="text-[#A58C81] font-semibold text-sm uppercase tracking-wide">
                    {image.category}
                  </p>
                </div>
                <div className="flex items-center text-gray-400">
                  <Info className="h-5 w-5" />
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                {image.description}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Klicken zum Vergrößern
                </span>
                <div className="flex items-center text-[#A58C81]">
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">Ansehen</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Full Gallery Button */}
      {showFullGalleryButton && (
        <div className="text-center mb-16">
          <button
            onClick={() => {
              // Open the first image in full gallery mode
              openModal(filteredImages[0], 0)
            }}
            className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#A58C81] to-[#8B6F5F] hover:from-[#8B6F5F] hover:to-[#A58C81] text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <Eye className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
            Vollständige Galerie anzeigen
            <ChevronRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
            Klicken Sie hier, um alle Bilder in voller Größe zu betrachten
          </p>
        </div>
      )}

      {/* Museum Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-[#A58C81]/20 museum-stats">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#A58C81]/10 rounded-full mb-4">
            <MapPin className="h-8 w-8 text-[#A58C81]" />
          </div>
          <h3 className="text-2xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-2">
            {filteredImages.length}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Einzigartige Blickwinkel
          </p>
        </div>
        
        <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-[#A58C81]/20 museum-stats">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#A58C81]/10 rounded-full mb-4">
            <Users className="h-8 w-8 text-[#A58C81]" />
          </div>
          <h3 className="text-2xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-2">
            {categories.length}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Verschiedene Bereiche
          </p>
        </div>
        
        <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-[#A58C81]/20 museum-stats">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#A58C81]/10 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-[#A58C81]" />
          </div>
          <h3 className="text-2xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-2">
            24/7
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Virtuelle Besichtigung
          </p>
        </div>
      </div>

      {/* Enhanced Modal */}
      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="relative max-w-7xl max-h-full mx-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Enhanced Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#A58C81]/5 to-[#8B6F5F]/5">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {selectedImage.alt}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="px-3 py-1 bg-[#A58C81] text-white rounded-full text-xs font-semibold">
                    {selectedImage.category}
                  </span>
                  <span>{currentIndex + 1} von {filteredImages.length}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => downloadImage(selectedImage.src, selectedImage.alt)}
                  disabled={isLoading}
                  className="p-3 text-gray-600 dark:text-gray-400 hover:text-[#A58C81] hover:bg-[#A58C81]/10 rounded-full transition-all duration-200"
                  title="Bild herunterladen"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={closeModal}
                  className="p-3 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Enhanced Modal Content */}
            <div className="relative">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-[60vh] object-contain mx-auto"
              />
              
              {/* Navigation Arrows */}
              {filteredImages.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all duration-200 backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all duration-200 backdrop-blur-sm"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Enhanced Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#A58C81]/5 to-[#8B6F5F]/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Beschreibung</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {selectedImage.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Details</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {selectedImage.details}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Verwenden Sie die Pfeiltasten oder die Navigation, um zwischen den Bildern zu wechseln
                </p>
                <div className="flex space-x-2">
                  {filteredImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index)
                        setSelectedImage(filteredImages[index])
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentIndex 
                          ? 'bg-[#A58C81] scale-125' 
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MuseumGallery
