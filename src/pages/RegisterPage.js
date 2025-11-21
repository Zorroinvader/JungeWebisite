// FILE OVERVIEW
// - Purpose: Wrapper page that renders the registration form for creating a new user account.
// - Used by: Route '/register' in App.js; linked from login/register flows and guest event request modal.
// - Notes: Production auth page; delegates all logic/UI to RegisterForm.

import React from 'react'
import RegisterForm from '../components/Auth/RegisterForm'

const RegisterPage = () => {
  return <RegisterForm />
}

export default RegisterPage
