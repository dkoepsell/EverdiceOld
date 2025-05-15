import ApiTester from "@/components/test/ApiTester";
import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TestPortraitGenerator from "@/components/character/TestPortraitGenerator";

export default function TestPage() {
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });
  
  const activeCampaigns = campaigns.filter(campaign => !campaign.isArchived && !campaign.isCompleted);
  const archivedCampaigns = campaigns.filter(campaign => campaign.isArchived);
  const completedCampaigns = campaigns.filter(campaign => !campaign.isArchived && campaign.isCompleted);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">API Testing Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Active Campaigns</span>
              <Badge>{activeCampaigns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-4">
              {activeCampaigns.map(campaign => (
                <li key={campaign.id} className="mb-1">
                  {campaign.title} (ID: {campaign.id})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Archived Campaigns</span>
              <Badge variant="outline">{archivedCampaigns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-4">
              {archivedCampaigns.map(campaign => (
                <li key={campaign.id} className="mb-1">
                  {campaign.title} (ID: {campaign.id})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Completed Campaigns</span>
              <Badge variant="secondary">{completedCampaigns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-4">
              {completedCampaigns.map(campaign => (
                <li key={campaign.id} className="mb-1">
                  {campaign.title} (ID: {campaign.id})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Test Portrait Generator</h2>
        <TestPortraitGenerator />
      </div>
      
      <ApiTester />
    </div>
  );
}