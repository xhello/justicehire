import { listBusinesses } from '../actions/business'
import SignupForm from './SignupForm'

export default async function SignupPage() {
  const businesses = await listBusinesses({})

  return <SignupForm businesses={businesses} />
}
