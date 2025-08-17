import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  suggestions?: string[];
}

export default function PlaceholderPage({
  title,
  description,
  suggestions = [],
}: PlaceholderPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className="text-center bg-white/80 backdrop-blur-sm border-scotland-thistle/20">
        <CardContent className="p-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-vibrant-blue to-scotland-loch flex items-center justify-center">
            <Construction className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold mb-4">
            <span className="bg-gradient-to-r from-vibrant-blue to-scotland-loch bg-clip-text text-transparent">
              {title}
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {description}
          </p>

          {suggestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Coming Soon:</h3>
              <ul className="text-left max-w-md mx-auto space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-center text-muted-foreground"
                  >
                    <span className="w-2 h-2 bg-scotland-thistle rounded-full mr-3"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild>
              <Link to="/journal">View Our Journey</Link>
            </Button>
          </div>

          <div className="mt-8 p-4 bg-scotland-mist/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              🏴󠁧󠁢󠁳󠁣󠁴󠁿 This page is under development. Continue prompting to help us
              build out more features for A Wee Adventure!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
