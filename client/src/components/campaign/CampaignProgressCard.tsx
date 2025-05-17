import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Campaign, CampaignSession } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Sparkle, Coins, Scroll, Dices, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignProgressCardProps {
  campaignId: number;
}

export default function CampaignProgressCard({ campaignId }: CampaignProgressCardProps) {
  const [totalXp, setTotalXp] = useState(0);
  const [totalGold, setTotalGold] = useState(0);
  const [totalItems, setTotalItems] = useState<string[]>([]);
  const [hasCombat, setHasCombat] = useState(false);
  const [recentSession, setRecentSession] = useState<CampaignSession | null>(null);
  
  // Fetch campaign sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<CampaignSession[]>({
    queryKey: [`/api/campaigns/${campaignId}/sessions`],
    enabled: !!campaignId,
  });
  
  // Calculate totals whenever sessions change
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      // Calculate totals
      let xp = 0;
      let gold = 0;
      const items: string[] = [];
      let combat = false;
      
      // Get the most recent session
      const latestSession = sessions[sessions.length - 1];
      setRecentSession(latestSession);
      
      // Check if recent session has active combat
      if (latestSession.hasCombat === true) {
        combat = true;
      }
      
      // Sum up all rewards
      sessions.forEach(session => {
        // Add XP if present
        if (session.sessionXpReward) {
          xp += session.sessionXpReward;
        }
        
        // Add gold if present
        if (session.goldReward) {
          gold += session.goldReward;
        }
        
        // Add items if present
        if (session.itemRewards && Array.isArray(session.itemRewards) && session.itemRewards.length > 0) {
          session.itemRewards.forEach(item => {
            if (!items.includes(item)) {
              items.push(item);
            }
          });
        }
      });
      
      // Update states
      setTotalXp(xp);
      setTotalGold(gold);
      setTotalItems(items);
      setHasCombat(combat);
    }
  }, [sessions]);
  
  if (sessionsLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span>Adventure Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If no sessions, return null or a "no progress yet" card
  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>No Adventure Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Start or continue a campaign to track your adventure progress.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span>Adventure Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XP Total */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium">
              <Sparkle className="h-4 w-4 mr-1 text-blue-500" />
              <span>Experience Points</span>
            </div>
            <span className="text-sm font-bold">{totalXp} XP</span>
          </div>
          <Progress value={Math.min(totalXp / 10, 100)} className="h-2" />
        </div>
        
        {/* Gold Total */}
        {totalGold > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium">
              <Coins className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Gold Collected</span>
            </div>
            <span className="text-sm font-bold">{totalGold} GP</span>
          </div>
        )}
        
        {/* Items Collected */}
        {totalItems.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center text-sm font-medium">
              <Scroll className="h-4 w-4 mr-1 text-emerald-500" />
              <span>Items Found ({totalItems.length})</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {totalItems.slice(0, 3).map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-primary/5">
                  {item}
                </Badge>
              ))}
              {totalItems.length > 3 && (
                <Badge variant="outline" className="text-xs bg-primary/5">
                  +{totalItems.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Combat Status */}
        {hasCombat && (
          <div className="bg-red-50 p-2 rounded-md border border-red-200 flex items-center">
            <Dices className="h-4 w-4 mr-2 text-red-600" />
            <span className="text-sm text-red-700 font-medium">Combat in progress!</span>
          </div>
        )}
      </CardContent>
      
      {/* Latest Session Info */}
      {recentSession && (
        <CardFooter className="pt-0">
          <div className="text-xs text-muted-foreground">
            Latest Session: {recentSession.title} 
            {recentSession.sessionXpReward ? ` (${recentSession.sessionXpReward} XP)` : ''}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}