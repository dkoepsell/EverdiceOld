import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CampaignPanel from "@/components/campaign/CampaignPanel";
import CharacterSheet from "@/components/character/CharacterSheet";
import DiceRoller from "@/components/dice/DiceRoller";
import { Character } from "@shared/schema";

export default function Dashboard() {
  const { data: characters, isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-cover bg-center h-64 md:h-96" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-fantasy font-bold text-white mb-4">Begin Your Adventure</h1>
            <p className="text-xl text-gray-200 mb-6">Create stories, roll dice, and embark on epic quests with our AI-powered D&D companion.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/campaigns">
                <Button className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-3 rounded-lg transition transform hover:scale-105">
                  Start New Campaign
                </Button>
              </Link>
              <Button variant="outline" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg transition hover:bg-white hover:bg-opacity-20">
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
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
                <div className="bg-primary p-4">
                  <h2 className="font-fantasy text-xl font-bold text-white">Character Sheet</h2>
                </div>
                <CardContent className="p-6 flex flex-col items-center justify-center h-[500px] character-sheet">
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

          {/* Campaign Panel */}
          <div className="lg:col-span-2">
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
            ) : campaigns && campaigns.length > 0 ? (
              <CampaignPanel campaign={campaigns[0]} />
            ) : (
              <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
                <div className="bg-primary p-4 flex justify-between items-center">
                  <h2 className="font-fantasy text-xl font-bold text-white">Current Adventure</h2>
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
