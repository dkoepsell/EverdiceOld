import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Campaign, CampaignSession } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, MapPin, Target, Milestone, CheckCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CampaignQuestTrackerProps {
  campaignId: number;
}

export default function CampaignQuestTracker({ campaignId }: CampaignQuestTrackerProps) {
  const [mainQuest, setMainQuest] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Array<{text: string, completed: boolean}>>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Fetch campaign sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<CampaignSession[]>({
    queryKey: [`/api/campaigns/${campaignId}/sessions`],
    enabled: !!campaignId,
  });
  
  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${campaignId}`],
    enabled: !!campaignId,
  });
  
  // Extract quest information from lore and narrative
  useEffect(() => {
    if (sessions.length > 0) {
      // Set basic session stats
      setTotalSessions(Math.max(12, sessions.length + 4)); // Estimate total sessions
      setCompletedSessions(sessions.length);
      setProgress(Math.min(100, Math.floor((sessions.length / Math.max(12, sessions.length + 4)) * 100)));
      
      // Extract main quest from opening session or campaign description
      const firstSession = sessions[0];
      if (firstSession?.loreDiscovered) {
        // Try to find quest mentions in first session lore
        setMainQuest(firstSession.loreDiscovered);
      } else if (campaign?.description) {
        setMainQuest(campaign.description);
      }
      
      // Generate milestones based on session progress
      const milestonesArray = [];
      
      // First milestone is always starting the adventure
      milestonesArray.push({
        text: "Begin the adventure",
        completed: sessions.length > 0
      });
      
      // Generate dynamic milestones based on session count
      if (sessions.length >= 3) {
        milestonesArray.push({
          text: "Complete initial challenges",
          completed: sessions.length >= 3
        });
      }
      
      if (sessions.length >= 6) {
        milestonesArray.push({
          text: "Overcome major obstacles",
          completed: sessions.length >= 6
        });
      }
      
      if (sessions.length >= 9) {
        milestonesArray.push({
          text: "Prepare for the final confrontation",
          completed: sessions.length >= 9
        });
      }
      
      // Final milestone is completing the quest
      milestonesArray.push({
        text: "Complete the main quest",
        completed: sessions.length >= 12
      });
      
      setMilestones(milestonesArray);
    }
  }, [sessions, campaign]);
  
  if (sessionsLoading || campaignLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-fantasy flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            <span>Quest Tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-parchment/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-fantasy flex items-center text-amber-800">
          <Target className="h-5 w-5 mr-2 text-amber-600" />
          <span>Quest Tracker</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Quest */}
        {mainQuest && (
          <div className="space-y-2">
            <h3 className="font-bold flex items-center text-rose-800">
              <Star className="h-4 w-4 mr-1 text-rose-600" />
              Main Quest:
            </h3>
            <p className="text-sm italic border-l-2 border-amber-300 pl-3 py-1 bg-amber-50/50">
              {mainQuest.length > 150 ? mainQuest.substring(0, 150) + "..." : mainQuest}
            </p>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Quest Progress</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-amber-100" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sessions Completed: {completedSessions}</span>
            <span>Estimated Total: ~{totalSessions}</span>
          </div>
        </div>
        
        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold flex items-center">
              <Milestone className="h-4 w-4 mr-1 text-primary" />
              Milestones:
            </h3>
            <ul className="space-y-2">
              {milestones.map((milestone, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  {milestone.completed ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-amber-400 mt-0.5 shrink-0" />
                  )}
                  <span className={milestone.completed ? "text-emerald-800" : "text-amber-800"}>
                    {milestone.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Final Reward Teaser */}
        <div className="mt-4 p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-md border border-amber-200">
          <h3 className="font-bold flex items-center text-amber-800 mb-2">
            <Trophy className="h-4 w-4 mr-1 text-amber-600" />
            Ultimate Rewards Await
          </h3>
          <p className="text-sm text-amber-800">
            Complete the main quest to earn legendary items, substantial gold, and significant XP to advance your character!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}