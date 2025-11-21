// FILE OVERVIEW
// - Purpose: Wrapper page that renders the login form for users to sign into the application.
// - Used by: Route '/login' in App.js; linked from header, auth redirects, and protected route guards.
// - Notes: Production auth page; delegates all logic/UI to LoginForm.

import React from 'react'
import LoginForm from '../components/Auth/LoginForm'

const LoginPage = () => {
  return <LoginForm />
}

export default LoginPage
