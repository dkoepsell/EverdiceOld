import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Copy, Globe, Lock, Share2, Users } from "lucide-react";

interface CampaignDeployPanelProps {
  campaign: any;
}

export default function CampaignDeployPanel({ campaign }: CampaignDeployPanelProps) {
  const { toast } = useToast();
  const [deploySettings, setDeploySettings] = useState({
    isPrivate: campaign.isPrivate ?? true,
    maxPlayers: campaign.maxPlayers ?? 6
  });

  // Generate or regenerate deployment code
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST", 
        `/api/campaigns/${campaign.id}/deploy/generate-code`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      // Update cache with new deployment code
      queryClient.setQueryData([`/api/campaigns/${campaign.id}`], (oldData: any) => {
        return { ...oldData, deploymentCode: data.deploymentCode };
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      toast({
        title: "Deployment code generated",
        description: "Your new campaign code is ready to share with players.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate code",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Publish or unpublish campaign
  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const response = await apiRequest(
        "POST", 
        `/api/campaigns/${campaign.id}/deploy/${publish ? 'publish' : 'unpublish'}`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      // Update cache with publishing status
      queryClient.setQueryData([`/api/campaigns/${campaign.id}`], (oldData: any) => {
        return { 
          ...oldData,
          isPublished: data.isPublished,
          publishedAt: data.publishedAt
        };
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      toast({
        title: data.isPublished ? "Campaign Published" : "Campaign Unpublished",
        description: data.isPublished 
          ? "Your campaign is now available for players to join" 
          : "Your campaign is no longer available to new players",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update deployment settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { isPrivate?: boolean; maxPlayers?: number }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/campaigns/${campaign.id}/deploy/settings`,
        settings
      );
      return await response.json();
    },
    onSuccess: (data) => {
      // Update cache with new settings
      queryClient.setQueryData([`/api/campaigns/${campaign.id}`], (oldData: any) => {
        return { 
          ...oldData,
          isPrivate: data.isPrivate,
          maxPlayers: data.maxPlayers
        };
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      toast({
        title: "Settings Updated",
        description: "Your campaign deployment settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Settings",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePrivacyToggle = () => {
    const newValue = !deploySettings.isPrivate;
    setDeploySettings(prev => ({ ...prev, isPrivate: newValue }));
    updateSettingsMutation.mutate({ isPrivate: newValue });
  };

  const handleMaxPlayersChange = (value: number[]) => {
    const newValue = value[0];
    setDeploySettings(prev => ({ ...prev, maxPlayers: newValue }));
    updateSettingsMutation.mutate({ maxPlayers: newValue });
  };

  const handleCopyCode = () => {
    if (campaign.deploymentCode) {
      navigator.clipboard.writeText(campaign.deploymentCode);
      toast({
        title: "Code Copied",
        description: "Deployment code copied to clipboard",
      });
    }
  };

  // Create join URL
  const joinUrl = `${window.location.origin}/campaigns/join?code=${campaign.deploymentCode}`;
  
  const handleCopyJoinLink = () => {
    if (campaign.deploymentCode) {
      navigator.clipboard.writeText(joinUrl);
      toast({
        title: "Link Copied",
        description: "Join link copied to clipboard",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-fantasy">Campaign Deployment</CardTitle>
        <CardDescription>
          Publish your campaign and allow players to join your adventure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Publication Status */}
        <div className="flex justify-between items-center">
          <div>
            <Label className="text-base">Publication Status</Label>
            <p className="text-sm text-muted-foreground">
              {campaign.isPublished 
                ? `Published on ${new Date(campaign.publishedAt).toLocaleDateString()}` 
                : "Not yet published"}
            </p>
          </div>
          <Button 
            variant={campaign.isPublished ? "destructive" : "default"}
            onClick={() => publishMutation.mutate(!campaign.isPublished)}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending 
              ? "Processing..." 
              : campaign.isPublished 
                ? "Unpublish" 
                : "Publish Campaign"}
          </Button>
        </div>

        {/* Deployment Settings */}
        <div className="space-y-3 pt-2">
          <h3 className="font-medium">Deployment Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Campaign Privacy</Label>
              <p className="text-xs text-muted-foreground">
                {deploySettings.isPrivate 
                  ? "Private (requires code to join)" 
                  : "Public (anyone can find and join)"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className={`h-4 w-4 ${!deploySettings.isPrivate ? "text-primary" : "text-muted-foreground"}`} />
              <Switch 
                checked={deploySettings.isPrivate} 
                onCheckedChange={handlePrivacyToggle}
                disabled={updateSettingsMutation.isPending}
              />
              <Lock className={`h-4 w-4 ${deploySettings.isPrivate ? "text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Maximum Players</Label>
              <span className="text-sm font-medium">{deploySettings.maxPlayers}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[deploySettings.maxPlayers]}
                min={1}
                max={10}
                step={1}
                onValueChange={handleMaxPlayersChange}
                disabled={updateSettingsMutation.isPending}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Limit how many players can join your campaign
            </p>
          </div>
        </div>

        {/* Deployment Code */}
        <div className="space-y-3 pt-2">
          <h3 className="font-medium">Deployment Code</h3>
          <div className="flex items-center space-x-2">
            <Input 
              value={campaign.deploymentCode || "No code generated yet"} 
              readOnly
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopyCode}
              disabled={!campaign.deploymentCode}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Share this code with players you want to invite
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => generateCodeMutation.mutate()}
              disabled={generateCodeMutation.isPending}
            >
              {campaign.deploymentCode ? "Regenerate Code" : "Generate Code"}
            </Button>
          </div>
        </div>

        {/* Join Link */}
        {campaign.deploymentCode && (
          <div className="space-y-3 pt-2">
            <h3 className="font-medium">Join Link</h3>
            <div className="flex items-center space-x-2">
              <Input 
                value={joinUrl} 
                readOnly
                className="text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyJoinLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link for easy access to your campaign
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 pt-3">
        <div className="w-full text-center">
          <p className="text-sm">
            <Share2 className="h-4 w-4 inline-block mr-1" />
            {campaign.isPublished 
              ? `Your campaign is available for ${deploySettings.isPrivate ? 'invited' : 'all'} players` 
              : "Publish your campaign to allow players to join"}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}