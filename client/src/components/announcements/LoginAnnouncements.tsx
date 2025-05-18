import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Bell } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  status: string;
}

export default function LoginAnnouncements() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Only fetch announcements if user is logged in
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  useEffect(() => {
    // Only show announcements when user is logged in
    if (user && announcements && announcements.length > 0) {
      // Display only the 3 most recent announcements
      const recentAnnouncements = announcements
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      // Show them one after another with a slight delay
      recentAnnouncements.forEach((announcement, index) => {
        setTimeout(() => {
          toast({
            title: announcement.title,
            description: announcement.content,
            className: "announcement-toast",
            duration: 7000 + (index * 1000), // Longer duration for each announcement
            variant: announcement.type === 'important' ? 'destructive' : 'default',
          });
        }, index * 1500); // Delay each announcement by 1.5 seconds
      });
    }
  }, [user, announcements, toast]);
  
  // This is just a hook component, no UI
  return null;
}