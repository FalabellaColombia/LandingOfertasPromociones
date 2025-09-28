document.addEventListener('DOMContentLoaded', async () => {
   // Constantes de configuración
   const PRODUCTS_DATA_URL = '../scripts/data.json'
   const MOBILE_BREAKPOINT = 768
   const SKELETON_COUNT = { mobile: 18, desktop: 12 }

   // Elementos del DOM
   const navigationMenu = document.querySelector('.nav')
   const seoContentContainer = document.querySelector('.seo')
   const skeletonLoadingContainer = document.querySelector('.skeleton-container')
   const productsContainer = document.querySelector('.categorias-container')
   const productCardTemplate = document.querySelector('#template')

   // Gestión de estado - Mapa para controlar temporizadores activos
   const activeCountdownTimers = new Map()

   // ================================
   // UTILIDADES PARA CARGA CON SKELETON
   // ================================

   // Crea un elemento skeleton individual para mostrar mientras cargan los productos
   const createSkeletonElement = () => {
      const skeletonElement = document.createElement('div')
      skeletonElement.className = 'skeleton'
      skeletonElement.innerHTML = `
         <div class="skeleton-image"></div>
         <div class="skeleton-text"></div>
      `
      return skeletonElement
   }

   // Muestra los elementos skeleton según el dispositivo (móvil o escritorio)
   const displaySkeletonLoaders = () => {
      const isMobileDevice = window.innerWidth <= MOBILE_BREAKPOINT
      const skeletonCount = isMobileDevice ? SKELETON_COUNT.mobile : SKELETON_COUNT.desktop

      skeletonLoadingContainer.innerHTML = ''

      for (let i = 0; i < skeletonCount; i++) {
         skeletonLoadingContainer.appendChild(createSkeletonElement())
      }
   }

   // ================================
   // UTILIDADES PARA RESALTADO DE TEXTO
   // ================================

   // Aplica formato de resaltado a texto específico (ofertas, precios, etc.)
   const applyTextHighlighting = (text) => {
      const highlightPatterns = /(\d+%|ofertas|\$\d{1,3}(\.\d{3})*(,\d+)?|\d+\s*(ml|ML)|ENVÍO\sGRATIS)/gi

      return text.replace(highlightPatterns, (matchedText) =>
         `<span class="categorias-span" style="font-weight: bold; color: red;">${matchedText}</span>`
      )
   }

   // ================================
   // UTILIDADES PARA TEMPORIZADOR DE CUENTA REGRESIVA
   // ================================

   // Inicializa y maneja el temporizador de cuenta regresiva para ofertas limitadas
   const initializeCountdownTimer = (endDateTime, tagElement, productImageElement) => {
      // Función que actualiza la visualización del temporizador cada segundo
      const updateCountdownDisplay = () => {
         const currentTime = new Date()
         const endTime = new Date(endDateTime)
         const timeRemaining = endTime - currentTime

         // Si el tiempo se agotó, mostrar mensaje de expiración
         if (timeRemaining <= 0) {
            tagElement.innerHTML = 'OFERTA EXPIRADA'
            tagElement.style.backgroundColor = '#666'
            tagElement.style.color = 'white'
            productImageElement.style.border = '3px solid #666'
            return false
         }

         // Calcular horas, minutos y segundos restantes
         const remainingHours = Math.floor(timeRemaining / (1000 * 60 * 60))
         const remainingMinutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
         const remainingSeconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

         // Formatear el tiempo como HH:MM:SS
         const formattedTime = `${remainingHours.toString().padStart(2, '0')}:` +
            `${remainingMinutes.toString().padStart(2, '0')}:` +
            `${remainingSeconds.toString().padStart(2, '0')}`

         tagElement.innerHTML = `SOLO X ${formattedTime}`
         return true
      }

      // Si la actualización inicial es exitosa, configurar el intervalo
      if (updateCountdownDisplay()) {
         return setInterval(() => {
            if (!updateCountdownDisplay()) {
               // Limpiar el temporizador cuando expire
               const timerId = activeCountdownTimers.get(tagElement)
               if (timerId) {
                  clearInterval(timerId)
                  activeCountdownTimers.delete(tagElement)
               }
            }
         }, 1000)
      }

      return null
   }

   // ================================
   // ESTILOS SEGÚN EL ESTADO DEL PRODUCTO
   // ================================

   // Devuelve los estilos apropiados según el estado de la oferta del producto
   const getProductStateStyles = (offerState, endDateTime = null) => {
      const normalizedState = offerState?.toUpperCase()
      const isLimitedTimeOffer = /SOLO X \d+ HORAS/i.test(offerState)

      // Manejo especial para ofertas de tiempo limitado
      if (isLimitedTimeOffer) {
         const currentTime = new Date()
         const offerEndTime = new Date(endDateTime)

         // Si la oferta ya expiró
         if (currentTime > offerEndTime) {
            return {
               borderColor: '#666',
               backgroundColor: '#666',
               textColor: 'white',
               displayText: 'OFERTA EXPIRADA',
               borderWidth: '3px',
               hasCountdown: false
            }
         }

         // Si la oferta está activa
         return {
            borderColor: 'red',
            backgroundColor: 'red',
            textColor: 'white',
            displayText: '',
            borderWidth: '3px',
            hasCountdown: true
         }
      }

      // Mapa de estilos para diferentes estados del producto
      const stateStylesMap = {
         'AGOTADO': {
            borderColor: 'red',
            backgroundColor: 'red',
            textColor: 'white',
            displayText: 'AGOTADO',
            borderWidth: '3px',
            hasCountdown: false
         },
         'LANZAMIENTO': {
            borderColor: '#aad500',
            backgroundColor: '#aad500',
            textColor: 'black',
            displayText: 'LANZAMIENTO',
            borderWidth: '3px',
            hasCountdown: false
         }
      }

      // Buscar en el mapa el estado, o devolver estilos por defecto si no existe
      return stateStylesMap[normalizedState] || {
         borderColor: '#dfdfdf',
         backgroundColor: 'transparent',
         textColor: 'black',
         displayText: '',
         borderWidth: '1px',
         hasCountdown: false
      }
   }

   // ================================
   // RENDERIZADO DE PRODUCTOS
   // ================================

   // Renderiza todo el catálogo de productos en el DOM
   const renderProductCatalog = (productsData) => {
      // Limpiar temporizadores existentes para evitar memory leaks
      activeCountdownTimers.forEach((timerId) => clearInterval(timerId))
      activeCountdownTimers.clear()

      productsContainer.innerHTML = ''
      const documentFragment = document.createDocumentFragment()

      // Agregar boton de navegación "Solo X Horas" solo si hay ofertas de tiempo limitado
      const hasLimitedTimeOffers = productsData.some((product) =>
         /SOLO X \d+ HORAS/i.test(product.offerState)
      )

      if (hasLimitedTimeOffers && !document.querySelector('[data-category-name="SoloX"]')) {
         const limitedTimeNavLink = document.createElement('a')
         limitedTimeNavLink.href = '#SoloX'
         limitedTimeNavLink.className = 'nav-item'
         limitedTimeNavLink.dataset.categoryName = 'SoloX'
         limitedTimeNavLink.textContent = 'Solo X Horas'

         const firstNavItem = navigationMenu.querySelector('.nav-item')
         navigationMenu.insertBefore(limitedTimeNavLink, firstNavItem.nextSibling)
      }

      // Filtrar y ordenar productos visibles
      const visibleProducts = productsData
         .filter((product) => {
            const startDateTime = new Date(product.startDate)
            const endDateTime = new Date(product.endDate)
            const currentTime = new Date()

            const isVisible = !product.isProductHidden
            const isWithinDateRange = currentTime >= startDateTime && currentTime <= endDateTime

            return isVisible && isWithinDateRange
         })
         .sort((productA, productB) => productA.orderSellout - productB.orderSellout)

      // Renderizar cada producto individual
      visibleProducts.forEach((productData) => {
         const stateStyles = getProductStateStyles(productData.offerState, productData.endDate)
         const productCardClone = productCardTemplate.content.cloneNode(true)

         // Obtener elementos del template
         const productLink = productCardClone.querySelector('.template__link')
         const productImage = productCardClone.querySelector('.template__image')
         const productTitle = productCardClone.querySelector('.template__title')
         const productTag = productCardClone.querySelector('.template__tag')

         // Configurar enlace del producto
         productLink.href = productData.urlProduct
         productLink.dataset.title = productData.title

         const isLimitedTime = /SOLO X \d+ HORAS/i.test(productData.offerState)
         productLink.dataset.category = isLimitedTime
            ? `${productData.category} SoloX`
            : productData.category

         // Configurar imagen del producto
         productImage.src = productData.urlImage
         productImage.alt = productData.title || 'Product Image'
         productImage.style.border = `${stateStyles.borderWidth} solid ${stateStyles.borderColor}`

         // Configurar título del producto con resaltado
         productTitle.innerHTML = applyTextHighlighting(productData.title || '')

         // Configurar etiqueta del producto (tag)
         if (stateStyles.displayText || stateStyles.hasCountdown) {
            productTag.style.backgroundColor = stateStyles.backgroundColor
            productTag.style.color = stateStyles.textColor

            if (stateStyles.hasCountdown) {
               const countdownTimerId = initializeCountdownTimer(productData.endDate, productTag, productImage)
               if (countdownTimerId) {
                  activeCountdownTimers.set(productTag, countdownTimerId)
               }
            } else {
               productTag.innerHTML = stateStyles.displayText
            }
         } else {
            productTag.remove()
         }

         documentFragment.appendChild(productCardClone)
      })

      productsContainer.appendChild(documentFragment)

      // Animar elementos para mostrarlos gradualmente
      setTimeout(() => {
         productsContainer.classList.add('categorias-container--show')
         navigationMenu.style.transition = 'opacity 0.5s ease-in-out'
         navigationMenu.classList.add('nav--visible')
         seoContentContainer.classList.add('seo--visible')

         // Disparar evento personalizado para indicar que la navegación está lista
         document.dispatchEvent(new Event('navLoaded'))
      }, 100)
   }

   // ================================
   // OBTENCIÓN DE DATOS
   // ================================

   // Carga el catálogo de productos desde el servidor
   const loadProductCatalog = async () => {
      try {
         // Mostrar skeletons mientras carga
         displaySkeletonLoaders()

         const response = await fetch(PRODUCTS_DATA_URL)
         const productsData = await response.json()

         // Validar que los datos sean un array válido
         if (!Array.isArray(productsData)) {
            console.error('Estructura de datos de productos inválida:', productsData)
            return
         }

         // Ocultar skeletons y mostrar productos reales
         skeletonLoadingContainer.style.display = 'none'
         renderProductCatalog(productsData)

      } catch (fetchError) {
         console.error('Error al cargar el catálogo de productos:', fetchError)
      }
   }

   // ================================
   // MANEJADORES DE EVENTOS
   // ================================

   // Limpiar temporizadores al cerrar la página para evitar memory leaks
   window.addEventListener('beforeunload', () => {
      activeCountdownTimers.forEach((timerId) => clearInterval(timerId))
   })

   // Inicializar la aplicación
   await loadProductCatalog()
})