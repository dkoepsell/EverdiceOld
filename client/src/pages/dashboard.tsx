import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignPanel from "@/components/campaign/CampaignPanel";
import CharacterSheet from "@/components/character/CharacterSheet";
import CharacterProgress from "@/components/character/CharacterProgress";
import DiceRoller from "@/components/dice/DiceRoller";
import CampaignArchiveList from "@/components/campaign/CampaignArchiveList";
import AdventureHistory from "@/components/adventure/AdventureHistory";
import { Character, Campaign } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { Bookmark, Calendar, Dice5Icon, History, User } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: characters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: campaigns = [], isLoading: campaignsLoading, isError: campaignsError, refetch: refetchCampaigns } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // Data considered fresh for 30 seconds
  });

  // Auto-refresh campaigns data every 15 seconds
  useEffect(() => {
    // Only attempt to refresh data if user is authenticated
    if (!user) return;
    
    console.log("Setting up campaign refresh timer for authenticated user");
    
    // Initial data load - useful after a session restore
    queryClient.invalidateQueries({
      queryKey: ['/api/campaigns']
    });
    
    // Set up periodic campaign data refresh
    const refreshTimer = setInterval(() => {
      // Check if user is authenticated
      if (user) {
        console.log("Auto-refreshing campaign data");
        queryClient.invalidateQueries({
          queryKey: ['/api/campaigns']
        });
      }
    }, 15000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshTimer);
  }, [user, campaigns]);
  
  // If campaign data error occurs, try to recover
  useEffect(() => {
    if (campaignsError) {
      // Wait a moment and retry fetching campaigns
      const recoveryTimer = setTimeout(() => {
        console.log("Attempting to recover from campaigns error");
        refetchCampaigns();
      }, 2000);
      
      return () => clearTimeout(recoveryTimer);
    }
  }, [campaignsError, refetchCampaigns]);
  
  // Get active campaign (most recent non-archived, non-completed campaign)
  const activeCampaign = campaigns
    ?.filter(campaign => !campaign.isArchived && !campaign.isCompleted)
    .sort((a, b) => {
      // Sort by most recently created
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })[0];

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative bg-cover bg-center h-64 md:h-96" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-fantasy font-bold text-white mb-4">
              {user ? `Welcome, ${user.username}` : 'Begin Your Adventure'}
            </h1>
            <p className="text-xl text-gray-200 mb-6">Create stories, roll dice, and embark on epic quests with our AI-powered D&D companion.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/campaigns">
                <Button className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-3 rounded-lg transition transform hover:scale-105">
                  {activeCampaign ? 'Continue Adventure' : 'Start New Campaign'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Dashboard Tabs */}
      {isMobile && (
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="active-campaign" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active-campaign" className="flex flex-col items-center text-xs">
                <Bookmark className="h-4 w-4 mb-1" />
                Adventure
              </TabsTrigger>
              <TabsTrigger value="character" className="flex flex-col items-center text-xs">
                <User className="h-4 w-4 mb-1" />
                Character
              </TabsTrigger>
              <TabsTrigger value="history" className="flex flex-col items-center text-xs">
                <History className="h-4 w-4 mb-1" />
                History
              </TabsTrigger>
              <TabsTrigger value="dice" className="flex flex-col items-center text-xs">
                <Dice5Icon className="h-4 w-4 mb-1" />
                Dice
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active-campaign" className="mt-4">
              {campaignsLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-60 bg-gray-300 rounded"></div>
                      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : campaignsError ? (
                <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary p-4">
                    <CardTitle className="font-fantasy text-xl font-bold text-white">Campaign Data</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <p className="text-lg mb-4 text-secondary">Unable to load campaign data</p>
                      <Button 
                        className="bg-primary-light hover:bg-primary-dark text-white"
                        onClick={() => refetchCampaigns()}
                      >
                        Retry Loading
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : activeCampaign ? (
                <CampaignPanel campaign={activeCampaign} />
              ) : (
                <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary p-4">
                    <CardTitle className="font-fantasy text-xl font-bold text-white">Start a New Adventure</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <p className="text-lg mb-4 text-secondary">No active campaigns found</p>
                      <Link href="/campaigns">
                        <Button className="bg-primary-light hover:bg-primary-dark text-white">Create Campaign</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="mt-4">
                <CampaignArchiveList />
              </div>
            </TabsContent>
            
            <TabsContent value="character" className="mt-4">
              {charactersLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-40 bg-gray-300 rounded"></div>
                      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : characters && characters.length > 0 ? (
                <div className="space-y-4">
                  <CharacterSheet character={characters[0]} />
                </div>
              ) : (
                <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary p-4">
                    <CardTitle className="font-fantasy text-xl font-bold text-white">Create a Character</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <p className="text-lg mb-4 text-secondary">No characters found</p>
                      <Link href="/characters">
                        <Button className="bg-primary-light hover:bg-primary-dark text-white">Create Character</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <AdventureHistory />
            </TabsContent>
            
            <TabsContent value="dice" className="mt-4">
              <DiceRoller />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Desktop Dashboard Content */}
      {!isMobile && (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Character Sheet and Dice Roller */}
            <div className="lg:col-span-1 space-y-6">
              {/* Character Sheet Panel */}
              {charactersLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-40 bg-gray-300 rounded"></div>
                      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : characters && characters.length > 0 ? (
                <CharacterSheet character={characters[0]} />
              ) : (
                <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary p-4">
                    <CardTitle className="font-fantasy text-xl font-bold text-white">Character Sheet</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center h-[400px]">
                    <div className="text-center">
                      <p className="text-lg mb-4 text-secondary">No characters found</p>
                      <Link href="/characters">
                        <Button className="bg-primary-light hover:bg-primary-dark text-white">Create Character</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Dice Roller Component */}
              <DiceRoller />
            </div>

            {/* Right Columns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Campaign Panel */}
              {campaignsLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-60 bg-gray-300 rounded"></div>
                      <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : campaignsError ? (
                <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary p-4 flex justify-between items-center">
                    <CardTitle className="font-fantasy text-xl font-bold text-white">Current Adventure</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center h-[400px] bg-parchment character-sheet">
                    <div className="text-center">
                      <p className="text-lg mb-4 text-secondary">Unable to load campaign data</p>
                      <p className="text-sm text-gray-600 mb-4">There was a problem retrieving your campaign information.</p>
                      <Button 
                        className="bg-primary-light hover:bg-primary-dark text-white"
                        onClick={() => refetchCampaigns()}
                      >
                        Retry Loading
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : activeCampaign ? (
                <CampaignPanel campaign={activeCampaign} />
              ) : (
                <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
                  <CardHeader className="bg-primary p-4 flex justify-between items-center">
                    <CardTitle className="font-fantasy text-xl font-bold text-white">Current Adventure</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center h-[400px] bg-parchment character-sheet">
                    <div className="text-center">
                      <p className="text-lg mb-4 text-secondary">No active campaigns found</p>
                      <Link href="/campaigns">
                        <Button className="bg-primary-light hover:bg-primary-dark text-white">Create Campaign</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Adventure History Section */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary p-4">
                  <CardTitle className="font-fantasy text-xl font-bold text-white flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Adventure Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <AdventureHistory />
                </CardContent>
              </Card>
              
              {/* Campaign Archive */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-primary p-4">
                  <CardTitle className="font-fantasy text-xl font-bold text-white flex items-center">
                    <Bookmark className="mr-2 h-5 w-5" />
                    Campaign Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <CampaignArchiveList />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
