import { Link } from '@tanstack/react-router'
import { Greeting } from './modules/dashboard/components/greeting'
import { DashboardHero } from './modules/dashboard/components/hero'
import { Title } from './modules/dashboard/components/title'
import { GlanceCard, RankProgressCard } from './components/glance-cards'
import PasswordField from './components/button'

export default function App() {
  return (
    <main className="bg-[#F2F4F9] min-h-screen">
      {/* Top Navigation Pill */}
      <nav className="flex justify-center pt-4 px-5">
        <div className="flex bg-white rounded-3xl shadow-sm border border-gray-100 p-1 gap-1">
          <Link
            to="/"
            className="px-5 py-2 rounded-3xl text-sm font-semibold transition-all duration-200"
            activeProps={{ className: 'px-5 py-2 rounded-3xl text-sm font-semibold transition-all duration-200 bg-[#062A63] text-white shadow-sm' }}
            inactiveProps={{ className: 'px-5 py-2 rounded-3xl text-sm font-semibold transition-all duration-200 text-gray-400 hover:text-[#062A63]' }}
          >
            Dashboard
          </Link>
          <Link
            to="/red"
            className="px-5 py-2 rounded-3xl text-sm font-semibold transition-all duration-200"
            activeProps={{ className: 'px-5 py-2 rounded-3xl text-sm font-semibold transition-all duration-200 bg-[#062A63] text-white shadow-sm' }}
            inactiveProps={{ className: 'px-5 py-2 rounded-3xl text-sm font-semibold transition-all duration-200 text-gray-400 hover:text-[#062A63]' }}
          >
            Mi Red
          </Link>
        </div>
      </nav>

      <section className="dashboard-hero-container">
        <DashboardHero />
        <Greeting name="" />
      </section>

      <section className="my-8 px-5">
        <Title />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <GlanceCard title="PV Personal" value="999,999,999" />
          <GlanceCard title="CV Personal" value="999,999,999" />
        </div>

        <div className="mt-4">
          <RankProgressCard currentVg={50000} targetVg={100000} nextRank="Diamante" daysLeft={13} />
        </div>

        <PasswordField />
      </section>
    </main>
  )
}
