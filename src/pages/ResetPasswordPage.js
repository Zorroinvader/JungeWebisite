// FILE OVERVIEW
// - Purpose: Wrapper page that renders the reset password form for setting new password after email link.
// - Used by: Route '/reset-password' in App.js; accessed via password reset email link.
// - Notes: Production auth page; delegates all logic/UI to ResetPasswordForm.

import React from 'react'
import ResetPasswordForm from '../components/Auth/ResetPasswordForm'

const ResetPasswordPage = () => {
  return <ResetPasswordForm />
}

export default ResetPasswordPage

