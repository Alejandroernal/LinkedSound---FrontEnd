import { useState } from 'react'
import './App.css'
import DashboardPage from './pages/DashboardPage'
import MessagesPage from './pages/MessagesPage'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ValidationPage from './pages/ValidationPage'
import type { AppPage } from './types'

function App() {
  const [activePage, setActivePage] = useState<AppPage>('Login')

  switch (activePage) {
    case 'Messages':
      return <MessagesPage activePage={activePage} onNavigate={setActivePage} />
    case 'Explorer':
      return <ExplorePage activePage={activePage} onNavigate={setActivePage} />
    case 'Profile':
      return <ProfilePage activePage={activePage} onNavigate={setActivePage} />
    case 'Register':
      return <RegisterPage onNavigate={setActivePage} />
    case 'Validation':
      return <ValidationPage onNavigate={setActivePage} />
    case 'Login':
    case 'Discovery':
    default:
      if (activePage === 'Login') {
        return <LoginPage onNavigate={setActivePage} />
      }
      return <DashboardPage activePage={activePage} onNavigate={setActivePage} />
  }
}

export default App
