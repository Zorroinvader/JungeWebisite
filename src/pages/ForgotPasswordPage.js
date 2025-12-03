// FILE OVERVIEW
// - Purpose: Wrapper page that renders the forgot password form for password recovery.
// - Used by: Route '/forgot-password' in App.js; linked from login form.
// - Notes: Production auth page; delegates all logic/UI to ForgotPasswordForm.

import React from 'react'
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm'

const ForgotPasswordPage = () => {
  return <ForgotPasswordForm />
}

export default ForgotPasswordPage


