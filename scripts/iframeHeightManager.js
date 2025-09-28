let lastHeight = 0
let observer
function notifyParent() {
   let container = document.querySelector('.main__container')
   if (container) {
      let height = container.getBoundingClientRect().height
      if (height > 0 && height !== lastHeight) {
         window.parent.postMessage(height, '*')
         lastHeight = height
      }
   }
}
window.addEventListener('load', () => {
   notifyParent()
})
document.addEventListener('navLoaded', () => {
   notifyParent()
   startObserver()
})
function startObserver() {
   let targetNode = document.querySelector('.main__container')
   let config = { attributes: !0, childList: !0, subtree: !0 }
   if (targetNode) {
      observer = new MutationObserver(notifyParent)
      observer.observe(targetNode, config)
   }
}
setTimeout(() => {
   notifyParent()
   startObserver()
}, 4000)
