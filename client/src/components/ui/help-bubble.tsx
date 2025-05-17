import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpBubbleProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}

export function HelpBubble({ 
  content, 
  side = 'top', 
  align = 'center',
  sideOffset = 4,
  className = '' 
}: HelpBubbleProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={`inline-flex cursor-help ${className}`}>
            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          sideOffset={sideOffset}
          className="max-w-[300px] p-4 text-sm"
        >
          {typeof content === 'string' ? (
            <p>{content}</p>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DmActionHelp({ 
  title, 
  description, 
  tips = [], 
  side = 'right',
  align = 'center',
  sideOffset = 8,
  className = ''
}: {
  title: string;
  description: string;
  tips?: string[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}) {
  return (
    <HelpBubble
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={className}
      content={
        <div className="space-y-2">
          <h4 className="font-semibold text-base">{title}</h4>
          <p>{description}</p>
          {tips.length > 0 && (
            <div className="mt-2">
              <p className="font-medium mb-1">Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                {tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
    />
  );
}