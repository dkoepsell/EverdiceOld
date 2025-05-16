import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { 
  AlertCircle, 
  BookOpen, 
  Heart, 
  Loader2, 
  Plus, 
  Shield, 
  Target, 
  Users,
  MapPin,
  Castle,
  Trees,
  Building,
  Landmark,
  Mountain,
  Droplets,
  Compass,
  Info,
  Scroll,
  Sparkles,
  Swords,
  Star,
  Circle
} from "lucide-react";

export default function DMToolkit() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("companions");
  
  if (authLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-fantasy font-semibold">Loading DM Toolkit</h2>
          <p className="text-muted-foreground">Please wait while we prepare your tools...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to access the DM Toolkit.</p>
          <Button asChild>
            <a href="/auth">Login or Register</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-fantasy font-bold">Dungeon Master Toolkit</h1>
        <p className="text-muted-foreground">Create and manage your campaigns with these powerful tools</p>
      </div>
      
      <Tabs defaultValue="companions" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full">
          <TabsTrigger value="companions" className="font-medium">
            Companions
          </TabsTrigger>
          <TabsTrigger value="locations" className="font-medium">
            Locations
          </TabsTrigger>
          <TabsTrigger value="quests" className="font-medium">
            Quests
          </TabsTrigger>
          <TabsTrigger value="items" className="font-medium">
            Magic Items
          </TabsTrigger>
          <TabsTrigger value="monsters" className="font-medium">
            Monsters
          </TabsTrigger>
          <TabsTrigger value="generators" className="font-medium">
            Generators
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="companions" className="space-y-4">
          <CompanionsTab />
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-4">
          <LocationsTab />
        </TabsContent>
        
        <TabsContent value="quests" className="space-y-4">
          <QuestsTab />
        </TabsContent>
        
        <TabsContent value="items" className="space-y-4">
          <MagicItemsTab />
        </TabsContent>
        
        <TabsContent value="monsters" className="space-y-4">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Monster Creation tools will be available soon</p>
          </div>
        </TabsContent>
        
        <TabsContent value="generators" className="space-y-4">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Generate content tools will be available soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LocationsTab() {
  const [selectedLocationType, setSelectedLocationType] = useState("city");
  const [showGuide, setShowGuide] = useState(true);
  const { toast } = useToast();
  
  // Location types with icons and descriptive text
  const locationTypes = [
    { 
      id: "city", 
      name: "City or Town", 
      icon: <Building className="h-5 w-5" />,
      description: "Centers of civilization with distinct districts, NPCs, and potential quests."
    },
    { 
      id: "dungeon", 
      name: "Dungeon or Ruins", 
      icon: <Castle className="h-5 w-5" />,
      description: "Ancient structures or underground complexes filled with traps, treasures, and foes."
    },
    { 
      id: "wilderness", 
      name: "Wilderness", 
      icon: <Trees className="h-5 w-5" />,
      description: "Natural environments like forests, plains, or jungles with unique encounters."
    },
    { 
      id: "landmark", 
      name: "Landmark", 
      icon: <Landmark className="h-5 w-5" />,
      description: "Distinctive locations of cultural or mystical significance."
    },
    { 
      id: "mountain", 
      name: "Mountains", 
      icon: <Mountain className="h-5 w-5" />,
      description: "Challenging terrains with caves, passes, and potential lairs."
    },
    { 
      id: "water", 
      name: "Water Location", 
      icon: <Droplets className="h-5 w-5" />,
      description: "Oceans, lakes, rivers, and underwater realms."
    }
  ];
  
  // Sample locations for inspiration
  const sampleLocations = [
    {
      name: "Mistwood Forest",
      type: "wilderness",
      description: "A dense, mist-shrouded forest where ancient trees whisper secrets. Known for its glowing fungi and elusive fey creatures.",
      features: ["Fey Crossings", "Druidic Circle", "Bandit Hideouts", "Ancient Talking Trees"],
      hooks: ["A rare magical herb only blooms during the full moon", "Local woodcutters are disappearing without a trace", "Ancient forest spirits have been awakened and are hostile"]
    },
    {
      name: "Graymane Citadel",
      type: "dungeon",
      description: "Once a proud fortress, now a crumbling ruin overrun by monstrous inhabitants. The halls still contain treasures and dangers from a forgotten age.",
      features: ["Collapsed Grand Hall", "Underground Prison", "Hidden Treasure Vault", "Cursed Armory"],
      hooks: ["A noble family heirloom is lost somewhere in the ruins", "The fortress was abandoned for a reason - an ancient curse", "Local bandits are using it as a base of operations"]
    },
    {
      name: "Silverport",
      type: "city",
      description: "A bustling coastal trade hub with diverse districts, from wealthy merchant quarters to rough dockside slums.",
      features: ["Dockside Market", "Merchant Guild Headquarters", "The Rusty Anchor Tavern", "Temple District"],
      hooks: ["A mysterious smuggling operation threatens local businesses", "Political tensions between merchant guilds are rising", "Cultists are secretly recruiting new members"]
    }
  ];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-fantasy font-semibold">Location Builder</h2>
          <p className="text-muted-foreground">Create and manage locations for your campaigns</p>
        </div>
        <Button onClick={() => setShowGuide(!showGuide)}>
          {showGuide ? <Info size={16} className="mr-2" /> : <Info size={16} className="mr-2" />}
          {showGuide ? "Hide Guide" : "Show Guide"}
        </Button>
      </div>
      
      {showGuide && (
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl font-fantasy">DM's Guide to Locations</CardTitle>
            <CardDescription>Creating memorable locations for your D&D adventures</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="basics">
                <AccordionTrigger className="font-medium">Location Basics</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Locations are more than just settings - they're opportunities for storytelling, exploration, and character development. A well-crafted location should:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Have a clear purpose in your story or game world</li>
                    <li>Contain interesting features for players to interact with</li>
                    <li>Include NPCs or creatures that make sense for the location</li>
                    <li>Offer hooks or potential plot points for players to discover</li>
                    <li>Evoke a specific mood or atmosphere through description</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="types">
                <AccordionTrigger className="font-medium">Location Types</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Different location types serve different purposes in your campaigns:</p>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">Cities & Towns</div>
                      <p>Centers for socializing, commerce, quests, and political intrigue. Include different districts, key NPCs, and notable establishments.</p>
                    </div>
                    <div>
                      <div className="font-medium">Dungeons & Ruins</div>
                      <p>Perfect for exploration, combat encounters, and treasure hunting. Design with purpose - who built it and why?</p>
                    </div>
                    <div>
                      <div className="font-medium">Wilderness Areas</div>
                      <p>Allow for random encounters, survival challenges, and hidden discoveries. Consider the ecology and natural features.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="hooks">
                <AccordionTrigger className="font-medium">Creating Adventure Hooks</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Every location should present opportunities for adventure:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Include local rumors or legends related to the location</li>
                    <li>Create conflicts between NPCs or factions that players can get involved in</li>
                    <li>Hide clues that tie to larger campaign storylines</li>
                    <li>Consider how the location might change over time or in response to player actions</li>
                  </ul>
                  <p className="text-sm italic mt-2">Remember: The best hooks are those that appeal to your specific players' interests and their characters' motivations.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="descriptions">
                <AccordionTrigger className="font-medium">Crafting Engaging Descriptions</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>When describing locations to players, engage multiple senses:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Sight:</span> Colors, lighting, size, notable objects</li>
                    <li><span className="font-medium">Sound:</span> Background noises, music, voices, natural sounds</li>
                    <li><span className="font-medium">Smell:</span> Pleasant or unpleasant odors that set the mood</li>
                    <li><span className="font-medium">Touch:</span> Temperature, textures, air quality</li>
                    <li><span className="font-medium">Taste:</span> When relevant, like during meals or if the air tastes unusual</li>
                  </ul>
                  <p>Focus on the most important elements rather than overwhelming players with too much detail at once.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-fantasy">Create New Location</CardTitle>
              <CardDescription>Design a new location for your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location-name">Location Name</Label>
                <Input id="location-name" placeholder="e.g. Mistwood Forest or Silverport City" />
              </div>
              
              <div className="space-y-2">
                <Label>Location Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {locationTypes.map(type => (
                    <Button
                      key={type.id}
                      variant={selectedLocationType === type.id ? "default" : "outline"}
                      className="justify-start h-auto py-2 px-3"
                      onClick={() => setSelectedLocationType(type.id)}
                    >
                      <div className="flex items-center">
                        <div className="mr-2 text-primary">{type.icon}</div>
                        <span className="text-sm">{type.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location-description">Description</Label>
                <Textarea 
                  id="location-description" 
                  placeholder="Describe your location's appearance, history, and significance..." 
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location-features">Key Features (one per line)</Label>
                <Textarea 
                  id="location-features" 
                  placeholder="The Grand Market
Ancient Oak Tree
Hidden Underground Entrance"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location-hooks">Adventure Hooks (one per line)</Label>
                <Textarea 
                  id="location-hooks" 
                  placeholder="Local merchants report thefts of magical items
A strange illness is affecting the town's children
Rumors of treasure hidden in nearby caves"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campaign">Add to Campaign (Optional)</Label>
                <Select>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign-1">The Shattered Isles of Eldoria</SelectItem>
                    <SelectItem value="campaign-2">Shadows of Ravenholme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Save Location
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-fantasy">Location Examples</CardTitle>
              <CardDescription>Sample locations for inspiration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {sampleLocations.map((location, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-lg">{location.name}</h3>
                    {location.type === "wilderness" && <Trees className="h-4 w-4 text-green-600" />}
                    {location.type === "dungeon" && <Castle className="h-4 w-4 text-gray-600" />}
                    {location.type === "city" && <Building className="h-4 w-4 text-blue-600" />}
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">{location.description}</p>
                  
                  <div className="mb-2">
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Key Features</div>
                    <div className="flex flex-wrap gap-1">
                      {location.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Adventure Hooks</div>
                    <ul className="text-sm text-muted-foreground pl-4 list-disc">
                      {location.hooks.map((hook, idx) => (
                        <li key={idx}>{hook}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-fantasy text-base">Tips for Creating Memorable Locations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Think of locations as characters with their own personality and history</p>
              <p>• Include interactive elements that players can engage with</p>
              <p>• Consider how the location connects to your larger world and storyline</p>
              <p>• Create opportunities for different character types to shine (combat, social, exploration)</p>
              <p>• Don't overwhelm with details - focus on what matters for your story</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuestsTab() {
  const [showGuide, setShowGuide] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const { toast } = useToast();
  
  // Quest types with descriptions
  const questTypes = [
    { 
      id: "rescue", 
      name: "Rescue Mission", 
      description: "Players must save someone or something from danger."
    },
    { 
      id: "retrieval", 
      name: "Item Retrieval", 
      description: "Players must find and retrieve a specific item."
    },
    { 
      id: "escort", 
      name: "Escort Mission", 
      description: "Players must safely escort someone or something to a destination."
    },
    { 
      id: "investigation", 
      name: "Investigation", 
      description: "Players must solve a mystery or gather information."
    },
    { 
      id: "elimination", 
      name: "Elimination", 
      description: "Players must defeat a specific enemy or group of enemies."
    },
    { 
      id: "protection", 
      name: "Protection", 
      description: "Players must defend a location or person from attacks."
    },
  ];
  
  // Sample quests for inspiration
  const sampleQuests = [
    {
      title: "The Missing Artifact",
      type: "retrieval",
      difficulty: "moderate",
      description: "A valuable artifact has been stolen from the local museum. The curator believes it was taken by a notorious thief who's hiding in the nearby mountains.",
      objectives: ["Investigate the museum for clues", "Track the thief to their hideout", "Recover the artifact", "Return it to the museum"],
      rewards: ["500 gold pieces", "Rare magical scroll", "Faction reputation increase"],
      complications: ["The thief has deadly traps protecting their hideout", "A rival group is also searching for the artifact", "The artifact is cursed and affects whoever carries it"]
    },
    {
      title: "Village Under Siege",
      type: "protection",
      difficulty: "hard",
      description: "A small village is being terrorized by bandits who demand protection money. The villagers can no longer afford to pay and have requested help.",
      objectives: ["Meet with village elders to learn about the bandits", "Set up defenses for the village", "Defeat the bandits when they next attack", "Locate and eliminate their hideout"],
      rewards: ["Village provides free lodging for future visits", "Masterwork weapon from the village blacksmith", "800 gold pieces"],
      complications: ["The bandits have a powerful spellcaster", "A traitor in the village is feeding information to the bandits", "Local lord is secretly supporting the bandits"]
    },
    {
      title: "The Forgotten Ritual",
      type: "investigation",
      difficulty: "easy",
      description: "Strange lights have been seen in an abandoned temple outside of town. The local priest is worried an ancient evil is being awakened.",
      objectives: ["Research the temple's history", "Investigate the temple", "Discover who is performing rituals there", "Stop the ritual before completion"],
      rewards: ["Magical amulet", "250 gold pieces", "Access to temple library with rare spells"],
      complications: ["The cultists are respected town members", "The ritual is already partially complete", "Temple is filled with animated statues"]
    }
  ];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-fantasy font-semibold">Quest Builder</h2>
          <p className="text-muted-foreground">Create compelling quests for your adventures</p>
        </div>
        <Button onClick={() => setShowGuide(!showGuide)}>
          {showGuide ? <Info size={16} className="mr-2" /> : <Info size={16} className="mr-2" />}
          {showGuide ? "Hide Guide" : "Show Guide"}
        </Button>
      </div>
      
      {showGuide && (
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl font-fantasy">Quest Design Guide</CardTitle>
            <CardDescription>Creating engaging quests for your D&D adventures</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="structure">
                <AccordionTrigger className="font-medium">Quest Structure</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>A well-designed quest typically includes these elements:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Hook:</span> How players learn about the quest and why they'd be interested</li>
                    <li><span className="font-medium">Background:</span> Essential context that explains the situation</li>
                    <li><span className="font-medium">Objectives:</span> Clear goals that players need to accomplish</li>
                    <li><span className="font-medium">Challenges:</span> Obstacles, enemies, or puzzles that stand in their way</li>
                    <li><span className="font-medium">Rewards:</span> What players gain from completing the quest</li>
                    <li><span className="font-medium">Consequences:</span> What happens if players fail or choose not to help</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="types">
                <AccordionTrigger className="font-medium">Types of Quests</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Different quest types appeal to different player motivations:</p>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">Combat-focused Quests</div>
                      <p>Elimination, protection, and siege quests that focus on tactical combat. Appeal to players who enjoy battle strategy and using combat abilities.</p>
                    </div>
                    <div>
                      <div className="font-medium">Exploration Quests</div>
                      <p>Retrieval, discovery, and mapping quests that reward curiosity and thorough investigation of environments.</p>
                    </div>
                    <div>
                      <div className="font-medium">Social Quests</div>
                      <p>Negotiation, infiltration, and investigation quests that emphasize interaction with NPCs and social skills.</p>
                    </div>
                    <div>
                      <div className="font-medium">Mixed Quests</div>
                      <p>The best quests often combine multiple elements to engage different player types and allow for creative problem-solving.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="rewards">
                <AccordionTrigger className="font-medium">Balancing Rewards</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Quests should offer appropriate rewards based on:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Difficulty:</span> Harder quests should offer better rewards</li>
                    <li><span className="font-medium">Time investment:</span> Longer quests should pay off accordingly</li>
                    <li><span className="font-medium">Risk level:</span> Greater dangers warrant greater rewards</li>
                  </ul>
                  <p className="mt-2">Consider varying reward types:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Treasure:</span> Gold, gems, art objects</li>
                    <li><span className="font-medium">Magic items:</span> Weapons, armor, potions, scrolls</li>
                    <li><span className="font-medium">Information:</span> Secrets, maps, knowledge</li>
                    <li><span className="font-medium">Allies:</span> NPC assistance, favors, contacts</li>
                    <li><span className="font-medium">Reputation:</span> Standing with factions or communities</li>
                    <li><span className="font-medium">Resources:</span> Property, business interests, special access</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="complications">
                <AccordionTrigger className="font-medium">Adding Complications</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Make quests more interesting with these complicating factors:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Time pressure:</span> "Complete the task before the full moon"</li>
                    <li><span className="font-medium">Moral dilemmas:</span> "The 'monster' is actually protecting innocent creatures"</li>
                    <li><span className="font-medium">Limited resources:</span> "You must complete this without being detected"</li>
                    <li><span className="font-medium">Conflicting objectives:</span> "Two factions both want your help against each other"</li>
                    <li><span className="font-medium">Unexpected developments:</span> "The person you rescue isn't who they claimed to be"</li>
                    <li><span className="font-medium">Environmental challenges:</span> "The dungeon is flooding" or "The forest is on fire"</li>
                  </ul>
                  <p className="text-sm italic mt-2">Remember: The goal is to create interesting challenges, not to frustrate players. Always provide multiple paths to success.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-fantasy">Create New Quest</CardTitle>
              <CardDescription>Design a new quest for your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quest-title">Quest Title</Label>
                <Input id="quest-title" placeholder="e.g. The Missing Artifact or Trouble at the Silver Mine" />
              </div>
              
              <div className="space-y-2">
                <Label>Quest Type</Label>
                <Select>
                  <SelectTrigger id="quest-type">
                    <SelectValue placeholder="Select quest type" />
                  </SelectTrigger>
                  <SelectContent>
                    {questTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">The primary focus of this quest</p>
              </div>
              
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant={selectedDifficulty === "easy" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedDifficulty("easy")}
                  >
                    Easy
                  </Button>
                  <Button 
                    variant={selectedDifficulty === "moderate" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedDifficulty("moderate")}
                  >
                    Moderate
                  </Button>
                  <Button 
                    variant={selectedDifficulty === "hard" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedDifficulty("hard")}
                  >
                    Hard
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedDifficulty === "easy" && "For beginner players or low-level characters (levels 1-4)"}
                  {selectedDifficulty === "moderate" && "For experienced players or mid-level characters (levels 5-10)"}
                  {selectedDifficulty === "hard" && "For veteran players or high-level characters (levels 11+)"}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quest-description">Description</Label>
                <Textarea 
                  id="quest-description" 
                  placeholder="Describe the situation, background, and central conflict of the quest..." 
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quest-objectives">Objectives (one per line)</Label>
                <Textarea 
                  id="quest-objectives" 
                  placeholder="Investigate the disappearance
Find the missing villagers
Defeat the cult leader
Free the captives"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quest-rewards">Rewards (one per line)</Label>
                <Textarea 
                  id="quest-rewards" 
                  placeholder="300 gold pieces
Magic sword (+1)
Map to hidden treasure
Favor from the local lord"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quest-complications">Complications/Twists (optional)</Label>
                <Textarea 
                  id="quest-complications" 
                  placeholder="The captive is actually working with the kidnappers
A powerful monster guards the entrance to the hideout
Heavy rain makes tracking difficult"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campaign">Add to Campaign (Optional)</Label>
                <Select>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign-1">The Shattered Isles of Eldoria</SelectItem>
                    <SelectItem value="campaign-2">Shadows of Ravenholme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Save Quest
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-fantasy">Quest Examples</CardTitle>
              <CardDescription>Sample quests for inspiration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {sampleQuests.map((quest, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-lg">{quest.title}</h3>
                    <Badge 
                      className={
                        quest.difficulty === "easy" ? "bg-green-600" :
                        quest.difficulty === "moderate" ? "bg-amber-600" :
                        "bg-red-600"
                      }
                    >
                      {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">{quest.description}</p>
                  
                  <div className="mb-2">
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Objectives</div>
                    <ol className="list-decimal list-inside text-sm">
                      {quest.objectives.map((objective, idx) => (
                        <li key={idx} className="ml-1">{objective}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Rewards</div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {quest.rewards.map((reward, idx) => (
                        <li key={idx} className="ml-1">{reward}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Complications</div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {quest.complications.map((complication, idx) => (
                        <li key={idx} className="ml-1">{complication}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-fantasy text-base">Tips for Engaging Quests</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Connect quest elements to character backstories when possible</p>
              <p>• Allow for multiple approaches to solving the quest's challenges</p>
              <p>• Create interesting NPCs that bring the quest to life</p>
              <p>• Consider how the quest affects the larger world and campaign</p>
              <p>• Plan for unexpected player decisions</p>
              <p>• Make consequences for success or failure meaningful</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MagicItemsTab() {
  const [showGuide, setShowGuide] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState("common");
  const { toast } = useToast();
  
  // Item rarity information
  const itemRarities = [
    { 
      id: "common", 
      name: "Common", 
      color: "bg-gray-200 text-gray-800",
      description: "Minor magical properties, suitable for low-level characters (levels 1-4)."
    },
    { 
      id: "uncommon", 
      name: "Uncommon", 
      color: "bg-green-200 text-green-800",
      description: "Moderate magical properties, suitable for mid-level characters (levels 5-10)."
    },
    { 
      id: "rare", 
      name: "Rare", 
      color: "bg-blue-200 text-blue-800",
      description: "Significant magical properties, suitable for higher-level characters (levels 11-16)."
    },
    { 
      id: "very-rare", 
      name: "Very Rare", 
      color: "bg-purple-200 text-purple-800",
      description: "Powerful magical properties, suitable for high-level characters (levels 17+)."
    },
    { 
      id: "legendary", 
      name: "Legendary", 
      color: "bg-amber-200 text-amber-800",
      description: "Extremely powerful items that can change the course of a campaign."
    },
    { 
      id: "artifact", 
      name: "Artifact", 
      color: "bg-red-200 text-red-800",
      description: "Unique items with world-altering powers, often with their own goals and motivations."
    }
  ];
  
  // Item types with descriptions
  const itemTypes = [
    { id: "weapon", name: "Weapon", icon: <Swords className="h-5 w-5" /> },
    { id: "armor", name: "Armor", icon: <Shield className="h-5 w-5" /> },
    { id: "wondrous", name: "Wondrous Item", icon: <Sparkles className="h-5 w-5" /> },
    { id: "potion", name: "Potion", icon: <Droplets className="h-5 w-5" /> },
    { id: "scroll", name: "Scroll", icon: <Scroll className="h-5 w-5" /> },
    { id: "ring", name: "Ring", icon: <Circle className="h-5 w-5" /> },
    { id: "wand", name: "Wand or Rod", icon: <Star className="h-5 w-5" /> },
  ];
  
  // Sample magic items for inspiration
  const sampleItems = [
    {
      name: "Moonlight Blade",
      type: "weapon",
      rarity: "rare",
      description: "A curved silver sword that glows with pale blue light in darkness. The blade casts moonlight for 20 feet and reveals invisible creatures within that radius.",
      properties: [
        "Counts as a +1 magical weapon",
        "Casts moonlight for 20 feet when unsheathed in darkness",
        "Reveals invisible creatures within the moonlight radius",
        "Deals an additional 1d6 radiant damage to undead creatures"
      ],
      lore: "Forged by the elven bladesmiths of the Silver Moon Conclave, these blades were created to battle the shadows that came from the Darkreach during the Time of Long Night.",
      attunement: true,
      curses: null
    },
    {
      name: "Flask of Endless Brew",
      type: "wondrous",
      rarity: "uncommon",
      description: "A stout metal flask with intricate dwarven runes. Once per day, the owner can tap the flask three times and speak the name of a non-magical beverage, filling the flask with that drink.",
      properties: [
        "Creates any non-magical beverage once per day",
        "Beverage remains fresh until consumed or the flask is used again",
        "Holds one pint of liquid"
      ],
      lore: "Originally created by the master brewers of Ironforge Hold as gifts for honored guests and allies. The secret of their making was thought lost during the Cataclysm of Fire.",
      attunement: false,
      curses: null
    },
    {
      name: "Crown of Whispers",
      type: "wondrous",
      rarity: "very-rare",
      description: "A delicate silver circlet set with black opals. When worn, it grants the ability to send and receive telepathic messages, but at a cost.",
      properties: [
        "Allows telepathic communication with any creature within 60 feet",
        "The wearer can read surface thoughts of creatures that fail a DC 15 Wisdom save",
        "Can cast Detect Thoughts spell once per day"
      ],
      lore: "Created by the secretive Order of the Obsidian Mind to communicate during their forbidden rituals. Those who wore the crown for too long began to hear voices even when alone.",
      attunement: true,
      curses: "The wearer occasionally hears random thoughts from unknown sources, which can be disorienting or misleading. After prolonged use, the wearer may have difficulty distinguishing between their own thoughts and those of others."
    }
  ];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-fantasy font-semibold">Magic Item Creator</h2>
          <p className="text-muted-foreground">Craft unique magical items for your campaigns</p>
        </div>
        <Button onClick={() => setShowGuide(!showGuide)}>
          {showGuide ? <Info size={16} className="mr-2" /> : <Info size={16} className="mr-2" />}
          {showGuide ? "Hide Guide" : "Show Guide"}
        </Button>
      </div>
      
      {showGuide && (
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl font-fantasy">Magic Item Design Guide</CardTitle>
            <CardDescription>Creating balanced and interesting magical items for your D&D campaigns</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="basics">
                <AccordionTrigger className="font-medium">Magic Item Basics</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>When designing magic items, consider these key elements:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Purpose:</span> Why does this item exist? What problem was it created to solve?</li>
                    <li><span className="font-medium">Powers:</span> What can the item do? How does it work?</li>
                    <li><span className="font-medium">Limitations:</span> What can't the item do? What restrictions does it have?</li>
                    <li><span className="font-medium">Cost or consequence:</span> What is required to use the item (attunement, charges, etc.)?</li>
                    <li><span className="font-medium">History:</span> Who created it and why? Has it had famous owners?</li>
                  </ul>
                  <p className="text-sm mt-2">A great magic item tells a story through its design and abilities.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="rarities">
                <AccordionTrigger className="font-medium">Rarity and Power Balance</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Rarity indicates both an item's power level and how difficult it is to find:</p>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-gray-700">Common</div>
                      <p>Minor magical effects, often cosmetic or quality-of-life improvements. Example: A wand that changes your hair color or a cup that keeps drinks cold.</p>
                    </div>
                    <div>
                      <div className="font-medium text-green-700">Uncommon</div>
                      <p>Useful magical effects with moderate power. Example: Boots of Elvenkind or a +1 weapon.</p>
                    </div>
                    <div>
                      <div className="font-medium text-blue-700">Rare</div>
                      <p>Significant magical effects that can change gameplay dynamics. Example: Cloak of Displacement or Ring of Spell Storing.</p>
                    </div>
                    <div>
                      <div className="font-medium text-purple-700">Very Rare</div>
                      <p>Powerful items that greatly enhance a character's abilities. Example: Manual of Bodily Health or Staff of Power.</p>
                    </div>
                    <div>
                      <div className="font-medium text-amber-700">Legendary</div>
                      <p>Extremely powerful items that can significantly impact campaign events. Example: Vorpal Sword or Staff of the Magi.</p>
                    </div>
                    <div>
                      <div className="font-medium text-red-700">Artifact</div>
                      <p>One-of-a-kind items with world-altering capabilities. Example: The Hand of Vecna or the Book of Vile Darkness.</p>
                    </div>
                  </div>
                  <p className="text-sm italic mt-2">Always match the rarity to your campaign's power level and the character levels of your players.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="attunement">
                <AccordionTrigger className="font-medium">Attunement and Limitations</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Attunement is a valuable tool for balancing powerful items:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Characters are limited to three attuned items at once</li>
                    <li>Attunement typically requires a short rest spent focusing on the item</li>
                    <li>More powerful items should generally require attunement</li>
                    <li>Consider class, race, alignment, or background restrictions for flavorful limitations</li>
                  </ul>
                  <p className="mt-2">Other ways to balance powerful items:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Charges:</span> Limited uses that replenish (or don't)</li>
                    <li><span className="font-medium">Recharge conditions:</span> "Only works at night" or "Must be recharged in moonlight"</li>
                    <li><span className="font-medium">Usage costs:</span> "Takes 1 hit point to activate" or "Requires an action to use"</li>
                    <li><span className="font-medium">Curses:</span> Drawbacks that balance powerful benefits</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="curses">
                <AccordionTrigger className="font-medium">Curses and Drawbacks</AccordionTrigger>
                <AccordionContent className="space-y-4 text-muted-foreground">
                  <p>Cursed items add intrigue and tension to your campaign:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><span className="font-medium">Hidden costs:</span> "Heals the user but ages them slightly each time"</li>
                    <li><span className="font-medium">Personality changes:</span> "Makes the user more aggressive or paranoid"</li>
                    <li><span className="font-medium">Compulsions:</span> "User must collect gold coins they see" or "Must drink blood weekly"</li>
                    <li><span className="font-medium">Attracts danger:</span> "Undead can sense the item from a mile away"</li>
                    <li><span className="font-medium">Binding curses:</span> "Cannot be willingly removed until a condition is met"</li>
                  </ul>
                  <p className="text-sm italic mt-2">The best curses create interesting roleplaying opportunities rather than just punishing players. They should make the item interesting, not unusable.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-fantasy">Create Magic Item</CardTitle>
              <CardDescription>Design a new magical item for your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input id="item-name" placeholder="e.g. Staff of Winter's Grasp or Amulet of Far Sight" />
              </div>
              
              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select>
                  <SelectTrigger id="item-type">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center">
                          <span className="mr-2">{type.icon}</span>
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Rarity</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {itemRarities.map((rarity) => (
                    <Button
                      key={rarity.id}
                      variant={selectedRarity === rarity.id ? "default" : "outline"}
                      className={`flex flex-col h-auto items-start justify-start p-3 text-left ${
                        selectedRarity === rarity.id ? "" : `hover:${rarity.color}`
                      }`}
                      onClick={() => setSelectedRarity(rarity.id)}
                    >
                      <span className="font-medium text-sm">{rarity.name}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {itemRarities.find(r => r.id === selectedRarity)?.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea 
                  id="item-description" 
                  placeholder="Describe the item's appearance, feel, and general magical aura..." 
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-properties">Magical Properties (one per line)</Label>
                <Textarea 
                  id="item-properties" 
                  placeholder="+1 to attack and damage rolls
Can cast Fireball once per day
Glows in the presence of dragons"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex items-center space-x-2 my-2">
                <input type="checkbox" id="requires-attunement" className="rounded border-gray-300" />
                <Label htmlFor="requires-attunement" className="text-sm font-normal">
                  Requires Attunement
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-lore">Lore/History (Optional)</Label>
                <Textarea 
                  id="item-lore" 
                  placeholder="Who created this item? What is its history? Any famous owners?"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-curse">Curse or Drawback (Optional)</Label>
                <Textarea 
                  id="item-curse" 
                  placeholder="Does this item have any negative effects or requirements?"
                  className="min-h-[60px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campaign">Add to Campaign (Optional)</Label>
                <Select>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign-1">The Shattered Isles of Eldoria</SelectItem>
                    <SelectItem value="campaign-2">Shadows of Ravenholme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Save Magic Item
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-fantasy">Magic Item Examples</CardTitle>
              <CardDescription>Sample items for inspiration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sampleItems.map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-lg">{item.name}</h3>
                    <Badge 
                      className={
                        item.rarity === "common" ? "bg-gray-100 text-gray-800" :
                        item.rarity === "uncommon" ? "bg-green-100 text-green-800" :
                        item.rarity === "rare" ? "bg-blue-100 text-blue-800" :
                        item.rarity === "very-rare" ? "bg-purple-100 text-purple-800" :
                        item.rarity === "legendary" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }
                    >
                      {item.rarity.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <span className="italic">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      {item.attunement && " (requires attunement)"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                  
                  <div className="mb-3">
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Properties</div>
                    <ul className="list-disc list-inside text-sm">
                      {item.properties.map((property, idx) => (
                        <li key={idx} className="ml-1">{property}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {item.lore && (
                    <div className="mb-3">
                      <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Lore</div>
                      <p className="text-sm text-muted-foreground italic">{item.lore}</p>
                    </div>
                  )}
                  
                  {item.curses && (
                    <div>
                      <div className="text-xs font-medium uppercase text-red-600 mb-1">Curse</div>
                      <p className="text-sm text-red-600">{item.curses}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-fantasy text-base">Tips for Memorable Magic Items</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Make items that augment character abilities rather than replacing them</p>
              <p>• Consider items that encourage creative problem-solving</p>
              <p>• Add sensory details - how does it look, feel, sound, or smell?</p>
              <p>• Items with a story hook or mystery can drive adventure</p>
              <p>• For powerful items, include meaningful limitations or costs</p>
              <p>• Consider how the item fits into your world's history and magic</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CompanionsTab() {
  const [activeViewTab, setActiveViewTab] = useState("stock-companions"); // "my-companions" or "stock-companions"
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedRole, setSelectedRole] = useState("companion");
  const [selectedNpcId, setSelectedNpcId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch user's companions
  const { data: companions = [], isLoading: isLoadingCompanions } = useQuery({
    queryKey: ["/api/npcs/companions"],
    refetchOnWindowFocus: false,
  });
  
  // Fetch stock companions
  const { data: stockCompanions = [], isLoading: isLoadingStockCompanions } = useQuery({
    queryKey: ["/api/npcs/stock-companions"],
    refetchOnWindowFocus: false,
  });
  
  // Fetch campaigns for dropdown
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    refetchOnWindowFocus: false,
  });
  
  // Mutation to add NPC to campaign
  const addToCampaignMutation = useMutation({
    mutationFn: async (data: { campaignId: number; npcId: number; role: string }) => {
      const response = await apiRequest("POST", `/api/campaigns/${data.campaignId}/npcs`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add companion to campaign");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Companion has been added to your campaign.",
      });
      // Reset selection state
      setSelectedCampaignId("");
      setSelectedNpcId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add companion to campaign",
        variant: "destructive",
      });
    },
  });

  if (isLoadingCompanions || isLoadingStockCompanions) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading companions...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-fantasy font-semibold">NPC Companions</h2>
          <p className="text-muted-foreground">Add companion NPCs to your campaigns</p>
        </div>
        <Button>
          <Plus size={16} className="mr-2" />
          Create Companion
        </Button>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b mb-6">
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeViewTab === "my-companions"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveViewTab("my-companions")}
          >
            My Companions
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeViewTab === "stock-companions"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveViewTab("stock-companions")}
          >
            Ready-Made Companions
          </button>
        </div>
      </div>
      
      {/* Display companions based on active tab */}
      {activeViewTab === "stock-companions" ? (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            These ready-made companions can be added directly to your campaigns without needing to create them from scratch.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(stockCompanions) && stockCompanions.map((companion: any) => (
              <Card key={companion.id} className="border-2 border-primary/10 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-fantasy">{companion.name}</CardTitle>
                    {companion.companionType && (
                      <Badge className={
                        companion.companionType === "combat" ? "bg-red-600" :
                        companion.companionType === "support" ? "bg-green-600" :
                        companion.companionType === "utility" ? "bg-blue-600" :
                        "bg-purple-600"
                      }>
                        {companion.companionType === "combat" ? "Combat" :
                         companion.companionType === "support" ? "Support" :
                         companion.companionType === "utility" ? "Utility" : "Social"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{companion.race} • {companion.occupation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      {companion.personality && companion.personality.length > 100 
                        ? companion.personality.substring(0, 100) + "..." 
                        : companion.personality}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Level {companion.level || 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>HP {companion.hitPoints || 10}/{companion.maxHitPoints || 10}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>AC {companion.armorClass || 10}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-2 border-t flex justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedNpcId(companion.id)}
                        >
                          Add to Campaign
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add {companion.name} to Campaign</DialogTitle>
                          <DialogDescription>
                            Select which campaign you want to add this companion to
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="campaign">Campaign</Label>
                            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                              <SelectTrigger id="campaign">
                                <SelectValue placeholder="Select a campaign" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(campaigns) && campaigns.map((campaign: any) => (
                                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                    {campaign.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="role">Role in Campaign</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                              <SelectTrigger id="role">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="companion">Companion</SelectItem>
                                <SelectItem value="ally">Ally</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              if (selectedCampaignId && selectedNpcId) {
                                addToCampaignMutation.mutate({
                                  campaignId: parseInt(selectedCampaignId),
                                  npcId: selectedNpcId,
                                  role: selectedRole
                                });
                              } else {
                                toast({
                                  title: "Missing information",
                                  description: "Please select a campaign",
                                  variant: "destructive"
                                });
                              }
                            }}
                            disabled={addToCampaignMutation.isPending}
                          >
                            {addToCampaignMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add to Campaign"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        // My Companions Tab
        <div>
          {Array.isArray(companions) && companions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companions.map((companion: any) => (
                <Card key={companion.id} className="border hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{companion.name}</CardTitle>
                    <CardDescription>{companion.race} • {companion.occupation}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{companion.personality}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">You haven't created any companions yet</p>
              <Button className="mt-4">Create Companion</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}