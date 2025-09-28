// Evento que se ejecuta cuando la navegación está completamente cargada
document.addEventListener('navLoaded', () => {
   // Elementos del DOM
   const nav = document.querySelector('.nav')
   const navItems = document.querySelectorAll('.nav-item')
   const productLinks = document.querySelectorAll('.template__link')
   const banner = document.querySelector('.banner')
   const viewAllButton = document.querySelector('[data-category-name="VerTodo"]')

   // Muestra todos los productos
   const showAllProducts = () => {
      productLinks.forEach((product) => {
         product.style.display = 'block'
      })
   }

   // Volver a mostrar todos los productos
   function backToAllProducts() {
      const verTodoItem = document.querySelector('[data-category-name="VerTodo"]');
      if (verTodoItem) {
         verTodoItem.click();
      }
   }

   // Filtra productos por categoría
   const filterByCategory = (category) => {
      let visibleCount = 0;

      productLinks.forEach((product) => {
         const productCategoryAttr = product.getAttribute('data-category') || ''
         const productCategories = productCategoryAttr.split(' ')

         if (productCategories.includes(category)) {
            product.style.display = "block"
            visibleCount++
         } else {
            product.style.display = "none"
         }
      })

      // Mostrar/ocultar mensaje de estado vacío
      if (visibleCount === 0) {
         const emptyMessage = document.querySelector('.empty-state');
         const emptyButton = document.querySelector('.empty-state__btn');
         emptyMessage.style.display = "block"

         emptyButton.addEventListener("click", backToAllProducts)
      } else {
         const emptyMessage = document.querySelector('.empty-state');
         emptyMessage.style.display = 'none';
      }
   }

   // Inicializar mostrando todos los productos
   showAllProducts()

   // Eventos de clic para elementos de navegación
   navItems.forEach((item) => {
      item.addEventListener('click', (event) => {
         event.preventDefault()
         const selectedCategory = item.getAttribute('data-category-name')

         // Remover clases activas
         navItems.forEach((navItem) =>
            navItem.classList.remove('nav-item--selected', 'nav-item--view-all')
         )

         if (selectedCategory === 'VerTodo') {
            showAllProducts()
            item.classList.add('nav-item--view-all')
         } else {
            filterByCategory(selectedCategory)
         }

         item.classList.add('nav-item--selected')

         // Scroll suave hacia el elemento seleccionado (Mobile)
         nav.scrollTo({
            left: item.offsetLeft - nav.offsetLeft,
            behavior: 'smooth',
         })
      })
   })

   // Evento de clic en el banner
   banner.addEventListener('click', () => {
      showAllProducts()

      navItems.forEach((item) =>
         item.classList.remove('nav-item--selected', 'nav-item--view-all')
      )

      viewAllButton.classList.add('nav-item--selected', 'nav-item--view-all')
      nav.scrollTo({
         left: viewAllButton.offsetLeft - nav.offsetLeft,
         behavior: 'smooth',
      })
   })
})