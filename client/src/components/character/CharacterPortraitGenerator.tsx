import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Character } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CharacterPortraitGeneratorProps {
  character: Character;
}

export default function CharacterPortraitGenerator({
  character,
}: CharacterPortraitGeneratorProps) {
  const [activeTab, setActiveTab] = useState<string>("portrait");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Portrait generation mutation
  const portraitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/characters/${character.id}/generate-portrait`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/characters"],
      });
      toast({
        title: "Portrait generated!",
        description: "Your character portrait has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Portrait generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Background story generation mutation
  const backgroundMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/characters/${character.id}/generate-background`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/characters"],
      });
      toast({
        title: "Background story generated!",
        description: "Your character's background story has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Background generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="portrait">Portrait</TabsTrigger>
        <TabsTrigger value="background">Background Story</TabsTrigger>
      </TabsList>

      <TabsContent value="portrait" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            {character.portraitUrl ? (
              <div className="space-y-4">
                <div className="aspect-square max-w-md mx-auto border rounded-md overflow-hidden bg-card">
                  <img
                    src={character.portraitUrl}
                    alt={`${character.name} portrait`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => portraitMutation.mutate()}
                          disabled={portraitMutation.isPending}
                        >
                          {portraitMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Regenerate Portrait
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate a new portrait for your character</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-square max-w-md mx-auto border rounded-md flex items-center justify-center bg-muted/50">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Your character doesn't have a portrait yet.
                  </p>
                  <Button
                    onClick={() => portraitMutation.mutate()}
                    disabled={portraitMutation.isPending}
                    className="mx-auto"
                  >
                    {portraitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generate Portrait
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="background" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            {character.backgroundStory ? (
              <div className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  {character.backgroundStory.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                <div className="flex justify-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => backgroundMutation.mutate()}
                          disabled={backgroundMutation.isPending}
                        >
                          {backgroundMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Regenerate Background
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate a new background story</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-40 border rounded-md flex items-center justify-center bg-muted/50">
                  <p className="text-muted-foreground text-center px-4">
                    No background story available yet.
                  </p>
                </div>
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Add depth to your character with an AI-generated background story.
                  </p>
                  <Button
                    onClick={() => backgroundMutation.mutate()}
                    disabled={backgroundMutation.isPending}
                    className="mx-auto"
                  >
                    {backgroundMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Background Story
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}