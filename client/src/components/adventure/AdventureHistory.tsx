import { AdventureCompletion, Character } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistance } from "date-fns";
import { Award, Calendar, User, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CharacterProgress from "../character/CharacterProgress";

export default function AdventureHistory() {
  const [selectedCharacter, setSelectedCharacter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("history");
  
  // Query to fetch all adventure completions
  const {
    data: adventureCompletions = [],
    isLoading: isLoadingCompletions,
    error: completionsError,
  } = useQuery<AdventureCompletion[]>({
    queryKey: ["/api/adventure-completions"],
    queryFn: undefined,
  });
  
  // Query to fetch characters
  const {
    data: characters = [],
    isLoading: isLoadingCharacters,
  } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    queryFn: undefined,
  });

  // Filter completions by character if needed
  const filteredCompletions = selectedCharacter === "all" 
    ? adventureCompletions 
    : adventureCompletions.filter(completion => 
        completion.characterId === parseInt(selectedCharacter, 10)
      );
  
  // Find a character by ID
  const getCharacter = (characterId: number) => {
    return characters.find(char => char.id === characterId);
  };
  
  // Calculate total XP earned from adventures
  const calculateTotalXP = (characterId: number) => {
    return adventureCompletions
      .filter(completion => completion.characterId === characterId)
      .reduce((total, completion) => total + completion.xpAwarded, 0);
  };
  
  // Sort characters by XP earned (descending)
  const sortedCharacters = [...characters].sort((a, b) => {
    const aXP = calculateTotalXP(a.id);
    const bXP = calculateTotalXP(b.id);
    return bXP - aXP;
  });

  // Handle loading state
  if (isLoadingCompletions || isLoadingCharacters) {
    return (
      <div className="space-y-4">
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">Adventure History</TabsTrigger>
            <TabsTrigger value="characters">Character Progress</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex justify-end mb-4">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-2/5" />
                <Skeleton className="h-4 w-3/5" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (completionsError) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-md text-red-800">
        <h3 className="font-bold">Error loading adventure completions</h3>
        <p>{(completionsError as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="history" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Adventure History
          </TabsTrigger>
          <TabsTrigger value="characters" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Character Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4 space-y-4">
          {adventureCompletions.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-muted/40">
              <h3 className="text-lg font-medium mb-2">No adventure completions</h3>
              <p className="text-muted-foreground">
                You haven't completed any adventures yet. Start a campaign to begin your journey!
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Select 
                  value={selectedCharacter} 
                  onValueChange={setSelectedCharacter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by character" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Characters</SelectItem>
                    {characters.map(character => (
                      <SelectItem key={character.id} value={character.id.toString()}>
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                <div className="space-y-4">
                  {filteredCompletions.length === 0 ? (
                    <div className="text-center p-8 border rounded-md bg-muted/40">
                      <h3 className="text-lg font-medium mb-2">No adventures found</h3>
                      <p className="text-muted-foreground">
                        No adventure completions match your filter criteria.
                      </p>
                    </div>
                  ) : (
                    filteredCompletions
                      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                      .map((completion) => {
                        const character = getCharacter(completion.characterId);
                        
                        // Get campaign and session info if needed
                        const campaignTitle = "Campaign #" + completion.campaignId;
                        const adventureTitle = "Adventure Completion";
                        const difficultyLevel = "Standard";
                        
                        return (
                          <Card key={completion.id} className="transition-all hover:shadow">
                            <CardHeader className="pb-2">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <div>
                                  <CardTitle className="text-xl font-bold">{adventureTitle}</CardTitle>
                                  <CardDescription>
                                    {campaignTitle} - Completion #{completion.id}
                                  </CardDescription>
                                </div>
                                <Badge className="bg-primary-light text-white sm:self-start">
                                  {difficultyLevel}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="flex items-center text-muted-foreground">
                                    <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                                    <span>
                                      Completed {formatDistance(new Date(completion.completedAt), new Date(), { addSuffix: true })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center text-muted-foreground">
                                    <User className="mr-2 h-4 w-4 flex-shrink-0" />
                                    <span>{character ? character.name : 'Unknown Character'}</span>
                                  </div>
                                  
                                  <div className="flex items-center font-medium text-green-600">
                                    <Award className="mr-2 h-4 w-4 flex-shrink-0" />
                                    <span>+{completion.xpAwarded} XP</span>
                                  </div>
                                </div>
                                
                                {completion.notes && (
                                  <div className="mt-2 text-sm bg-muted/30 p-3 rounded-md">
                                    <p className="italic">{completion.notes}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>

        <TabsContent value="characters" className="mt-4">
          {characters.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-muted/40">
              <h3 className="text-lg font-medium mb-2">No characters</h3>
              <p className="text-muted-foreground">
                You need to create a character before tracking XP progress.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedCharacters.map(character => {
                  const totalXP = calculateTotalXP(character.id);
                  const adventureCount = adventureCompletions.filter(
                    comp => comp.characterId === character.id
                  ).length;
                  
                  return (
                    <Card key={character.id} className="overflow-hidden">
                      <CardHeader className="pb-2 bg-gradient-to-r from-primary-dark to-primary">
                        <div className="flex justify-between items-center text-white">
                          <CardTitle className="text-xl font-bold">{character.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                              Level {character.level || 1}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="mb-6">
                          <CharacterProgress character={character} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/30 p-3 rounded-md flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Award className="h-5 w-5 text-primary" />
                              <span className="font-semibold">Total XP Earned</span>
                            </div>
                            <span className="text-2xl font-bold">{totalXP.toLocaleString()}</span>
                          </div>
                          
                          <div className="bg-muted/30 p-3 rounded-md flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-5 w-5 text-primary" />
                              <span className="font-semibold">Adventures</span>
                            </div>
                            <span className="text-2xl font-bold">{adventureCount}</span>
                          </div>
                        </div>
                        
                        {adventureCount === 0 && (
                          <div className="mt-4 text-center text-muted-foreground italic">
                            No adventures completed yet
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}