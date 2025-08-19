import { Link } from "react-router-dom";

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Test Page</h1>
        <p className="text-xl text-gray-600 mb-8">
          Navigation is working! 🎉
        </p>
        <div className="space-y-4">
          <div>
            <Link 
              to="/" 
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
          <div>
            <Link 
              to="/journal" 
              className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Go to Journal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
