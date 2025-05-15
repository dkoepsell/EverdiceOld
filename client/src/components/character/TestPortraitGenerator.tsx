import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";

export default function TestPortraitGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateTestPortrait = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/test-portrait-generation");
      const data = await response.json();
      
      if (data.success && data.url) {
        setPortraitUrl(data.url);
      } else {
        setError(data.message || "Failed to generate portrait");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate portrait");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test Portrait Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Button 
            onClick={generateTestPortrait}
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Test Portrait
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="bg-destructive/10 p-4 rounded border border-destructive text-destructive">
            {error}
          </div>
        )}
        
        {portraitUrl && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Generated Portrait:</h3>
            <div className="aspect-square max-w-md mx-auto border rounded-md overflow-hidden">
              <img 
                src={portraitUrl} 
                alt="Generated character portrait" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}