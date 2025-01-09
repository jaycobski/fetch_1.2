import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { SummaryCategory } from '@/types/summary';
import { toast } from 'react-hot-toast';

export function DigestList() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Record<string, SummaryCategory[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummaries() {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('summaries')
          .select('*, fetched_posts!inner(*)')
          .eq('user_id', user.id) 
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (data) {
          // Create a Map to track latest summary per post
          const latestSummaries = new Map();
          
          // Only keep the latest summary for each post
          data.forEach(summary => {
            const existingSummary = latestSummaries.get(summary.post_id);
            if (!existingSummary || new Date(summary.created_at) > new Date(existingSummary.created_at)) {
              latestSummaries.set(summary.post_id, summary);
            }
          });

          // Group by category using the deduplicated summaries
          const grouped = Array.from(latestSummaries.values()).reduce((acc, curr) => {
            const category = curr.category;
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push({
              title: curr.fetched_posts.title,
              summary: curr.content,
              created_at: curr.created_at,
              source: curr.fetched_posts.source,
              url: curr.fetched_posts.url
            });
            return acc;
          }, {} as Record<string, any[]>);

          setSummaries(grouped);
        }
      } catch (error) {
        console.error('Error loading summaries:', error);
        toast.error('Failed to load summaries');
      } finally {
        setLoading(false);
      }
    }

    loadSummaries();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 h-32" />
      ))}
    </div>;
  }

  const categories = Object.keys(summaries);

  if (categories.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No digests yet. Enable AI summaries for your posts to get started!</p>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">All Categories</TabsTrigger>
        {categories.map(category => (
          <TabsTrigger key={category} value={category}>
            {category}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="all">
        <ScrollArea className="h-[600px] rounded-md border">
          <div className="space-y-4 p-4">
            {categories.map(category => (
              <div key={category} className="space-y-4">
                <h3 className="font-semibold text-lg">{category}</h3>
                {summaries[category].map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge>{item.source}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.summary}</p>
                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        Read original
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      {categories.map(category => (
        <TabsContent key={category} value={category}>
          <ScrollArea className="h-[600px] rounded-md border">
            <div className="space-y-4 p-4">
              {summaries[category].map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge>{item.source}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.summary}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Created on {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        Read original
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}