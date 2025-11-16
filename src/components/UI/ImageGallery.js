// FILE OVERVIEW
// - Purpose: Generic image gallery component with lightbox, navigation arrows, zoom, and download functionality.
// - Used by: Can be used anywhere images need to be displayed in a gallery format; similar to MuseumGallery but more generic.
// - Notes: Production component. Provides standard gallery features; may be used for event photos or other image collections.

import React, { useState, useRef, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from 'lucide-react'

const ImageGallery = ({ images = [], title = "Bildergalerie" }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const modalRef = useRef(null)

  // Gallery images with descriptions
  const galleryImages = images.length > 0 ? images : [
    { src: '/assets/2e24d4_d61674f27ed544f8b42c45dd48886889~mv2.jpg', alt: 'Clubhaus Außenansicht', category: 'Gebäude' },
    { src: '/assets/2e24d4_9d7c792d40664bf984842b78ce297461~mv2.jpg', alt: 'Ausstattung für feierliche Anlässe', category: 'Ausstattung' },
    { src: '/assets/2e24d4_e9c6b836e3d5458db75bbd18cc50acfc~mv2.jpg', alt: 'Ausstattung für gesellige Spieleabende', category: 'Ausstattung' },
    { src: '/assets/2e24d4_97313ec3f73f41b3a44e54f5f23c604e~mv2.jpg', alt: 'Party Ausrüstung', category: 'Ausstattung' },
    { src: '/assets/2e24d4_5bcafcfe41aa41a9b2ea006250941a18~mv2.jpg', alt: 'Impressionen - Clubhaus Innen', category: 'Impressionen' },
    { src: '/assets/2e24d4_20a249b933f34d87a6e6344b5a834c38~mv2.jpg', alt: 'Impressionen - Gesellschaftsraum', category: 'Impressionen' },
    { src: '/assets/2e24d4_3d2a85ad148c45a89660c2ee6bad2dd9~mv2.jpg', alt: 'Impressionen - Küchenbereich', category: 'Impressionen' },
    { src: '/assets/2e24d4_3c9970e8a01f4a8a953f3558deb48037~mv2.jpg', alt: 'Impressionen - Lounge', category: 'Impressionen' },
    { src: '/assets/2e24d4_68bc72273ab64fd78cb25f4e9e23f30b~mv2.jpg', alt: 'Impressionen - Veranstaltungsraum', category: 'Impressionen' },
    { src: '/assets/2e24d4_dc296a3fdf3f437ea17bb25bb883422d~mv2.jpg', alt: 'Große Veranstaltung', category: 'Events' },
    { src: '/assets/2e24d4_f87f7655c6794033b9de637050db38c4~mv2.jpg', alt: 'Gesellige Runde', category: 'Events' },
    { src: '/assets/2e24d4_74d14c2fa20240cdabd706db560d385d~mv2.jpg', alt: 'Clubhaus Detail 1', category: 'Details' },
    { src: '/assets/2e24d4_27aaace502b344739a514ca97c4aeb3a~mv2.jpg', alt: 'Clubhaus Detail 2', category: 'Details' },
    { src: '/assets/2e24d4_8e723554986b4dc380ecb6f9ccf7ff0c~mv2.jpg', alt: 'Clubhaus Detail 3', category: 'Details' },
    { src: '/assets/2e24d4_3b72e4bed857402aab2ca1824d82fd68~mv2.jpg', alt: 'Clubhaus Detail 4', category: 'Details' },
    { src: '/assets/2e24d4_1fe07294a42340b49b085a750991d662~mv2.jpg', alt: 'Clubhaus Detail 5', category: 'Details' },
    { src: '/assets/2e24d4_bcc44f0e81494bbfbbd3a103eaac9827~mv2.jpg', alt: 'Clubhaus Detail 6', category: 'Details' },
    { src: '/assets/2e24d4_adb4a718e619408fa4fb5292282dabbe~mv2.jpg', alt: 'Clubhaus Detail 7', category: 'Details' },
    { src: '/assets/2e24d4_28c75875e0bf4cbaa86f4fe2b3040e5d~mv2.jpg', alt: 'Clubhaus Detail 8', category: 'Details' },
    { src: '/assets/2e24d4_ddcc97cd06144d2183e70b5f53f18536~mv2.jpg', alt: 'Clubhaus Detail 9', category: 'Details' },
    { src: '/assets/2e24d4_4cd9152f91524f76919ac53f64271ff8~mv2.jpg', alt: 'Clubhaus Detail 10', category: 'Details' },
    { src: '/assets/2e24d4_63a9b80dc3e641f9a9d415d0f4d24675~mv2.jpg', alt: 'Clubhaus Panorama', category: 'Panorama' },
    { src: '/assets/2e24d4_8b55a40b88784726a657d8185efe164b~mv2.jpg', alt: 'Clubhaus Logo Detail', category: 'Logo' }
  ]

  const categories = [...new Set(galleryImages.map(img => img.category))]
  const [selectedCategory, setSelectedCategory] = useState('Alle')

  const filteredImages = selectedCategory === 'Alle' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory)

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

  const navigateImage = (direction) => {
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % filteredImages.length
      : (currentIndex - 1 + filteredImages.length) % filteredImages.length
    
    setCurrentIndex(newIndex)
    setSelectedImage(filteredImages[newIndex])
  }

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
  }, [isModalOpen, currentIndex, filteredImages.length])

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
      {/* Gallery Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-4">
          {title}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Entdecken Sie unsere Clubhaus-Räumlichkeiten, Ausstattung und die schönen Momente unserer Gemeinschaft.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {['Alle', ...categories].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-[#A58C81] text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredImages.map((image, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => openModal(image, index)}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                    <ZoomIn className="h-5 w-5 text-gray-800" />
                  </div>
                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                    <Download className="h-5 w-5 text-gray-800" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Image Info */}
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {image.alt}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {image.category}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div
            ref={modalRef}
            className="relative max-w-7xl max-h-full mx-4 bg-white dark:bg-gray-900 rounded-xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedImage.alt}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedImage.category} • {currentIndex + 1} von {filteredImages.length}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadImage(selectedImage.src, selectedImage.alt)}
                  disabled={isLoading}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#A58C81] transition-colors duration-200"
                  title="Bild herunterladen"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            <div className="relative">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              
              {/* Navigation Arrows */}
              {filteredImages.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verwenden Sie die Pfeiltasten oder die Navigation, um zwischen den Bildern zu wechseln
                </p>
                <div className="flex space-x-1">
                  {filteredImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index)
                        setSelectedImage(filteredImages[index])
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentIndex 
                          ? 'bg-[#A58C81]' 
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

export default ImageGallery
