import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ApiTester() {
  const [campaignId, setCampaignId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const { toast } = useToast();

  const testArchive = async () => {
    if (!campaignId || isNaN(parseInt(campaignId))) {
      toast({
        title: "Invalid campaign ID",
        description: "Please enter a valid campaign ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/archive`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      
      // Refresh campaigns data
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/archived"] });
      
      toast({
        title: "Campaign Archived",
        description: "Campaign was successfully archived",
      });
    } catch (error) {
      console.error("Archive error:", error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: `Archive failed: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testComplete = async () => {
    if (!campaignId || isNaN(parseInt(campaignId))) {
      toast({
        title: "Invalid campaign ID",
        description: "Please enter a valid campaign ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/complete`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      
      // Refresh campaigns data
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      
      toast({
        title: "Campaign Completed",
        description: "Campaign was successfully marked as completed",
      });
    } catch (error) {
      console.error("Complete error:", error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: `Complete failed: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testRestore = async () => {
    if (!campaignId || isNaN(parseInt(campaignId))) {
      toast({
        title: "Invalid campaign ID",
        description: "Please enter a valid campaign ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/restore`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      
      // Refresh campaigns data
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/archived"] });
      
      toast({
        title: "Campaign Restored",
        description: "Campaign was successfully restored from archive",
      });
    } catch (error) {
      console.error("Restore error:", error);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: `Restore failed: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>API Endpoint Tester</CardTitle>
        <CardDescription>Test campaign archive and complete endpoints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              type="number" 
              placeholder="Campaign ID" 
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={testArchive} disabled={isLoading}>
              Test Archive
            </Button>
            <Button onClick={testComplete} disabled={isLoading}>
              Test Complete
            </Button>
            <Button onClick={testRestore} disabled={isLoading}>
              Test Restore
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Result:</h3>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {result}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}