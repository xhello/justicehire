import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { listBusinesses } from '@/app/actions/business'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default async function EmployeeDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'EMPLOYEE') {
    redirect('/dashboard/employer')
  }

  if (!user.verified) {
    redirect('/verify?email=' + user.email)
  }

  const businesses = await listBusinesses({})

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Justice Hire</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Employee Dashboard</h2>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Search Businesses</h3>
          <div className="bg-white rounded-lg shadow p-6">
            <form method="get" action="/business" className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All States</option>
                  <option value="CA">California</option>
                  <option value="OR">Oregon</option>
                </select>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Motel">Motel</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Bar">Bar</option>
                  <option value="Resort">Resort</option>
                  <option value="Casino">Casino</option>
                  <option value="FoodTruck">Food Truck</option>
                  <option value="Catering">Catering</option>
                  <option value="Brewery">Brewery</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">All Businesses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/business/${business.id}`}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <h4 className="font-semibold text-lg">{business.name}</h4>
                <p className="text-sm text-gray-700">{business.city}, {business.state}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {business._count.reviews} reviews
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

