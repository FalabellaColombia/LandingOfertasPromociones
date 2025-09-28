const seoButton = document.querySelector('.seo__toggle-btn')
const seoContent = document.getElementById('seoContent')

seoButton.addEventListener('click', () => {
   const isHidden =
      seoContent.style.display === 'none' || seoContent.style.display === ''

   seoContent.style.display = isHidden ? 'block' : 'none'
   seoButton.textContent = isHidden ? 'Ver menos' : 'Ver más'
})
