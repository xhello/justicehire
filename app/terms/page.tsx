import Link from 'next/link'
import BackButton from '@/components/BackButton'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BackButton />
              <Link
                href="/"
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center"
                title="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-blue-600 rounded-md shadow-md transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service & Disclaimer</h1>
          
          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Justice Hire ("the Website" or "the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Disclaimer of Liability</h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                <strong>IMPORTANT: Justice Hire and its operators cannot and will not be held accountable for any legal liability arising from the use of this platform.</strong>
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                The information, content, and reviews posted on Justice Hire are provided "as is" without any representations or warranties, express or implied. Justice Hire makes no representations or warranties in relation to the accuracy, completeness, reliability, or suitability of any information, content, or reviews on this website.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                To the fullest extent permitted by law, Justice Hire, its owners, operators, employees, agents, and affiliates hereby disclaim all liability for any loss, damage, cost, or expense (including, without limitation, direct, indirect, incidental, special, consequential, or punitive damages) arising out of or in connection with:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed mt-3 space-y-2 ml-4">
                <li>The use of or inability to use the Website</li>
                <li>Any content, reviews, or information posted on the Website</li>
                <li>Any errors or omissions in the content</li>
                <li>Any defamation, libel, slander, or other claims arising from user-generated content</li>
                <li>Any disputes between users of the platform</li>
                <li>Any decisions made based on information obtained from the Website</li>
                <li>Any unauthorized access to or use of the Website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User-Generated Content</h2>
              <p className="text-gray-700 leading-relaxed">
                Justice Hire is a platform that allows users to post reviews and other content. We do not endorse, support, represent, or guarantee the truthfulness, accuracy, or reliability of any user-submitted content. Users are solely responsible for the content they post, and Justice Hire assumes no responsibility or liability for any content posted by users.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                By using this service, you acknowledge that you may be exposed to content that is offensive, indecent, objectionable, or otherwise inappropriate. Justice Hire is not responsible for such content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. No Legal Advice</h2>
              <p className="text-gray-700 leading-relaxed">
                The information on this Website is not intended to constitute legal advice. Nothing on this Website should be construed as legal, financial, or professional advice. You should consult with appropriate professionals for advice specific to your situation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                In no event shall Justice Hire, its owners, operators, employees, agents, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of or inability to use the Website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Justice Hire, its owners, operators, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from your use of the Website or your violation of these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                Justice Hire reserves the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page. Your continued use of the Website after any such changes constitutes your acceptance of the new Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through the appropriate channels provided on the Website.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}
