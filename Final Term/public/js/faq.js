document.addEventListener('DOMContentLoaded', function () {
  const accordionItems = document.querySelectorAll('.accordion-item')

  accordionItems.forEach((item) => {
    const summary = item.querySelector('.accordion-header')
    const content = item.querySelector('.accordion-content')
    const plusIcon = item.querySelector('.plus-icon')
    const minusIcon = item.querySelector('.minus-icon')

    // Set initial state: content hidden, plus icon visible
    content.style.maxHeight = '0'
    plusIcon.style.display = 'block'
    minusIcon.style.display = 'none'

    summary.addEventListener('click', function (event) {
      // Prevent default toggle behavior of <details>
      event.preventDefault()

      // Toggle the 'open' attribute
      if (item.hasAttribute('open')) {
        item.removeAttribute('open')
        content.style.maxHeight = '0'
        plusIcon.style.display = 'block'
        minusIcon.style.display = 'none'
      } else {
        // Close all other open accordion items
        accordionItems.forEach((otherItem) => {
          if (otherItem !== item && otherItem.hasAttribute('open')) {
            otherItem.removeAttribute('open')
            otherItem.querySelector('.accordion-content').style.maxHeight = '0'
            otherItem.querySelector('.plus-icon').style.display = 'block'
            otherItem.querySelector('.minus-icon').style.display = 'none'
          }
        })

        item.setAttribute('open', '')
        content.style.maxHeight = content.scrollHeight + 'px' // Set max-height to content's scrollHeight
        plusIcon.style.display = 'none'
        minusIcon.style.display = 'block'
      }
    })

    // Ensure content height is correct on window resize
    window.addEventListener('resize', () => {
      if (item.hasAttribute('open')) {
        content.style.maxHeight = content.scrollHeight + 'px'
      }
    })
  })
})
