import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { Character } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CharacterPortraitGeneratorProps {
  character: Character;
  onSuccess?: (updatedCharacter: Character) => void;
}

export function CharacterPortraitGenerator({ 
  character, 
  onSuccess 
}: CharacterPortraitGeneratorProps) {
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generatePortrait = async () => {
    setIsGeneratingPortrait(true);
    
    try {
      const response = await apiRequest(
        "POST", 
        `/api/characters/${character.id}/generate-portrait`
      );

      const data = await response.json();
      
      // Invalidate character query to update with new portrait URL
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${character.id}`] });
      
      if (onSuccess && data.character) {
        onSuccess(data.character);
      }
      
      toast({
        title: "Portrait generated!",
        description: "Your character portrait has been created successfully.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Portrait generation failed",
        description: error.message || "Could not generate portrait. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const generateBackground = async () => {
    setIsGeneratingBackground(true);
    
    try {
      const response = await apiRequest(
        "POST", 
        `/api/characters/${character.id}/generate-background`
      );

      const data = await response.json();
      
      // Invalidate character query to update with new background story
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${character.id}`] });
      
      if (onSuccess && data.character) {
        onSuccess(data.character);
      }
      
      toast({
        title: "Background story generated!",
        description: "Your character's background story has been created successfully.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Background generation failed",
        description: error.message || "Could not generate background. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Character Visualization</CardTitle>
        <CardDescription>
          Generate a unique portrait and backstory for your character using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          {character.portraitUrl ? (
            <div className="w-full md:w-1/2">
              <div className="relative aspect-square overflow-hidden rounded-md border">
                <img 
                  src={character.portraitUrl} 
                  alt={`${character.name} portrait`} 
                  className="object-cover w-full h-full"
                />
              </div>
              <Button 
                variant="outline" 
                className="mt-2 w-full"
                onClick={generatePortrait}
                disabled={isGeneratingPortrait}
              >
                {isGeneratingPortrait ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>Regenerate Portrait</>
                )}
              </Button>
            </div>
          ) : (
            <div className="w-full md:w-1/2">
              <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-muted/30">
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">
                    No portrait generated yet
                  </p>
                  <Button 
                    onClick={generatePortrait} 
                    disabled={isGeneratingPortrait}
                    className="mt-2"
                  >
                    {isGeneratingPortrait ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Portrait
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="w-full md:w-1/2">
            {character.backgroundStory ? (
              <div className="h-64 overflow-auto border rounded-md p-4 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">{character.backgroundStory}</p>
                <Button 
                  variant="outline" 
                  className="mt-2 w-full"
                  onClick={generateBackground}
                  disabled={isGeneratingBackground}
                >
                  {isGeneratingBackground ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>Regenerate Background</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-muted/30">
                <div className="text-center p-4">
                  <p className="text-sm text-muted-foreground">
                    No background story generated yet
                  </p>
                  <Button 
                    onClick={generateBackground} 
                    disabled={isGeneratingBackground}
                    className="mt-2"
                  >
                    {isGeneratingBackground ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Background
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}