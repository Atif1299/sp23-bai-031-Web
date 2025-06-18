document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form')
  const firstNameInput = document.getElementById('firstName')
  const lastNameInput = document.getElementById('lastName')
  const emailInput = document.getElementById('email')
  const messageInput = document.getElementById('message')

  function validateForm() {
    let isValid = true

    if (!firstNameInput.value.trim()) {
      isValid = false
      alert('First name is required')
    }

    if (!emailInput.value.trim()) {
      isValid = false
      alert('Email is required')
    } else if (!isValidEmail(emailInput.value.trim())) {
      isValid = false
      alert('Invalid email format')
    }

    if (!messageInput.value.trim()) {
      isValid = false
      alert('Message is required')
    }

    return isValid
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault()

    if (validateForm()) {
      // Prepare form data as JSON
      const payload = {
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        email: emailInput.value,
        message: messageInput.value,
      }

      // Send form data to the server as JSON
      fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert('Message sent successfully!')
            form.reset() // Clear the form
          } else {
            alert('Message sending failed: ' + data.message)
          }
        })
        .catch((error) => {
          console.error('Error:', error)
          alert('An error occurred while sending the message.')
        })
    }
  })
})
