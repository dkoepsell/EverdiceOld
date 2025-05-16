import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { InlineTip } from "@/components/learning/DnDRulesGuide";
import { 
  BookOpen, 
  DiceD20, 
  Scroll, 
  Swords, 
  Shield, 
  Wand2, 
  User, 
  Map, 
  HelpCircle, 
  Users, 
  Search,
  FileText
} from "lucide-react";

export default function DnDGuide() {
  const [activeCategory, setActiveCategory] = useState("getting-started");
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-fantasy font-bold mb-2">D&D Beginner's Guide</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Learn everything you need to know about playing Dungeons & Dragons, from basic rules to advanced techniques
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="sticky top-8">
            <Card>
              <CardHeader className="bg-primary/10 pb-3">
                <CardTitle className="text-base font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Table of Contents
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 p-4">
                <nav className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'getting-started' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('getting-started')}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Getting Started
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'character-creation' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('character-creation')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Character Creation
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'rules' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('rules')}
                  >
                    <Scroll className="mr-2 h-4 w-4" />
                    Core Rules
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'combat' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('combat')}
                  >
                    <Swords className="mr-2 h-4 w-4" />
                    Combat
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'magic' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('magic')}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Magic & Spellcasting
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'equipment' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('equipment')}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Equipment & Items
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'adventuring' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('adventuring')}
                  >
                    <Map className="mr-2 h-4 w-4" />
                    Adventuring
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'dm-basics' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('dm-basics')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    DM Basics
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start text-sm h-auto py-2 px-3 font-normal ${activeCategory === 'faq' ? 'bg-primary/10 font-medium text-primary' : ''}`}
                    onClick={() => setActiveCategory('faq')}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    FAQ
                  </Button>
                </nav>
              </CardContent>
              <CardFooter className="bg-secondary/10 px-4 py-3">
                <div className="w-full">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search guides..." 
                      className="w-full pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        <div className="lg:col-span-3 order-1 lg:order-2">
          {activeCategory === 'getting-started' && (
            <GettingStartedContent />
          )}
          
          {activeCategory === 'character-creation' && (
            <CharacterCreationContent />
          )}
          
          {activeCategory === 'rules' && (
            <CoreRulesContent />
          )}
          
          {activeCategory === 'combat' && (
            <CombatContent />
          )}
          
          {activeCategory === 'magic' && (
            <MagicContent />
          )}
          
          {activeCategory === 'equipment' && (
            <EquipmentContent />
          )}
          
          {activeCategory === 'adventuring' && (
            <AdventuringContent />
          )}
          
          {activeCategory === 'dm-basics' && (
            <DMBasicsContent />
          )}
          
          {activeCategory === 'faq' && (
            <FAQContent />
          )}
        </div>
      </div>
    </div>
  );
}

function GettingStartedContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Welcome to Dungeons & Dragons</CardTitle>
          <CardDescription>
            The world's greatest roleplaying game
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Dungeons & Dragons is a cooperative storytelling game that harnesses your imagination and invites you to explore a fantastic world of adventure, where heroes battle monsters, find treasures, and overcome challenges.
          </p>
          
          <p>
            At its heart, D&D is a game about creating stories together. The Dungeon Master (DM) sets the scene and controls the various non-player characters and monsters, while the players control their individual characters, deciding what they want to do and rolling dice to determine the outcomes of their actions.
          </p>
          
          <h3>What You'll Need</h3>
          <ul>
            <li><strong>Players</strong>: A group typically consists of one DM and 3-5 players</li>
            <li><strong>Dice</strong>: A set of polyhedral dice (d4, d6, d8, d10, d12, d20)</li>
            <li><strong>Character Sheets</strong>: To record your character's abilities and stats</li>
            <li><strong>Imagination</strong>: The most important component!</li>
          </ul>
          
          <h3>Key Concepts</h3>
          <ul>
            <li><strong>Roleplaying</strong>: Acting as your character would in the fantasy world</li>
            <li><strong>Ability Checks</strong>: Rolling dice to determine success at various tasks</li>
            <li><strong>Combat</strong>: Turn-based encounters with monsters and other threats</li>
            <li><strong>Advancement</strong>: Characters gain experience and become more powerful over time</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy flex items-center">
            <DiceD20 className="mr-2 h-5 w-5" />
            Understanding Dice Notation
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            D&D uses different types of dice, referred to by the letter "d" followed by the number of sides:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg text-center">
              <span className="text-xl font-bold text-primary block">d4</span>
              <span className="text-sm">Four-sided die</span>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg text-center">
              <span className="text-xl font-bold text-primary block">d6</span>
              <span className="text-sm">Six-sided die</span>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg text-center">
              <span className="text-xl font-bold text-primary block">d8</span>
              <span className="text-sm">Eight-sided die</span>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg text-center">
              <span className="text-xl font-bold text-primary block">d10</span>
              <span className="text-sm">Ten-sided die</span>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg text-center">
              <span className="text-xl font-bold text-primary block">d12</span>
              <span className="text-sm">Twelve-sided die</span>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg text-center">
              <span className="text-xl font-bold text-primary block">d20</span>
              <span className="text-sm">Twenty-sided die</span>
            </div>
          </div>
          
          <p>
            Often, dice notation will include a number before the "d" to indicate how many dice to roll, and may include modifiers after:
          </p>
          
          <ul>
            <li><strong>2d6</strong>: Roll two six-sided dice and add the results</li>
            <li><strong>1d8+3</strong>: Roll one eight-sided die and add 3 to the result</li>
            <li><strong>3d4-1</strong>: Roll three four-sided dice, add them together, and subtract 1</li>
          </ul>
          
          <p>
            The d20 is the most important die in D&D, used for attack rolls, ability checks, and saving throws.
          </p>
        </CardContent>
      </Card>
      
      <InlineTip
        tip={{
          id: "roleplaying-tips",
          title: "Tips for New Players",
          category: "roleplaying",
          content: "If you're new to roleplaying games, here are some tips to help you get started:\n\n• Don't worry about being perfect - everyone starts somewhere!\n• Think about your character's personality, goals, and flaws\n• Listen to the DM and other players\n• Ask questions when you're unsure\n• Take notes during sessions\n• Try to avoid distractions during play\n• Remember that the goal is to have fun together",
          examples: [
            "Instead of saying \"I attack the goblin\", try \"Thorne raises his battle axe with a determined scowl and charges toward the sneering goblin\"",
            "When meeting an NPC, consider how your character would react based on their background and personality"
          ]
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy">Basic Gameplay Loop</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol>
            <li><strong>The DM describes the environment</strong>: Where the characters are, what's around them, and what's happening.</li>
            <li><strong>The players describe what they want to do</strong>: Each player decides what their character does and tells the DM.</li>
            <li><strong>The DM narrates the results</strong>: Based on the players' actions, the DM determines what happens next, often using dice rolls to resolve uncertain outcomes.</li>
          </ol>
          
          <p>
            This cycle repeats throughout the game, creating a collaborative story where the outcomes are determined by the players' choices and the roll of the dice.
          </p>
          
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <h4 className="text-primary font-medium mb-2">Example Play</h4>
            <p className="italic">
              <strong>DM</strong>: "You find yourselves in a dimly lit tavern. The air is thick with smoke and the murmur of hushed conversations. A hooded figure in the corner seems to be watching your group."
            </p>
            <p className="italic">
              <strong>Player 1</strong>: "I want to approach the hooded figure and ask what their business is with us."
            </p>
            <p className="italic">
              <strong>DM</strong>: "As you approach, make a Perception check to see if you notice anything unusual."
            </p>
            <p className="italic">
              <strong>Player 1</strong>: "I rolled a 15 plus my Perception bonus of 2, so 17 total."
            </p>
            <p className="italic">
              <strong>DM</strong>: "With a 17, you notice that the figure's hands are stained with what looks like ink, and several scrolls are poking out from their cloak. As you get closer, they gesture for you to sit down."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CharacterCreationContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Creating Your Character</CardTitle>
          <CardDescription>
            Your gateway to adventure in the world of D&D
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Your character is your avatar in the D&D world—a combination of statistics, roleplaying hooks, and your imagination. Creating a character involves several steps:
          </p>
          
          <h3>1. Choose a Race</h3>
          <p>
            Your character's race establishes fundamental qualities about your character. It affects their appearance, lifespan, and provides certain racial traits and ability score increases.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Common Races</h4>
              <ul className="list-disc pl-5 mt-1">
                <li>Human: Versatile and adaptable</li>
                <li>Elf: Graceful, magical, and long-lived</li>
                <li>Dwarf: Hardy, tradition-bound, and resistant to poison</li>
                <li>Halfling: Small, nimble, and lucky</li>
              </ul>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Uncommon Races</h4>
              <ul className="list-disc pl-5 mt-1">
                <li>Dragonborn: Dragon-like humanoids with breath weapons</li>
                <li>Gnome: Small, inventive, and magical</li>
                <li>Half-Orc: Strong, enduring, and intimidating</li>
                <li>Tiefling: Humans with demonic heritage</li>
              </ul>
            </div>
          </div>
          
          <h3>2. Choose a Class</h3>
          <p>
            Your character's class is their profession—the specific adventuring skill set they bring to the table. Each class has its own special abilities and playstyle.
          </p>
          
          <Tabs defaultValue="martial" className="mt-4">
            <TabsList className="mb-2">
              <TabsTrigger value="martial">Martial Classes</TabsTrigger>
              <TabsTrigger value="magical">Magical Classes</TabsTrigger>
              <TabsTrigger value="hybrid">Hybrid Classes</TabsTrigger>
            </TabsList>
            <TabsContent value="martial" className="space-y-2">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Fighter</h4>
                <p className="text-sm">Masters of combat with unparalleled weapon and armor proficiency. Excellent for beginners.</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Barbarian</h4>
                <p className="text-sm">Fierce warriors who channel primal rage to enhance their combat abilities.</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Rogue</h4>
                <p className="text-sm">Skilled in stealth, trap-finding, and dealing devastating surprise attacks.</p>
              </div>
            </TabsContent>
            <TabsContent value="magical" className="space-y-2">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Wizard</h4>
                <p className="text-sm">Scholarly magic-users with a vast array of spells recorded in their spellbooks.</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Sorcerer</h4>
                <p className="text-sm">Innate spellcasters whose magic flows from their bloodline or mysterious origin.</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Warlock</h4>
                <p className="text-sm">Spellcasters who gain power through pacts with powerful otherworldly entities.</p>
              </div>
            </TabsContent>
            <TabsContent value="hybrid" className="space-y-2">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Paladin</h4>
                <p className="text-sm">Holy warriors who combine martial prowess with divine magic and healing abilities.</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Ranger</h4>
                <p className="text-sm">Wilderness experts who blend combat skills with nature magic and tracking abilities.</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Bard</h4>
                <p className="text-sm">Versatile performers whose music and tales can inspire allies and harm enemies.</p>
              </div>
            </TabsContent>
          </Tabs>
          
          <h3 className="mt-6">3. Determine Ability Scores</h3>
          <p>
            Your character has six ability scores that represent their basic attributes:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Strength (STR)</h4>
              <p className="text-sm">Physical power, melee attacks, lifting capacity</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Dexterity (DEX)</h4>
              <p className="text-sm">Agility, reflexes, ranged attacks, stealth</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Constitution (CON)</h4>
              <p className="text-sm">Endurance, stamina, hit points, resistance</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Intelligence (INT)</h4>
              <p className="text-sm">Knowledge, memory, reasoning, wizard spells</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Wisdom (WIS)</h4>
              <p className="text-sm">Perception, intuition, insight, cleric spells</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Charisma (CHA)</h4>
              <p className="text-sm">Force of personality, leadership, bard spells</p>
            </div>
          </div>
          
          <p>
            These scores typically range from 8-15 before racial modifiers. You can generate them using one of several methods:
          </p>
          
          <ul>
            <li><strong>Standard Array</strong>: 15, 14, 13, 12, 10, 8 (assigned as desired)</li>
            <li><strong>Point Buy</strong>: Allocate a pool of points to customize your scores</li>
            <li><strong>Rolling</strong>: Roll 4d6, drop the lowest die, and record the total</li>
          </ul>
        </CardContent>
      </Card>
      
      <InlineTip
        tip={{
          id: "character-background",
          title: "Creating a Memorable Character Background",
          category: "character_creation",
          content: "A good character background connects your character to the world and provides motivations for adventuring. Consider including these elements:\n\n• Where your character comes from\n• Important relationships and connections\n• Formative experiences that shaped them\n• Goals and aspirations\n• Fears and weaknesses\n• Quirks and personality traits",
          examples: [
            "Instead of \"My character is an orphan,\" try \"My character was raised in the Crimson Monastery after being abandoned as an infant, learning healing arts but secretly practicing forbidden magic at night.\"",
            "Rather than \"My character wants treasure,\" consider \"My character seeks ancient artifacts connected to their family's legacy, hoping to restore their disgraced house to its former glory.\""
          ]
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy">Finishing Touches</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>4. Choose a Background</h3>
          <p>
            Your character's background represents their life before becoming an adventurer. It provides additional proficiencies, equipment, and roleplaying hooks.
          </p>
          
          <p>
            Common backgrounds include:
          </p>
          <ul>
            <li><strong>Acolyte</strong>: Religious training and service at a temple</li>
            <li><strong>Criminal</strong>: A history of breaking the law</li>
            <li><strong>Noble</strong>: Born to wealth, title, and privilege</li>
            <li><strong>Sage</strong>: A lifetime of academic study</li>
            <li><strong>Soldier</strong>: Military experience and training</li>
          </ul>
          
          <h3>5. Select Equipment</h3>
          <p>
            Your class and background provide starting equipment, typically including:
          </p>
          <ul>
            <li>Weapons appropriate to your class</li>
            <li>Armor (if your class is proficient)</li>
            <li>Adventuring gear (backpack, rope, torches, etc.)</li>
            <li>Tools related to your skills and background</li>
          </ul>
          
          <h3>6. Define Character Details</h3>
          <p>
            Add personality and depth to your character:
          </p>
          <ul>
            <li><strong>Personality Traits</strong>: How does your character typically behave?</li>
            <li><strong>Ideals</strong>: What principles does your character believe in?</li>
            <li><strong>Bonds</strong>: What people, places, or things are important to your character?</li>
            <li><strong>Flaws</strong>: What weaknesses or shortcomings does your character have?</li>
          </ul>
          
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <h4 className="text-primary font-medium mb-2">Example Character Concept</h4>
            <p>
              <strong>Thorne Ironfist</strong> is a Hill Dwarf Fighter who served as a town guard before dedicating his life to adventuring. After his town was ransacked by orcs, he swore an oath to protect the innocent and bring justice to evildoers. He's gruff but fair-minded, values honesty above all else, and has a secret fondness for exotic teas collected during his travels.
            </p>
            <p className="mt-2">
              <strong>Ability Scores</strong>: STR 16, DEX 12, CON 16, INT 10, WIS 13, CHA 8<br />
              <strong>Background</strong>: Soldier<br />
              <strong>Personality</strong>: No-nonsense, loyal, strategic thinker<br />
              <strong>Flaw</strong>: Holds grudges forever and never forgets a slight
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CoreRulesContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Core Game Mechanics</CardTitle>
          <CardDescription>
            Understanding the fundamental rules of D&D
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>The d20 System</h3>
          <p>
            At the heart of D&D is the d20 system. When your character attempts an action with an uncertain outcome, you roll a twenty-sided die (d20) and add relevant modifiers. If the total equals or exceeds the target number (called a Difficulty Class or DC), the action succeeds.
          </p>
          
          <div className="bg-secondary/10 p-4 rounded-lg my-4">
            <h4 className="font-medium text-primary mb-2">The Basic Roll</h4>
            <p className="text-sm">d20 + ability modifier + proficiency bonus (if applicable) ≥ DC = success</p>
          </div>
          
          <h3>Ability Checks</h3>
          <p>
            When your character attempts to accomplish a task that has a chance of failure, the DM may call for an ability check. Roll a d20 and add the relevant ability modifier. Sometimes, your character's proficiency bonus is also added if you're skilled in the relevant area.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div>
              <h4 className="font-medium text-primary mb-2">Common Strength Checks</h4>
              <ul className="list-disc pl-5">
                <li>Breaking down doors</li>
                <li>Lifting heavy objects</li>
                <li>Bending bars</li>
                <li>Athletics: climbing, jumping, swimming</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-primary mb-2">Common Dexterity Checks</h4>
              <ul className="list-disc pl-5">
                <li>Moving silently (Stealth)</li>
                <li>Picking locks</li>
                <li>Disabling traps</li>
                <li>Acrobatics: balance, tumbling</li>
              </ul>
            </div>
          </div>
          
          <h3>Saving Throws</h3>
          <p>
            Saving throws represent your character's attempt to resist a threat. Like ability checks, you roll a d20 and add the relevant ability modifier, and sometimes your proficiency bonus.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div>
              <h4 className="font-medium text-primary mb-2">Common Saving Throws</h4>
              <ul className="list-disc pl-5">
                <li>Strength: Resisting physical force</li>
                <li>Dexterity: Dodging area effects</li>
                <li>Constitution: Withstanding poison, disease</li>
                <li>Intelligence: Resisting mind-affecting spells</li>
                <li>Wisdom: Resisting charm or fear effects</li>
                <li>Charisma: Resisting possession, banishment</li>
              </ul>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="text-primary font-medium mb-2">Example</h4>
              <p className="text-sm">
                A character walking through a trapped hallway might need to make a Dexterity saving throw to avoid a sudden burst of flame. If the trap has a DC of 15, and the character has a Dexterity modifier of +2 and is proficient in Dexterity saving throws (+3 proficiency bonus), they would need to roll a 10 or higher on the d20 (10 + 2 + 3 = 15) to succeed.
              </p>
            </div>
          </div>
          
          <h3>Advantage and Disadvantage</h3>
          <p>
            Sometimes, circumstances influence a d20 roll, making it easier (advantage) or harder (disadvantage):
          </p>
          
          <ul>
            <li><strong>Advantage</strong>: Roll two d20s and take the higher result</li>
            <li><strong>Disadvantage</strong>: Roll two d20s and take the lower result</li>
          </ul>
          
          <p>
            Multiple sources of advantage or disadvantage don't stack—you either have advantage, disadvantage, or neither. If you have both advantage and disadvantage, they cancel each other out.
          </p>
        </CardContent>
      </Card>
      
      <InlineTip
        tip={{
          id: "difficulty-class",
          title: "Difficulty Class (DC)",
          category: "rules",
          content: "The Difficulty Class (DC) represents how challenging a task is to accomplish. The DM sets the DC based on the task's complexity:\n\n• Very Easy (DC 5): Tasks that most anyone can accomplish\n• Easy (DC 10): Tasks requiring minimal training or talent\n• Moderate (DC 15): Tasks requiring significant skill\n• Hard (DC 20): Tasks requiring exceptional skill or ability\n• Very Hard (DC 25): Tasks that only the most talented can hope to accomplish\n• Nearly Impossible (DC 30): Tasks at the limit of what's possible",
          examples: [
            "Breaking down a rotted wooden door might be a DC 10 Strength check",
            "Picking a complex lock might be a DC 20 Dexterity check",
            "Recalling obscure historical knowledge might be a DC 15 Intelligence check",
            "Convincing a hostile guard to let you pass might be a DC 20 Charisma check"
          ]
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy">Skills and Proficiencies</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Skills represent specific areas of expertise. When making an ability check in an area where you're proficient, you add your proficiency bonus to the roll.
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="strength-skills">
              <AccordionTrigger className="font-medium">Strength Skills</AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 border-l-2 border-primary/20">
                  <p className="font-medium">Athletics</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Used for climbing, jumping, swimming, and other physical activities requiring strength.
                  </p>
                  <div className="bg-secondary/10 p-2 rounded-lg text-sm">
                    <strong>Example</strong>: Athletics check to climb a steep cliff or swim against a strong current.
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="dexterity-skills">
              <AccordionTrigger className="font-medium">Dexterity Skills</AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 border-l-2 border-primary/20 space-y-4">
                  <div>
                    <p className="font-medium">Acrobatics</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Used for balance, tumbling, and graceful movement.
                    </p>
                    <div className="bg-secondary/10 p-2 rounded-lg text-sm">
                      <strong>Example</strong>: Acrobatics check to walk across a tightrope or flip over an enemy.
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium">Sleight of Hand</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Used for manual trickery, picking pockets, and hiding small objects.
                    </p>
                    <div className="bg-secondary/10 p-2 rounded-lg text-sm">
                      <strong>Example</strong>: Sleight of Hand check to plant evidence on someone or palm a small object.
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium">Stealth</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Used for hiding, moving silently, and avoiding detection.
                    </p>
                    <div className="bg-secondary/10 p-2 rounded-lg text-sm">
                      <strong>Example</strong>: Stealth check to sneak past guards or hide in shadows.
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="intelligence-skills">
              <AccordionTrigger className="font-medium">Intelligence Skills</AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 border-l-2 border-primary/20 space-y-4">
                  <div>
                    <p className="font-medium">Arcana</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Knowledge of magic, magical items, eldritch symbols, and arcane traditions.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">History</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Knowledge of historical events, legendary people, ancient kingdoms, and past disputes.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Investigation</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Looking for clues, deducing from evidence, and solving mysteries.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Nature</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Knowledge of terrain, plants and animals, weather, and natural cycles.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Religion</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Knowledge of deities, religious practices, holy symbols, and ecclesiastical hierarchies.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="wisdom-skills">
              <AccordionTrigger className="font-medium">Wisdom Skills</AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 border-l-2 border-primary/20 space-y-4">
                  <div>
                    <p className="font-medium">Animal Handling</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Calming, training, and understanding the needs of domesticated animals.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Insight</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Determining the true intentions of a creature, detecting lies, and reading body language.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Medicine</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Stabilizing the dying, diagnosing illnesses, and treating wounds.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Perception</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Spotting, hearing, or otherwise detecting the presence of something; being generally aware of your surroundings.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Survival</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Following tracks, hunting wild game, guiding through wilderness, predicting weather, and avoiding natural hazards.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="charisma-skills">
              <AccordionTrigger className="font-medium">Charisma Skills</AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 border-l-2 border-primary/20 space-y-4">
                  <div>
                    <p className="font-medium">Deception</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Lying convincingly, fast-talking, creating disguises, and misleading others.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Intimidation</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Influencing others through threats, hostile actions, and physical violence.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Performance</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Entertaining audiences with music, dance, acting, storytelling, or other forms of performance.
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium">Persuasion</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Influencing others through logic, etiquette, good-natured requests, or simple charm.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <h3 className="mt-6">Other Proficiencies</h3>
          <p>
            In addition to skills, characters may have proficiency with:
          </p>
          
          <ul>
            <li><strong>Weapons</strong>: Allows you to add your proficiency bonus to attack rolls</li>
            <li><strong>Armor</strong>: Allows you to wear armor without penalties</li>
            <li><strong>Tools</strong>: Such as thieves' tools, artisan's tools, or musical instruments</li>
            <li><strong>Languages</strong>: Allows you to speak, read, and write additional languages</li>
            <li><strong>Vehicles</strong>: Proficiency with land vehicles, water vehicles, or airborne vehicles</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function CombatContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Combat Basics</CardTitle>
          <CardDescription>
            Understanding the turn-based combat system of D&D
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>The Combat Sequence</h3>
          <ol>
            <li><strong>Determine surprise</strong>: The DM determines if any participants are surprised</li>
            <li><strong>Establish positions</strong>: The DM decides where all the characters and monsters are located</li>
            <li><strong>Roll initiative</strong>: Everyone rolls initiative (d20 + Dexterity modifier)</li>
            <li><strong>Take turns</strong>: Each participant takes a turn in initiative order</li>
            <li><strong>Begin the next round</strong>: When everyone has taken a turn, the round ends</li>
          </ol>
          
          <h3>On Your Turn</h3>
          <p>
            On your turn, you can:
          </p>
          <ul>
            <li><strong>Move</strong> up to your speed (typically 30 feet)</li>
            <li>Take one <strong>action</strong></li>
            <li>Take one <strong>bonus action</strong> (if available)</li>
            <li>Use one <strong>free object interaction</strong> (drawing a weapon, opening a door, etc.)</li>
          </ul>
          
          <div className="bg-secondary/10 p-4 rounded-lg my-4">
            <h4 className="font-medium text-primary mb-2">Common Actions in Combat</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Attack</p>
                <p className="text-sm">Make a melee or ranged attack against a target</p>
              </div>
              <div>
                <p className="font-medium">Cast a Spell</p>
                <p className="text-sm">Cast a spell with a casting time of 1 action</p>
              </div>
              <div>
                <p className="font-medium">Dash</p>
                <p className="text-sm">Double your movement speed for the turn</p>
              </div>
              <div>
                <p className="font-medium">Disengage</p>
                <p className="text-sm">Move without provoking opportunity attacks</p>
              </div>
              <div>
                <p className="font-medium">Dodge</p>
                <p className="text-sm">Attacks against you have disadvantage</p>
              </div>
              <div>
                <p className="font-medium">Help</p>
                <p className="text-sm">Give an ally advantage on their next ability check or attack</p>
              </div>
              <div>
                <p className="font-medium">Hide</p>
                <p className="text-sm">Make a Dexterity (Stealth) check to hide</p>
              </div>
              <div>
                <p className="font-medium">Ready</p>
                <p className="text-sm">Prepare an action to trigger when a specified condition occurs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <InlineTip
        tip={{
          id: "attack-rolls",
          title: "Attack Rolls",
          category: "combat",
          content: "When you make an attack, your attack roll determines whether the attack hits or misses. To make an attack roll, roll a d20 and add the appropriate modifiers. If the total equals or exceeds the target's Armor Class (AC), the attack hits.\n\nThe modifiers to the roll depend on what type of attack you're making. For melee weapon attacks, you use your Strength modifier. For ranged weapon attacks, you use your Dexterity modifier. For spell attacks, you use your spellcasting ability modifier.",
          examples: [
            "A fighter with +3 Strength swings a longsword at an enemy with AC 15. They roll a 13 on the d20, adding their +3 Strength modifier for a total of 16, which hits.",
            "A ranger with +4 Dexterity fires an arrow at a flying creature with AC 17. They roll an 11, adding their +4 Dexterity modifier for a total of 15, which misses."
          ],
          relatedRules: ["Critical Hits", "Advantage and Disadvantage", "Cover"]
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy">Damage and Hit Points</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            When an attack hits, it deals damage that reduces the target's hit points.
          </p>
          
          <h3>Types of Damage</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <p className="font-medium">Physical</p>
              <ul className="list-disc pl-5 text-sm">
                <li>Bludgeoning</li>
                <li>Piercing</li>
                <li>Slashing</li>
              </ul>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <p className="font-medium">Elemental</p>
              <ul className="list-disc pl-5 text-sm">
                <li>Acid</li>
                <li>Cold</li>
                <li>Fire</li>
                <li>Lightning</li>
                <li>Thunder</li>
              </ul>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <p className="font-medium">Magical</p>
              <ul className="list-disc pl-5 text-sm">
                <li>Force</li>
                <li>Necrotic</li>
                <li>Psychic</li>
                <li>Radiant</li>
                <li>Poison</li>
              </ul>
            </div>
          </div>
          
          <h3>Critical Hits</h3>
          <p>
            If you roll a 20 on the d20 for an attack roll, you score a critical hit. This means you roll all of the attack's damage dice twice and add them together, along with any modifiers.
          </p>
          
          <h3>Death and Dying</h3>
          <p>
            When you are reduced to 0 hit points, you fall unconscious and are dying. While dying, you make death saving throws at the start of each of your turns:
          </p>
          
          <ul>
            <li>Roll a d20 (no modifiers)</li>
            <li>10 or higher: Success</li>
            <li>9 or lower: Failure</li>
          </ul>
          
          <p>
            Three successes: You stabilize and remain unconscious<br />
            Three failures: You die
          </p>
          
          <p>
            A natural 20 on a death save immediately restores 1 hit point<br />
            A natural 1 on a death save counts as two failures
          </p>
          
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <h4 className="text-primary font-medium mb-2">Optional Rule: Massive Damage</h4>
            <p className="text-sm">
              If you take damage equal to or greater than your max hit points while at 0 hit points, you suffer instant death. For example, if your max HP is 12 and you're at 0 HP, taking 12+ damage kills you outright.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MagicContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Magic & Spellcasting</CardTitle>
          <CardDescription>
            Understanding the magical systems of D&D
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>Spellcasting Basics</h3>
          <p>
            Magic is a fundamental part of the D&D multiverse. Spellcasting classes like Wizards, Clerics, and Druids can cast powerful spells that can change the course of an adventure.
          </p>
          
          <h3>Spell Levels</h3>
          <p>
            Spells range from level 0 (cantrips) to level 9. Higher-level spells are more powerful but require higher-level spell slots to cast.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <p className="font-medium">Cantrips (Level 0)</p>
              <p className="text-sm">
                Simple magical effects that can be cast at will without expending spell slots. Examples include Minor Illusion, Fire Bolt, and Mage Hand.
              </p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <p className="font-medium">Leveled Spells (1-9)</p>
              <p className="text-sm">
                More powerful spells that require spell slots to cast. Examples include Magic Missile (1st), Fireball (3rd), and Wish (9th).
              </p>
            </div>
          </div>
          
          <h3>Spell Components</h3>
          <p>
            Most spells require components to cast:
          </p>
          
          <ul>
            <li><strong>Verbal (V)</strong>: Specific spoken words</li>
            <li><strong>Somatic (S)</strong>: Precise gestures or movements</li>
            <li><strong>Material (M)</strong>: Specific physical objects or substances</li>
          </ul>
          
          <h3>Spell Slots</h3>
          <p>
            Spellcasters have a limited number of spell slots of each level that they can use to cast spells. When you cast a spell, you expend a spell slot of the spell's level or higher. All expended spell slots are regained when the character completes a long rest.
          </p>
          
          <div className="bg-primary/5 p-4 rounded-lg mt-4">
            <h4 className="text-primary font-medium mb-2">Example: Spell Slots for a 5th Level Wizard</h4>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <p className="font-medium">1st</p>
                <p className="bg-primary/20 rounded-lg py-1">4</p>
              </div>
              <div className="text-center">
                <p className="font-medium">2nd</p>
                <p className="bg-primary/20 rounded-lg py-1">3</p>
              </div>
              <div className="text-center">
                <p className="font-medium">3rd</p>
                <p className="bg-primary/20 rounded-lg py-1">2</p>
              </div>
              <div className="text-center">
                <p className="font-medium">4th</p>
                <p className="bg-secondary/20 rounded-lg py-1">0</p>
              </div>
              <div className="text-center">
                <p className="font-medium">5th</p>
                <p className="bg-secondary/20 rounded-lg py-1">0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <InlineTip
        tip={{
          id: "spell-casting",
          title: "Spellcasting Basics",
          category: "spellcasting",
          content: "Spellcasting is the act of using magical energy to create varied effects. Each spellcasting class accesses magic in a different way.\n\nA spell has the following characteristics: level, casting time, range, components, duration, and a specific effect. To cast a spell, you must expend a spell slot of the spell's level or higher. Some spells can be cast at higher levels for greater effect.\n\nSpellcasting ability varies by class: Intelligence (Wizard), Wisdom (Cleric, Druid), or Charisma (Bard, Sorcerer, Warlock).",
          examples: [
            "A 3rd-level wizard with 16 Intelligence (+3 modifier) casts Magic Missile. The spell automatically hits its targets for 3 * (1d4+1) force damage.",
            "A 5th-level cleric with 18 Wisdom (+4 modifier) casts Cure Wounds using a 3rd-level spell slot. The spell heals 3d8 + 4 hit points."
          ],
          relatedRules: ["Spell Components", "Concentration", "Spell Saving Throws", "Spell Attack Rolls"]
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy">Spellcasting Classes</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <Tabs defaultValue="full-casters">
            <TabsList className="mb-2">
              <TabsTrigger value="full-casters">Full Casters</TabsTrigger>
              <TabsTrigger value="half-casters">Half Casters</TabsTrigger>
              <TabsTrigger value="third-casters">Third Casters</TabsTrigger>
              <TabsTrigger value="special-casters">Special Cases</TabsTrigger>
            </TabsList>
            
            <TabsContent value="full-casters" className="space-y-4">
              <p>
                Full casters have access to the full range of spell levels (1-9) at higher character levels:
              </p>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Wizard</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Intelligence
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Preparation</strong>: Prepares spells from their spellbook after a long rest
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Can learn new spells by finding and copying them into their spellbook
                </p>
              </div>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Cleric</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Wisdom
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Preparation</strong>: Prepares spells from the cleric spell list after a long rest
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Always has domain spells prepared based on their divine domain
                </p>
              </div>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Druid</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Wisdom
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Preparation</strong>: Prepares spells from the druid spell list after a long rest
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Can transform into beasts using Wild Shape
                </p>
              </div>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Bard</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Charisma
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Preparation</strong>: Knows a fixed number of spells, doesn't need to prepare them
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Bardic Inspiration and Jack of All Trades
                </p>
              </div>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Sorcerer</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Charisma
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Preparation</strong>: Knows a fixed number of spells, doesn't need to prepare them
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Metamagic allows them to modify their spells
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="half-casters" className="space-y-4">
              <p>
                Half casters progress at a slower rate and can only cast spells up to 5th level at higher character levels:
              </p>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Paladin</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Charisma
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Preparation</strong>: Prepares spells from the paladin spell list after a long rest
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Divine Smite allows them to deal extra damage by expending spell slots
                </p>
              </div>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Ranger</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Wisdom
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Preparation</strong>: Knows a fixed number of spells, doesn't need to prepare them
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Favored Enemy and Natural Explorer provide non-magical benefits
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="third-casters" className="space-y-4">
              <p>
                Third casters progress even slower and can only cast spells up to 4th level at higher character levels:
              </p>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Eldritch Knight (Fighter)</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Intelligence
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Selection</strong>: Limited to Abjuration and Evocation spells, with some exceptions
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: War Magic allows them to attack after casting certain spells
                </p>
              </div>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Arcane Trickster (Rogue)</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Intelligence
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Selection</strong>: Limited to Enchantment and Illusion spells, with some exceptions
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Magical Ambush gives disadvantage on saving throws to creatures that can't see them
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="special-casters" className="space-y-4">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Warlock</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Ability</strong>: Charisma
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Slots</strong>: Few but powerful spell slots that recharge on a short rest
                </p>
                <p className="text-sm mb-1">
                  <strong>Special Feature</strong>: Eldritch Invocations provide additional magical abilities
                </p>
                <p className="text-sm">
                  <strong>Note</strong>: Warlocks gain access to some higher-level spells through Mystic Arcanum rather than spell slots
                </p>
              </div>
              
              <div className="bg-secondary/10 p-3 rounded-lg">
                <h4 className="font-medium text-primary">Monk (Way of the Four Elements)</h4>
                <p className="text-sm mb-1">
                  <strong>Spellcasting Resource</strong>: Ki points instead of spell slots
                </p>
                <p className="text-sm mb-1">
                  <strong>Spell Selection</strong>: Limited selection of elemental "disciplines" that function similarly to spells
                </p>
                <p className="text-sm">
                  <strong>Special Feature</strong>: Combines martial arts with elemental magic
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function EquipmentContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Equipment & Items</CardTitle>
          <CardDescription>
            Understanding weapons, armor, and adventuring gear
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>Weapons</h3>
          <p>
            Weapons fall into two categories: melee and ranged. Each has its own set of properties and damage types.
          </p>
          
          <Tabs defaultValue="melee">
            <TabsList className="mb-2">
              <TabsTrigger value="melee">Melee Weapons</TabsTrigger>
              <TabsTrigger value="ranged">Ranged Weapons</TabsTrigger>
            </TabsList>
            
            <TabsContent value="melee" className="space-y-4">
              <p>
                Melee weapons are used for close-quarters combat and typically use Strength for attack and damage rolls.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary text-secondary-foreground">
                      <th className="p-2 text-left">Weapon</th>
                      <th className="p-2 text-left">Damage</th>
                      <th className="p-2 text-left">Properties</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-2">Dagger</td>
                      <td className="p-2">1d4 piercing</td>
                      <td className="p-2">Finesse, light, thrown (20/60)</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Shortsword</td>
                      <td className="p-2">1d6 piercing</td>
                      <td className="p-2">Finesse, light</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Longsword</td>
                      <td className="p-2">1d8 slashing</td>
                      <td className="p-2">Versatile (1d10)</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Battleaxe</td>
                      <td className="p-2">1d8 slashing</td>
                      <td className="p-2">Versatile (1d10)</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Warhammer</td>
                      <td className="p-2">1d8 bludgeoning</td>
                      <td className="p-2">Versatile (1d10)</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Greatsword</td>
                      <td className="p-2">2d6 slashing</td>
                      <td className="p-2">Heavy, two-handed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="text-primary font-medium mb-2">Weapon Properties</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <li><strong>Finesse</strong>: Use DEX instead of STR for attacks and damage</li>
                  <li><strong>Light</strong>: Suitable for two-weapon fighting</li>
                  <li><strong>Heavy</strong>: Small creatures have disadvantage</li>
                  <li><strong>Versatile</strong>: Higher damage when wielded with two hands</li>
                  <li><strong>Two-Handed</strong>: Requires two hands to use</li>
                  <li><strong>Reach</strong>: Adds 5 feet to your melee range</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="ranged" className="space-y-4">
              <p>
                Ranged weapons allow attacks from a distance and typically use Dexterity for attack and damage rolls.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary text-secondary-foreground">
                      <th className="p-2 text-left">Weapon</th>
                      <th className="p-2 text-left">Damage</th>
                      <th className="p-2 text-left">Range</th>
                      <th className="p-2 text-left">Properties</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-2">Shortbow</td>
                      <td className="p-2">1d6 piercing</td>
                      <td className="p-2">80/320</td>
                      <td className="p-2">Two-handed</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Longbow</td>
                      <td className="p-2">1d8 piercing</td>
                      <td className="p-2">150/600</td>
                      <td className="p-2">Heavy, two-handed</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Light Crossbow</td>
                      <td className="p-2">1d8 piercing</td>
                      <td className="p-2">80/320</td>
                      <td className="p-2">Loading, two-handed</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Heavy Crossbow</td>
                      <td className="p-2">1d10 piercing</td>
                      <td className="p-2">100/400</td>
                      <td className="p-2">Heavy, loading, two-handed</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2">Sling</td>
                      <td className="p-2">1d4 bludgeoning</td>
                      <td className="p-2">30/120</td>
                      <td className="p-2">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <h4 className="text-primary font-medium mb-2">Range and Properties</h4>
                <p className="text-sm mb-2">
                  <strong>Range (normal/maximum)</strong>: The first number is the normal range, and the second is the long range. Attacks beyond normal range have disadvantage.
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <li><strong>Ammunition</strong>: Requires arrows, bolts, or bullets</li>
                  <li><strong>Loading</strong>: Requires a free hand and limits attacks per turn</li>
                  <li><strong>Thrown</strong>: Can be thrown as a ranged attack</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
          
          <h3 className="mt-6">Armor</h3>
          <p>
            Armor provides protection by increasing your Armor Class (AC). Characters need proficiency to wear armor effectively.
          </p>
          
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary text-secondary-foreground">
                  <th className="p-2 text-left">Armor</th>
                  <th className="p-2 text-left">AC</th>
                  <th className="p-2 text-left">Strength</th>
                  <th className="p-2 text-left">Stealth</th>
                  <th className="p-2 text-left">Category</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-2">Padded</td>
                  <td className="p-2">11 + DEX</td>
                  <td className="p-2">-</td>
                  <td className="p-2">Disadvantage</td>
                  <td className="p-2">Light</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2">Leather</td>
                  <td className="p-2">11 + DEX</td>
                  <td className="p-2">-</td>
                  <td className="p-2">-</td>
                  <td className="p-2">Light</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2">Chain Shirt</td>
                  <td className="p-2">13 + DEX (max 2)</td>
                  <td className="p-2">-</td>
                  <td className="p-2">-</td>
                  <td className="p-2">Medium</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2">Breastplate</td>
                  <td className="p-2">14 + DEX (max 2)</td>
                  <td className="p-2">-</td>
                  <td className="p-2">-</td>
                  <td className="p-2">Medium</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2">Chain Mail</td>
                  <td className="p-2">16</td>
                  <td className="p-2">STR 13</td>
                  <td className="p-2">Disadvantage</td>
                  <td className="p-2">Heavy</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2">Plate</td>
                  <td className="p-2">18</td>
                  <td className="p-2">STR 15</td>
                  <td className="p-2">Disadvantage</td>
                  <td className="p-2">Heavy</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2">Shield</td>
                  <td className="p-2">+2</td>
                  <td className="p-2">-</td>
                  <td className="p-2">-</td>
                  <td className="p-2">Shield</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <InlineTip
        tip={{
          id: "magic-items",
          title: "Magic Items",
          category: "equipment",
          content: "Magic items are enchanted objects imbued with magical properties that provide special abilities, bonuses, or other effects. They range from common items with minor effects to legendary artifacts with world-altering powers.\n\nMagic items typically require attunement, a process that takes a short rest and creates a bond between the item and its user. Characters can be attuned to a maximum of three items at once.",
          examples: [
            "+1 Longsword: A weapon that grants a +1 bonus to attack and damage rolls",
            "Potion of Healing: Restores 2d4+2 hit points when consumed",
            "Ring of Protection: Grants a +1 bonus to AC and saving throws while worn",
            "Boots of Elvenkind: Grant advantage on Dexterity (Stealth) checks for moving quietly"
          ]
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy">Adventuring Gear</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Beyond weapons and armor, adventurers need a variety of equipment to survive and thrive in their adventures.
          </p>
          
          <h3>Essential Adventuring Gear</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div>
              <h4 className="font-medium text-primary mb-2">Survival Gear</h4>
              <ul className="list-disc pl-5">
                <li>Backpack</li>
                <li>Bedroll</li>
                <li>Mess kit</li>
                <li>Tinderbox</li>
                <li>Torches or lantern</li>
                <li>Rations (10 days)</li>
                <li>Waterskin</li>
                <li>50 feet of hempen rope</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-primary mb-2">Exploration Tools</h4>
              <ul className="list-disc pl-5">
                <li>10-foot pole</li>
                <li>Crowbar</li>
                <li>Hammer</li>
                <li>Pitons</li>
                <li>Grappling hook</li>
                <li>Chalk</li>
                <li>Ink and paper</li>
                <li>Spyglass</li>
              </ul>
            </div>
          </div>
          
          <h3>Special Equipment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary mb-2">Class-Specific Items</h4>
              <ul className="list-disc pl-5 text-sm">
                <li><strong>Wizards</strong>: Spellbook, component pouch or arcane focus</li>
                <li><strong>Clerics</strong>: Holy symbol, prayer book</li>
                <li><strong>Druids</strong>: Druidic focus, herbalism kit</li>
                <li><strong>Rogues</strong>: Thieves' tools, disguise kit</li>
                <li><strong>Bards</strong>: Musical instruments</li>
              </ul>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary mb-2">Specialized Tools</h4>
              <ul className="list-disc pl-5 text-sm">
                <li><strong>Healer's Kit</strong>: Stabilize dying creatures</li>
                <li><strong>Alchemist's Supplies</strong>: Create potions and alchemical items</li>
                <li><strong>Cartographer's Tools</strong>: Create accurate maps</li>
                <li><strong>Disguise Kit</strong>: Change appearance</li>
                <li><strong>Forgery Kit</strong>: Create false documents</li>
                <li><strong>Poisoner's Kit</strong>: Create and apply poisons</li>
              </ul>
            </div>
          </div>
          
          <h3>Mounts and Vehicles</h3>
          <p>
            For travel across large distances, mounts and vehicles are essential:
          </p>
          <ul>
            <li><strong>Horses</strong>: Common mounts that can travel 8 hours per day at about 4 mph</li>
            <li><strong>Exotic Mounts</strong>: Such as elephants, griffons, or hippogriffs</li>
            <li><strong>Carts and Wagons</strong>: For transporting supplies and goods</li>
            <li><strong>Ships</strong>: From small rowboats to massive sailing vessels</li>
            <li><strong>Airships</strong>: In some campaign settings, magical flying vessels are available</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function AdventuringContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Adventuring Basics</CardTitle>
          <CardDescription>
            How to survive and thrive in the wild lands beyond civilization
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>Travel</h3>
          <p>
            Adventure often involves journeying through various terrains and environments. How characters travel affects how quickly they move and what they might encounter.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Travel Pace</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="p-1 text-left">Pace</th>
                      <th className="p-1 text-left">Distance per Hour</th>
                      <th className="p-1 text-left">Distance per Day</th>
                      <th className="p-1 text-left">Effect</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-primary/10">
                      <td className="p-1">Fast</td>
                      <td className="p-1">4 miles</td>
                      <td className="p-1">30 miles</td>
                      <td className="p-1">-5 penalty to passive Perception</td>
                    </tr>
                    <tr className="border-b border-primary/10">
                      <td className="p-1">Normal</td>
                      <td className="p-1">3 miles</td>
                      <td className="p-1">24 miles</td>
                      <td className="p-1">None</td>
                    </tr>
                    <tr>
                      <td className="p-1">Slow</td>
                      <td className="p-1">2 miles</td>
                      <td className="p-1">18 miles</td>
                      <td className="p-1">Able to use stealth</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Terrain Difficulty</h4>
              <p className="text-sm mb-2">
                Different terrains affect travel speed:
              </p>
              <ul className="list-disc pl-5 text-sm">
                <li><strong>Roads</strong>: Normal pace</li>
                <li><strong>Plains/Grassland</strong>: Normal pace</li>
                <li><strong>Forest/Hills</strong>: 3/4 normal pace</li>
                <li><strong>Mountains/Swamp</strong>: 1/2 normal pace</li>
                <li><strong>Dense Jungle</strong>: 1/2 normal pace</li>
                <li><strong>Arctic/Desert</strong>: 3/4 normal pace with appropriate gear</li>
              </ul>
            </div>
          </div>
          
          <h3>Resting</h3>
          <p>
            Adventurers need to rest to recover from their exertions and restore their abilities:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Short Rest</h4>
              <p className="text-sm">
                A period of downtime, at least 1 hour long, during which a character does nothing more strenuous than eating, drinking, reading, and tending to wounds.
              </p>
              <p className="text-sm font-medium mt-2">Benefits:</p>
              <ul className="list-disc pl-5 text-sm">
                <li>Spend Hit Dice to recover hit points</li>
                <li>Some class features recharge (e.g., Warlock spell slots)</li>
              </ul>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Long Rest</h4>
              <p className="text-sm">
                A period of extended downtime, at least 8 hours long, during which a character sleeps for at least 6 hours and performs no more than 2 hours of light activity.
              </p>
              <p className="text-sm font-medium mt-2">Benefits:</p>
              <ul className="list-disc pl-5 text-sm">
                <li>Regain all hit points</li>
                <li>Regain up to half your total Hit Dice (minimum of 1)</li>
                <li>Regain all spent spell slots</li>
                <li>Reset abilities that recharge on a long rest</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <InlineTip
        tip={{
          id: "survival-challenges",
          title: "Environmental Challenges",
          category: "adventuring",
          content: "The wilderness presents many dangers beyond monsters:\n\n• Extreme Weather: Heat, cold, storms, and other weather phenomena can pose significant threats without proper preparation\n\n• Difficult Terrain: Mountains, swamps, dense forests, and other challenging landscapes can slow progress and create hazards\n\n• Natural Hazards: Quicksand, avalanches, rockslides, forest fires, and floods are all potential dangers\n\n• Food and Water: Without sufficient supplies, characters risk exhaustion from hunger and thirst",
          examples: [
            "In extreme cold, characters without cold weather gear must succeed on a DC 10 Constitution saving throw every hour or gain one level of exhaustion",
            "Characters traveling through a desert might need to make Constitution saves to avoid exhaustion from heat if they don't have enough water"
          ]
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy">Traps and Hazards</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Dungeons, ruins, and other adventuring locations are often protected by traps designed to harm or hinder intruders.
          </p>
          
          <h3>Detecting Traps</h3>
          <p>
            Finding traps typically requires active searching:
          </p>
          
          <ul>
            <li><strong>Passive Perception</strong>: May reveal obvious traps</li>
            <li><strong>Active Investigation</strong>: Describing specific areas to search and making Investigation checks</li>
            <li><strong>Magical Detection</strong>: Spells like Detect Magic can reveal magical traps</li>
          </ul>
          
          <div className="bg-primary/5 p-4 rounded-lg my-4">
            <h4 className="text-primary font-medium mb-2">Common Trap Elements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium">Triggers</h5>
                <ul className="list-disc pl-5 text-sm">
                  <li>Pressure plates</li>
                  <li>Tripwires</li>
                  <li>Contact with an object</li>
                  <li>Opening a door or container</li>
                  <li>Proximity sensors</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium">Effects</h5>
                <ul className="list-disc pl-5 text-sm">
                  <li>Darts, arrows, or spears</li>
                  <li>Pits (with or without spikes)</li>
                  <li>Falling blocks or ceilings</li>
                  <li>Poison gas or liquid</li>
                  <li>Magical effects</li>
                </ul>
              </div>
            </div>
          </div>
          
          <h3>Disabling Traps</h3>
          <p>
            Once detected, characters may attempt to disable a trap:
          </p>
          
          <ul>
            <li><strong>Dexterity (Thieves' Tools) Checks</strong>: Rogues excel at disarming mechanical traps</li>
            <li><strong>Arcana Checks</strong>: May be needed for magical traps</li>
            <li><strong>Creative Solutions</strong>: Wedging a door, blocking a pressure plate, etc.</li>
          </ul>
          
          <h3>Environmental Hazards</h3>
          <p>
            Beyond intentional traps, the environment itself can present dangers:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Natural Hazards</h4>
              <ul className="list-disc pl-5 text-sm">
                <li>Falling (1d6 damage per 10 feet, max 20d6)</li>
                <li>Suffocation (can hold breath for minutes equal to CON modifier + 1, minimum 30 seconds)</li>
                <li>Drowning (follows suffocation rules)</li>
                <li>Fire damage from flames</li>
                <li>Falling objects (damage varies by size and weight)</li>
              </ul>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Special Terrain</h4>
              <ul className="list-disc pl-5 text-sm">
                <li>Difficult terrain (costs extra movement)</li>
                <li>Slippery ice (DEX save to avoid falling prone)</li>
                <li>Thin ice (risk of breaking through)</li>
                <li>Deep snow (reduced visibility, difficult terrain)</li>
                <li>Quicksand (can trap and eventually suffocate)</li>
                <li>Lava (severe fire damage on contact)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DMBasicsContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Dungeon Master Basics</CardTitle>
          <CardDescription>
            Fundamentals of running a D&D game
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>The DM's Role</h3>
          <p>
            As the Dungeon Master, you are the primary storyteller and referee of the game. Your responsibilities include:
          </p>
          
          <ul>
            <li><strong>Creating the world</strong> and its inhabitants</li>
            <li><strong>Presenting challenges</strong> and adventures for the players</li>
            <li><strong>Controlling NPCs</strong> and monsters during interactions and combat</li>
            <li><strong>Adjudicating rules</strong> and making fair rulings when situations arise</li>
            <li><strong>Responding to player actions</strong> and adapting the story accordingly</li>
            <li><strong>Managing the pace</strong> of the game to keep everyone engaged</li>
          </ul>
          
          <div className="bg-primary/5 p-4 rounded-lg my-4">
            <h4 className="text-primary font-medium mb-2">DM Philosophy</h4>
            <p className="text-sm">
              Your goal is not to defeat the players or "win" against them—it's to facilitate an enjoyable, challenging experience where everyone (including you) has fun creating a memorable story together. The best DMs find a balance between challenging their players and letting them succeed in creative and satisfying ways.
            </p>
          </div>
          
          <h3>Preparing for Sessions</h3>
          <p>
            Good preparation helps sessions run smoothly:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div>
              <h4 className="font-medium text-primary">Adventure Prep</h4>
              <ul className="list-disc pl-5 text-sm">
                <li>Outline key locations, NPCs, and potential encounters</li>
                <li>Prepare combat encounters (select monsters, set up battlefields)</li>
                <li>Create or review maps of important areas</li>
                <li>Note important clues or information the players might discover</li>
                <li>Consider multiple paths the adventure might take based on player choices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-primary">Session Organization</h4>
              <ul className="list-disc pl-5 text-sm">
                <li>Have key rules references handy</li>
                <li>Prepare monster stat blocks or have the Monster Manual ready</li>
                <li>Have notes from previous sessions to maintain continuity</li>
                <li>Consider using initiative trackers, status markers, or other aids</li>
                <li>Have blank paper for sketching unexpected maps or noting new developments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <InlineTip
        tip={{
          id: "dm-running-game",
          title: "Running the Game",
          category: "dm_basics",
          content: "As a Dungeon Master, your role is to facilitate the game, present challenges, embody NPCs, and adjudicate rules. Here are key principles for running a successful game:\n\n1. Be fair and consistent with rules, but prioritize fun over rigid rule enforcement\n2. Prepare your adventure material but be flexible when players take unexpected actions\n3. Give players meaningful choices with real consequences\n4. Balance combat encounters appropriate to the party's level and composition\n5. Create vivid descriptions to help players visualize the world\n6. Listen to your players and adjust based on what they enjoy",
          examples: [
            "When players devise a creative solution that isn't covered by the rules, consider the approach and assign an appropriate DC for an ability check rather than saying 'no'.",
            "If players completely avoid a prepared encounter, repurpose those elements elsewhere rather than forcing them back on track."
          ],
          relatedRules: ["Encounter Design", "Awarding XP", "Treasure Tables"]
        }}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-fantasy">Building Compelling Adventures</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>Adventure Structure</h3>
          <p>
            A well-designed adventure typically includes these elements:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Beginning</h4>
              <ul className="list-disc pl-5 text-sm">
                <li><strong>Hook</strong>: The initial motivation or call to adventure</li>
                <li><strong>Setup</strong>: Important context and background information</li>
                <li><strong>Initial Challenge</strong>: An early obstacle to overcome</li>
              </ul>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">Middle</h4>
              <ul className="list-disc pl-5 text-sm">
                <li><strong>Rising Action</strong>: Escalating challenges and revelations</li>
                <li><strong>Complications</strong>: Unexpected twists or obstacles</li>
                <li><strong>Major Decision Points</strong>: Meaningful player choices</li>
              </ul>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <h4 className="font-medium text-primary">End</h4>
              <ul className="list-disc pl-5 text-sm">
                <li><strong>Climax</strong>: The ultimate challenge or confrontation</li>
                <li><strong>Resolution</strong>: Consequences of success or failure</li>
                <li><strong>Rewards</strong>: Treasure, information, reputation gains</li>
              </ul>
            </div>
          </div>
          
          <h3>Creating Balanced Encounters</h3>
          <p>
            Combat encounters should challenge the players without overwhelming them:
          </p>
          
          <div className="bg-secondary/10 p-4 rounded-lg my-4">
            <h4 className="font-medium text-primary mb-2">Challenge Rating</h4>
            <p className="text-sm">
              Challenge Rating (CR) is a general indicator of a monster's difficulty. A monster with a CR equal to a party's level should provide a moderate challenge for a group of four players. However, several factors affect encounter difficulty:
            </p>
            <ul className="list-disc pl-5 text-sm mt-2">
              <li><strong>Party Size</strong>: Larger parties can handle higher CRs</li>
              <li><strong>Monster Numbers</strong>: Multiple enemies are more challenging due to action economy</li>
              <li><strong>Environment</strong>: Terrain features can help or hinder either side</li>
              <li><strong>Resource Depletion</strong>: Later encounters are harder if the party has used up spells and abilities</li>
            </ul>
          </div>
          
          <h3>Rewarding Players</h3>
          <p>
            Appropriate rewards keep players motivated and help their characters grow:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div>
              <h4 className="font-medium text-primary">Experience Points</h4>
              <p className="text-sm">
                Award XP for:
              </p>
              <ul className="list-disc pl-5 text-sm">
                <li>Defeating or overcoming monsters</li>
                <li>Completing significant quest objectives</li>
                <li>Exceptional roleplaying</li>
                <li>Clever solutions to problems</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-primary">Treasure</h4>
              <ul className="list-disc pl-5 text-sm">
                <li><strong>Currency</strong>: Gold, silver, copper, etc.</li>
                <li><strong>Valuable Items</strong>: Gems, art objects, rare materials</li>
                <li><strong>Magical Items</strong>: Weapons, armor, wondrous items</li>
                <li><strong>Story Rewards</strong>: Land, titles, favors from powerful NPCs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FAQContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-fantasy">Frequently Asked Questions</CardTitle>
          <CardDescription>
            Common questions and answers for new D&D players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base font-medium">
                What do I need to start playing D&D?
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm">
                <p>
                  At minimum, you need:
                </p>
                <ul>
                  <li>Basic rules (available for free from the official D&D website)</li>
                  <li>Character sheet (also available for free)</li>
                  <li>Set of dice (d4, d6, d8, d10, d12, d20, and percentile die)</li>
                  <li>Friends to play with (one as DM, others as players)</li>
                </ul>
                <p>
                  For a more complete experience, consider getting:
                </p>
                <ul>
                  <li>Player's Handbook (core rulebook for players)</li>
                  <li>Dungeon Master's Guide (for the DM)</li>
                  <li>Monster Manual (for the DM)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-base font-medium">
                How many people do I need to play D&D?
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm">
                <p>
                  A typical D&D group consists of one Dungeon Master (DM) and 3-5 players. You can play with more or fewer people, but:
                </p>
                <ul>
                  <li>With fewer players (1-2), the DM may need to adjust encounters or provide NPC companions</li>
                  <li>With more players (6+), combat can become slow and some players might get less spotlight time</li>
                </ul>
                <p>
                  There are also two-player variants (one DM, one player) and solo adventures available.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-base font-medium">
                How long does a D&D game take?
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm">
                <p>
                  D&D sessions typically last 3-4 hours, but can be shorter or longer depending on your group's preferences. A complete adventure (or "module") usually takes multiple sessions to complete, and a campaign (a series of connected adventures) can span months or years of regular play.
                </p>
                <p>
                  Some groups prefer:
                </p>
                <ul>
                  <li><strong>Short sessions</strong> (1-2 hours) that occur more frequently</li>
                  <li><strong>Standard sessions</strong> (3-4 hours) held weekly or biweekly</li>
                  <li><strong>Long sessions</strong> (5+ hours) held less frequently</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-base font-medium">
                What if I don't know all the rules?
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm">
                <p>
                  Don't worry! Even experienced players and DMs don't know every rule. Here are some approaches:
                </p>
                <ul>
                  <li><strong>Learn the basics</strong>: Focus on understanding core concepts like ability checks, combat, and your character's abilities</li>
                  <li><strong>Ask questions</strong>: Other players and the DM can help clarify rules during play</li>
                  <li><strong>Keep references handy</strong>: Bookmark important rules sections for quick reference</li>
                  <li><strong>Make a ruling and move on</strong>: If a rule question is slowing down play, the DM can make a temporary ruling and look up the correct rule later</li>
                </ul>
                <p>
                  Remember, the goal is to have fun. Perfect rules knowledge isn't required!
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-base font-medium">
                How do I find a group to play with?
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm">
                <p>
                  There are several ways to find a D&D group:
                </p>
                <ul>
                  <li><strong>Friends and family</strong>: Introduce people you know to the game</li>
                  <li><strong>Local game stores</strong>: Many host D&D Adventurers League or other organized play</li>
                  <li><strong>Online communities</strong>: Websites like Roll20, Discord servers, and Reddit's r/lfg (looking for group)</li>
                  <li><strong>Social media</strong>: Facebook groups, Meetup.com, or other platforms with D&D communities</li>
                  <li><strong>Conventions</strong>: Gaming conventions often have one-shot D&D games</li>
                </ul>
                <p>
                  For online play, virtual tabletops like Roll20, Foundry VTT, or D&D Beyond with video chat can connect players across distances.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-base font-medium">
                What's the difference between editions of D&D?
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm">
                <p>
                  D&D has evolved through several editions, each with its own rules system:
                </p>
                <ul>
                  <li><strong>Fifth Edition (5e)</strong>: The current edition (since 2014). Simplified and streamlined rules that emphasize storytelling and character options</li>
                  <li><strong>Fourth Edition (4e)</strong>: Featured tactical combat with powers for all classes, similar to an MMO</li>
                  <li><strong>Third Edition/3.5</strong>: Complex and detail-oriented rules with extensive customization</li>
                  <li><strong>Advanced D&D (AD&D)/Second Edition</strong>: More structured than original D&D but still relatively rules-light</li>
                  <li><strong>Original D&D</strong>: The first versions of the game, more open to interpretation</li>
                </ul>
                <p>
                  Fifth Edition is recommended for new players due to its accessibility and current support.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger className="text-base font-medium">
                What if I'm nervous about roleplaying?
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm">
                <p>
                  Roleplaying can be intimidating at first, but remember:
                </p>
                <ul>
                  <li><strong>Start small</strong>: You don't need to use a special voice or act dramatically</li>
                  <li><strong>Third-person is fine</strong>: "My character asks about the reward" works just as well as speaking in character</li>
                  <li><strong>Everyone feels awkward at first</strong>: Even experienced players started somewhere</li>
                  <li><strong>Find your comfort level</strong>: Some players focus more on combat and problem-solving than dramatic roleplaying</li>
                </ul>
                <p>
                  Over time, you'll likely become more comfortable with roleplaying as you get to know your character and fellow players better.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8">
              <AccordionTrigger className="text-base font-medium">
                How do I create a good character?
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm">
                <p>
                  A "good" character can mean different things:
                </p>
                <ul>
                  <li><strong>Mechanically effective</strong>: Align ability scores with class needs (e.g., high STR for Fighters, high INT for Wizards)</li>
                  <li><strong>Interesting to play</strong>: Give your character motivations, flaws, and connections to the world</li>
                  <li><strong>Group-friendly</strong>: Create a character willing to work with others and participate in adventures</li>
                </ul>
                <p>
                  For beginners, consider starting with:
                </p>
                <ul>
                  <li><strong>Fighter</strong>: Straightforward combat abilities</li>
                  <li><strong>Cleric</strong>: Mix of combat and supportive magic</li>
                  <li><strong>Rogue</strong>: Skill expertise and sneaky tactics</li>
                </ul>
                <p>
                  These classes are more forgiving for new players while still being effective.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}