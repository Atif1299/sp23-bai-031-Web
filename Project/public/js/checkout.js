$(document).ready(function () {
  const form = $('#checkout-form')
  const isCreditCardSelected = () => $('#credit-card').is(':checked')

  // --- Helper Functions for Validation ---
  function displayError(fieldId, message) {
    const field = $(`#${fieldId}`)
    const errorElement = $(`#error-${fieldId}`)
    field.addClass('input-error')
    errorElement.text(message).show()
  }

  function clearError(fieldId) {
    const field = $(`#${fieldId}`)
    const errorElement = $(`#error-${fieldId}`)
    field.removeClass('input-error')
    errorElement.text('').hide()
  }

  function clearAllErrors() {
    $('.error-message').text('').hide()
    $('.input-error').removeClass('input-error')
  }

  // --- Future Date Validation for Expiry ---
  function isValidExpiryDate(expiry) {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/)
    if (!match) return false // Invalid format

    const month = parseInt(match[1], 10)
    const year = parseInt(`20${match[2]}`, 10) // Assume 20xx

    if (month < 1 || month > 12) return false // Invalid month

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JS months are 0-indexed

    // Check if the year is in the past OR
    // if the year is the current year AND the month is in the past
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false
    }

    return true
  }

  // --- Main Validation Function ---
  function validateForm() {
    clearAllErrors()
    let isValid = true

    // 1. Full Name (Required, Alphabets/Spaces only)
    const fullName = $('#full-name')
    const fullNamePattern = new RegExp(fullName.attr('pattern')) // Use pattern from HTML
    if (fullName.val().trim() === '') {
      displayError('full-name', 'Full Name is required.')
      isValid = false
    } else if (!fullNamePattern.test(fullName.val())) {
      displayError('full-name', 'Please enter only letters and spaces.')
      isValid = false
    }

    // 2. Email (Required, Valid Format)
    const email = $('#email')
    // Basic check for presence and HTML5 validity state
    if (email.val().trim() === '') {
      displayError('email', 'Email is required.')
      isValid = false
    } else if (!email[0].checkValidity()) {
      // Use native checkValidity for type=email
      displayError('email', 'Please enter a valid email address.')
      isValid = false
    }

    // 3. Phone Number (Required, Digits only, Length)
    const phone = $('#phone')
    const phonePattern = new RegExp(phone.attr('pattern')) // Digits only pattern
    const minLength = parseInt(phone.attr('minlength'), 10)
    const maxLength = parseInt(phone.attr('maxlength'), 10)
    const phoneVal = phone.val().trim()
    if (phoneVal === '') {
      displayError('phone', 'Phone number is required.')
      isValid = false
    } else if (!phonePattern.test(phoneVal)) {
      displayError('phone', 'Please enter only digits.')
      isValid = false
    } else if (phoneVal.length < minLength || phoneVal.length > maxLength) {
      displayError(
        'phone',
        `Phone number must be between ${minLength} and ${maxLength} digits.`
      )
      isValid = false
    }

    // 4. Address (Required)
    const address = $('#address')
    if (address.val().trim() === '') {
      displayError('address', 'Address is required.')
      isValid = false
    }

    // 5. Credit Card Fields (Only if CC payment is selected)
    if (isCreditCardSelected()) {
      // 5a. Card Number (Required, 16 digits)
      const ccNumber = $('#cc-number')
      const ccNumberPattern = new RegExp(ccNumber.attr('pattern')) // 16 digits pattern
      if (ccNumber.val().trim() === '') {
        displayError('cc-number', 'Credit Card Number is required.')
        isValid = false
      } else if (!ccNumberPattern.test(ccNumber.val())) {
        displayError('cc-number', 'Please enter exactly 16 digits.')
        isValid = false
      }

      // 5b. Expiry Date (Required, MM/YY format, Future date)
      const ccExpiry = $('#cc-expiry')
      const expiryVal = ccExpiry.val().trim()
      if (expiryVal === '') {
        displayError('cc-expiry', 'Expiry Date is required.')
        isValid = false
      } else if (!ccExpiry[0].checkValidity()) {
        // Checks pattern MM/YY
        displayError('cc-expiry', 'Please use MM/YY format.')
        isValid = false
      } else if (!isValidExpiryDate(expiryVal)) {
        displayError('cc-expiry', 'Expiry date must be in the future.')
        isValid = false
      }

      // 5c. CVV (Required, 3 digits)
      const ccCvv = $('#cc-cvv')
      const ccCvvPattern = new RegExp(ccCvv.attr('pattern')) // 3 digits pattern
      if (ccCvv.val().trim() === '') {
        displayError('cc-cvv', 'CVV is required.')
        isValid = false
      } else if (!ccCvvPattern.test(ccCvv.val())) {
        displayError('cc-cvv', 'Please enter exactly 3 digits.')
        isValid = false
      }
    } // End Credit Card Validation

    return isValid
  }

  // --- Form Submission Handler ---
  form.on('submit', function (event) {
    event.preventDefault() // Prevent default submission ALWAYS first

    if (validateForm()) {
      // If validation passes:
      alert('Form submitted successfully! (Simulation)')

      // Reset the form fields
      form[0].reset() // Use native reset method

      // Clear any lingering error styles/messages
      clearAllErrors()

      // Optionally hide the CC details again if they were shown
      if (isCreditCardSelected()) {
        $('#cc-details').slideUp()
      }

      // In a real application, you would now send data to the server via AJAX
      // console.log('Form Data:', form.serialize());
    } else {
      // If validation fails:
      console.log('Form validation failed.')
      // Errors are already displayed by validateForm()
    }
  })

  // --- Show/Hide Credit Card Details ---
  $('input[name="payment_method"]').on('change', function () {
    if (isCreditCardSelected()) {
      $('#cc-details').slideDown()
      // Make CC fields required when shown (important for validation logic)
      $('#cc-number, #cc-expiry, #cc-cvv').prop('required', true)
    } else {
      $('#cc-details').slideUp()
      // Make CC fields NOT required when hidden
      $('#cc-number, #cc-expiry, #cc-cvv').prop('required', false)
      // Clear any errors specific to CC fields when hiding
      clearError('cc-number')
      clearError('cc-expiry')
      clearError('cc-cvv')
    }
  })

  // --- Show/Hide Billing Address Details ---
  $('input[name="billing_address"]').on('change', function () {
    if ($('#billing-different').is(':checked')) {
      $('#billing-details').slideDown()
      // Add required attributes and validation logic for these fields if needed
    } else {
      $('#billing-details').slideUp()
      // Remove required attributes and clear errors for these fields if needed
    }
  })

  // --- Discount Code Placeholder ---
  $('.btn-apply-discount').on('click', function () {
    // This functionality remains basic as it wasn't part of the lab requirements
    const code = $('#discount-code').val().trim()
    if (code) {
      alert('Discount code functionality not implemented in this version.')
    } else {
      alert('Please enter a discount code.')
    }
  })
}) // End document ready
