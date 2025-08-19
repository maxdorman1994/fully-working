import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SimpleHome() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Our
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Scottish Adventure
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Follow our family as we explore Scotland. This is a simplified version to test navigation.
        </p>
      </div>

      {/* Navigation Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">📖 Journal</h3>
            <p className="text-gray-600 mb-4">Read about our adventures</p>
            <Button asChild className="w-full">
              <Link to="/journal">Go to Journal</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">📸 Gallery</h3>
            <p className="text-gray-600 mb-4">View our photos</p>
            <Button asChild className="w-full">
              <Link to="/gallery">Go to Gallery</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">🏔️ Munro Bagging</h3>
            <p className="text-gray-600 mb-4">Track our mountain climbs</p>
            <Button asChild className="w-full">
              <Link to="/munro-bagging">Go to Munros</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">🏰 Adventures</h3>
            <p className="text-gray-600 mb-4">Castles and lochs</p>
            <Button asChild className="w-full">
              <Link to="/castles-lochs">Go to Adventures</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">🗺️ Map</h3>
            <p className="text-gray-600 mb-4">See where we've been</p>
            <Button asChild className="w-full">
              <Link to="/map">Go to Map</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">🧪 Test</h3>
            <p className="text-gray-600 mb-4">Test navigation</p>
            <Button asChild className="w-full">
              <Link to="/test">Go to Test</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="text-green-600 font-medium">
          ✅ Navigation is working! Click any card above to test routing.
        </p>
      </div>
    </div>
  );
}
