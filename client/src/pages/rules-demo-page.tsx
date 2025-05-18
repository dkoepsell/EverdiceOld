import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RulesReference, RulesInfoBubble } from '@/components/ui/rules-reference';
import { Dice1, Shield, Swords, Droplet, Sparkles, BookOpen } from 'lucide-react';

export default function RulesDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">D&D Rules Reference System</h1>
        <p className="text-muted-foreground mt-2">Hover over underlined terms to learn D&D mechanics</p>
      </div>

      <Tabs defaultValue="combat" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="combat" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            <span>Combat</span>
          </TabsTrigger>
          <TabsTrigger value="spellcasting" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Spellcasting</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Dice1 className="h-4 w-4" />
            <span>Actions</span>
          </TabsTrigger>
          <TabsTrigger value="conditions" className="flex items-center gap-2">
            <Droplet className="h-4 w-4" />
            <span>Conditions</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>General Rules</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="combat" className="space-y-6">
          <h2 className="text-2xl font-bold">Combat Reference</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Making Attacks</CardTitle>
              <CardDescription>How to determine if your attacks hit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                When attacking an enemy, you need to make an <RulesReference term="attack-roll">attack roll</RulesReference> by 
                rolling a d20 and adding your attack bonus. If your result equals or exceeds the target's AC, 
                your attack hits.
              </p>
              
              <p>
                If you roll a natural 20 on your attack roll, you score a <RulesReference term="critical-hit">critical hit</RulesReference>,
                which causes you to roll all damage dice twice.
              </p>
              
              <p>
                When an enemy leaves your reach without taking the Disengage action, you can use your 
                <RulesReference term="reaction">reaction</RulesReference> to make an 
                <RulesReference term="opportunity-attack">opportunity attack</RulesReference>.
              </p>
              
              <div className="bg-muted p-3 rounded-lg mt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Important Combat Tips</span>
                </h4>
                <ul className="text-sm mt-2 space-y-2">
                  <li>
                    Attacking from <RulesReference term="flanking">flanking</RulesReference> positions can give you
                    <RulesReference term="advantage">advantage</RulesReference> on attack rolls (optional rule)
                  </li>
                  <li>
                    If you fall to 0 hit points, you must make <RulesReference term="death-saving-throw">death saving throws</RulesReference> on
                    your turns
                  </li>
                  <li>
                    <RulesReference term="difficult-terrain">Difficult terrain</RulesReference> forces you to spend extra movement
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="spellcasting" className="space-y-6">
          <h2 className="text-2xl font-bold">Spellcasting Reference</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Casting Spells</CardTitle>
              <CardDescription>Understanding spellcasting mechanics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                When casting spells, you'll use <RulesReference term="spell-slot">spell slots</RulesReference> of the 
                appropriate level. Once used, these slots are expended until you complete a 
                <RulesReference term="long-rest">long rest</RulesReference>.
              </p>
              
              <p>
                <RulesReference term="cantrip">Cantrips</RulesReference> are level 0 spells that don't require spell slots and 
                can be cast as many times as you want.
              </p>
              
              <p>
                Some spells require <RulesReference term="concentration">concentration</RulesReference> to maintain their effects.
                You can only concentrate on one spell at a time, and taking damage might break your concentration.
              </p>
              
              <p>
                Spells with the <RulesReference term="ritual-casting">ritual</RulesReference> tag can be cast without expending
                a spell slot if you spend an extra 10 minutes casting them.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-6">
          <h2 className="text-2xl font-bold">Actions Reference</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Action Economy</CardTitle>
              <CardDescription>What you can do on your turn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                On your turn, you can take one action, move up to your speed, and possibly use a
                <RulesReference term="bonus-action">bonus action</RulesReference> if you have an ability that grants one.
              </p>
              
              <p>
                You also have one <RulesReference term="reaction">reaction</RulesReference> per round that you can use when triggered,
                even when it's not your turn.
              </p>
              
              <div className="bg-muted p-3 rounded-lg mt-4">
                <h4 className="text-sm font-semibold">Common Actions in Combat:</h4>
                <ul className="text-sm mt-2 space-y-1">
                  <li>Attack: Make an attack with a weapon</li>
                  <li>Cast a Spell: Cast a spell with a casting time of 1 action</li>
                  <li>Dash: Double your movement speed for the turn</li>
                  <li>Disengage: Prevent opportunity attacks when you move</li>
                  <li>Dodge: Attacks against you have disadvantage</li>
                  <li>Help: Give an ally advantage on their next ability check or attack</li>
                  <li>Hide: Make a Dexterity (Stealth) check to hide</li>
                  <li>Ready: Prepare an action to trigger later</li>
                  <li>Use an Object: Interact with a second object in the environment</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conditions" className="space-y-6">
          <h2 className="text-2xl font-bold">Conditions Reference</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Status Conditions</CardTitle>
              <CardDescription>Common conditions that affect creatures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Conditions alter a creature's capabilities in a variety of ways. Here are some common conditions:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold"><RulesReference term="prone">Prone</RulesReference></h4>
                  <p className="text-sm">A prone creature's only movement option is to crawl, and it has disadvantage on attack rolls.</p>
                </div>
                
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold"><RulesReference term="grappled">Grappled</RulesReference></h4>
                  <p className="text-sm">A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed.</p>
                </div>
                
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold">Blinded</h4>
                  <p className="text-sm">A blinded creature can't see and automatically fails any checks that require sight.</p>
                </div>
                
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold">Paralyzed</h4>
                  <p className="text-sm">A paralyzed creature is incapacitated and can't move or speak. It automatically fails Strength and Dexterity saves.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general" className="space-y-6">
          <h2 className="text-2xl font-bold">General Rules Reference</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Core Mechanics</CardTitle>
              <CardDescription>The fundamental rules of D&D</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                When you attempt to do something with an uncertain outcome, you'll typically make an
                <RulesReference term="ability-check">ability check</RulesReference> by rolling a d20 and adding your ability modifier.
              </p>
              
              <p>
                Your <RulesReference term="proficiency-bonus">proficiency bonus</RulesReference> applies to skills you're proficient with,
                saving throws for abilities you're proficient in, and attack rolls with weapons you're proficient with.
              </p>
              
              <p>
                When subjected to harmful effects, you'll make a <RulesReference term="saving-throw">saving throw</RulesReference> to
                avoid or reduce the effect.
              </p>
              
              <p>
                A <RulesReference term="short-rest">short rest</RulesReference> (1+ hours) lets you spend Hit Dice to recover hit points,
                while a <RulesReference term="long-rest">long rest</RulesReference> (8+ hours) restores hit points and some abilities.
              </p>
              
              <p>
                Some magic items require <RulesReference term="attunement">attunement</RulesReference> before you can use their magical properties,
                and you can be attuned to no more than three items at a time.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Use Rules References in Your Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Throughout the Everdice application, you'll find terms with dotted underlines like the examples above.
            Hover over these terms to see quick explanations of important D&D rules and mechanics.
          </p>
          <p className="mt-4">
            You'll also see info icons <RulesInfoBubble term="advantage" /> next to various game elements that
            provide additional context about how specific D&D mechanics work.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Return to Game</Button>
        </CardFooter>
      </Card>
    </div>
  );
}