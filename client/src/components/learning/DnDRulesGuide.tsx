import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, HelpCircle, Info, Maximize2, Minimize2 } from "lucide-react";

// Type definitions
export type RuleCategory = 
  | "abilities" 
  | "skills" 
  | "combat" 
  | "spellcasting" 
  | "equipment" 
  | "character_creation" 
  | "roleplaying"
  | "dm_basics";

export interface RuleTip {
  id: string;
  title: string;
  category: RuleCategory;
  content: string;
  examples?: string[];
  relatedRules?: string[];
}

// Props for the different component variants
interface InlineTipProps {
  tip: RuleTip;
  compact?: boolean;
}

interface ContextualHelpProps {
  category: RuleCategory;
  title: string;
  children: React.ReactNode;
}

interface RulesSidebarProps {
  category?: RuleCategory;
}

// Mock data store - would be replaced with actual API calls in production
const ruleTips: RuleTip[] = [
  {
    id: "ability-checks",
    title: "Ability Checks",
    category: "abilities",
    content: "Ability checks test a character's or monster's innate talent and training in an effort to overcome a challenge. The DM calls for an ability check when a character or monster attempts an action that has a chance of failure. When the outcome is uncertain, the dice determine the results.\n\nTo make an ability check, roll a d20 and add the relevant ability modifier. For example, you would use your Strength modifier for a Strength check.",
    examples: [
      "Forcing open a stuck door (Strength)",
      "Navigating a treacherous mountain path (Dexterity)",
      "Withstanding extreme cold (Constitution)",
      "Recalling lore about a legendary artifact (Intelligence)",
      "Spotting a hidden creature (Wisdom)",
      "Convincing a guard to let you pass (Charisma)"
    ],
    relatedRules: ["Difficulty Class (DC)", "Advantage and Disadvantage"]
  },
  {
    id: "attack-rolls",
    title: "Attack Rolls",
    category: "combat",
    content: "When you make an attack, your attack roll determines whether the attack hits or misses. To make an attack roll, roll a d20 and add the appropriate modifiers. If the total equals or exceeds the target's Armor Class (AC), the attack hits.\n\nThe modifiers to the roll depend on what type of attack you're making. For melee weapon attacks, you use your Strength modifier. For ranged weapon attacks, you use your Dexterity modifier. For spell attacks, you use your spellcasting ability modifier.",
    examples: [
      "A fighter with +3 Strength swings a longsword at an enemy with AC 15. They roll a 13 on the d20, adding their +3 Strength modifier for a total of 16, which hits.",
      "A ranger with +4 Dexterity fires an arrow at a flying creature with AC 17. They roll an 11, adding their +4 Dexterity modifier for a total of 15, which misses."
    ],
    relatedRules: ["Critical Hits", "Advantage and Disadvantage", "Cover"]
  },
  {
    id: "spell-casting",
    title: "Spellcasting Basics",
    category: "spellcasting",
    content: "Spellcasting is the act of using magical energy to create varied effects. Each spellcasting class accesses magic in a different way.\n\nA spell has the following characteristics: level, casting time, range, components, duration, and a specific effect. To cast a spell, you must expend a spell slot of the spell's level or higher. Some spells can be cast at higher levels for greater effect.\n\nSpellcasting ability varies by class: Intelligence (Wizard), Wisdom (Cleric, Druid), or Charisma (Bard, Sorcerer, Warlock).",
    examples: [
      "A 3rd-level wizard with 16 Intelligence (+3 modifier) casts Magic Missile. The spell automatically hits its targets for 3 * (1d4+1) force damage.",
      "A 5th-level cleric with 18 Wisdom (+4 modifier) casts Cure Wounds using a 3rd-level spell slot. The spell heals 3d8 + 4 hit points."
    ],
    relatedRules: ["Spell Components", "Concentration", "Spell Saving Throws", "Spell Attack Rolls"]
  },
  {
    id: "character-creation",
    title: "Character Creation",
    category: "character_creation",
    content: "Creating a character involves several key steps:\n\n1. Choose a race (which provides traits, ability score increases, and other features)\n2. Choose a class (which determines your character's abilities, skills, and advancement)\n3. Determine ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma)\n4. Choose a background (which provides skill proficiencies, tools, equipment, and character hooks)\n5. Select equipment based on your class and background\n6. Finalize character details (name, alignment, physical appearance, personality traits, etc.)",
    examples: [
      "A player creates a Hill Dwarf Cleric with the Acolyte background, focusing on Wisdom and Constitution for ability scores.",
      "A player builds a High Elf Wizard with the Sage background, prioritizing Intelligence and Dexterity ability scores."
    ],
    relatedRules: ["Ability Scores", "Proficiency Bonus", "Backgrounds", "Alignment"]
  },
  {
    id: "dm-running-game",
    title: "Running the Game",
    category: "dm_basics",
    content: "As a Dungeon Master, your role is to facilitate the game, present challenges, embody NPCs, and adjudicate rules. Here are key principles for running a successful game:\n\n1. Be fair and consistent with rules, but prioritize fun over rigid rule enforcement\n2. Prepare your adventure material but be flexible when players take unexpected actions\n3. Give players meaningful choices with real consequences\n4. Balance combat encounters appropriate to the party's level and composition\n5. Create vivid descriptions to help players visualize the world\n6. Listen to your players and adjust based on what they enjoy",
    examples: [
      "When players devise a creative solution that isn't covered by the rules, consider the approach and assign an appropriate DC for an ability check rather than saying 'no'.",
      "If players completely avoid a prepared encounter, repurpose those elements elsewhere rather than forcing them back on track."
    ],
    relatedRules: ["Encounter Design", "Awarding XP", "Treasure Tables"]
  }
];

// Utility function to find a specific rule tip
function findTip(id: string): RuleTip | undefined {
  return ruleTips.find(tip => tip.id === id);
}

// Utility function to get rule tips by category
function getTipsByCategory(category: RuleCategory): RuleTip[] {
  return ruleTips.filter(tip => tip.category === category);
}

// Inline tip component - can be used anywhere in the UI
export function InlineTip({ tip, compact = false }: InlineTipProps) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <Card className="my-4 border-primary/20 bg-secondary/5">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-primary text-lg">
            <BookOpen className="mr-2 h-5 w-5" />
            {tip.title}
          </CardTitle>
          {compact && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <CardDescription>
          <Badge variant="outline" className="bg-primary/10">
            {tip.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </CardDescription>
      </CardHeader>
      {expanded && (
        <>
          <CardContent>
            <div className="space-y-2">
              {tip.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-sm">{paragraph}</p>
              ))}
              
              {tip.examples && tip.examples.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-sm">Examples:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {tip.examples.map((example, index) => (
                      <li key={index} className="text-sm">{example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
          {tip.relatedRules && tip.relatedRules.length > 0 && (
            <CardFooter className="pt-0">
              <div className="w-full">
                <p className="text-sm font-medium mb-1">Related Rules:</p>
                <div className="flex flex-wrap gap-1">
                  {tip.relatedRules.map((rule) => (
                    <Badge key={rule} variant="secondary" className="text-xs">
                      {rule}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardFooter>
          )}
        </>
      )}
    </Card>
  );
}

// Contextual help component - used for in-context help with tooltips
export function ContextualHelp({ category, title, children }: ContextualHelpProps) {
  const categoryTips = getTipsByCategory(category);
  
  return (
    <Dialog>
      <div className="inline-flex items-center">
        {children}
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-primary">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-fantasy">{title}</DialogTitle>
          <DialogDescription>
            Learn about this D&D concept and how it works in gameplay
          </DialogDescription>
        </DialogHeader>
        
        <Accordion type="single" collapsible className="w-full">
          {categoryTips.map((tip) => (
            <AccordionItem key={tip.id} value={tip.id}>
              <AccordionTrigger className="text-base font-medium">
                {tip.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-1">
                  {tip.content.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                  
                  {tip.examples && tip.examples.length > 0 && (
                    <div className="mt-3 pt-2 border-t">
                      <p className="font-medium">Examples:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {tip.examples.map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <DialogFooter>
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Open D&D Rules Guide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Rules sidebar component - used as a floating help panel
export function RulesSidebar({ category }: RulesSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<RuleCategory>(category || "abilities");
  const [isMinimized, setIsMinimized] = useState(false);
  
  const categoryOptions: {value: RuleCategory, label: string}[] = [
    { value: "abilities", label: "Abilities & Skills" },
    { value: "combat", label: "Combat" },
    { value: "spellcasting", label: "Spellcasting" },
    { value: "equipment", label: "Equipment" },
    { value: "character_creation", label: "Character Creation" },
    { value: "roleplaying", label: "Roleplaying" },
    { value: "dm_basics", label: "DM Basics" }
  ];
  
  return (
    <Card className={`fixed right-4 bottom-4 w-80 ${isMinimized ? 'h-12' : 'max-h-[80vh]'} shadow-lg transition-all duration-200 overflow-hidden`}>
      <CardHeader className="py-3 px-4 flex-row justify-between items-center">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-primary" />
          <CardTitle className="text-base font-medium">D&D Quick Reference</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsMinimized(!isMinimized)}
          className="h-8 w-8 p-0"
        >
          {isMinimized ? (
            <Maximize2 className="h-4 w-4" />
          ) : (
            <Minimize2 className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      
      {!isMinimized && (
        <>
          <div className="px-4 pb-2">
            <Tabs defaultValue={activeCategory} onValueChange={(val) => setActiveCategory(val as RuleCategory)}>
              <TabsList className="w-full h-auto flex flex-wrap">
                {categoryOptions.map((cat) => (
                  <TabsTrigger 
                    key={cat.value} 
                    value={cat.value}
                    className="text-xs py-1 flex-grow"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {categoryOptions.map((cat) => (
                <TabsContent key={cat.value} value={cat.value} className="max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4 py-2">
                    {getTipsByCategory(cat.value).map((tip) => (
                      <div key={tip.id} className="border-b border-primary/10 pb-4 last:border-0">
                        <h3 className="font-medium text-base mb-2">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tip.content.substring(0, 150)}...
                        </p>
                        <Button variant="link" className="text-xs p-0 h-auto mt-1">
                          Read more
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          <CardFooter className="px-4 py-3 bg-muted/50">
            <Button variant="outline" size="sm" className="w-full">
              <BookOpen className="mr-2 h-4 w-4" />
              Open Full D&D Guide
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

// Popup rule explanation component - used for on-demand help
export function RulePopup({ ruleId, trigger }: { ruleId: string, trigger: React.ReactNode }) {
  const tip = findTip(ruleId);
  
  if (!tip) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rule Not Found</DialogTitle>
            <DialogDescription>
              Sorry, we couldn't find information about this rule.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-fantasy text-xl">{tip.title}</DialogTitle>
          <DialogDescription>
            <Badge variant="outline" className="mt-1 bg-primary/10">
              {tip.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {tip.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          
          {tip.examples && tip.examples.length > 0 && (
            <div className="bg-secondary/10 p-3 rounded-md mt-4">
              <p className="font-medium flex items-center">
                <Info className="h-4 w-4 mr-2 text-primary" />
                Examples
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                {tip.examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {tip.relatedRules && tip.relatedRules.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-sm font-medium mb-2">Related Rules:</p>
            <div className="flex flex-wrap gap-2">
              {tip.relatedRules.map((rule) => (
                <Badge key={rule} className="bg-primary/20">
                  {rule}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <DialogFooter className="gap-2">
          <Button variant="outline">Close</Button>
          <Button>
            <BookOpen className="mr-2 h-4 w-4" />
            Open Full Guide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}