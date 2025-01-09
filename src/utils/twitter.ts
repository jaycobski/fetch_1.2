import { supabase } from '@/lib/supabase';
import { PerplexityClient } from '@/lib/perplexity';
import { toast } from 'sonner';

export interface TwitterPost {
  id: string;
  title: string;
  content: string;
  author: string;
  url: string;
  created_at: string;
  metadata: Record<string, any>;
}

export const fetchTwitterBookmarks = async (accessToken: string): Promise<TwitterPost[]> => {
  try {
    const response = await fetch('https://api.twitter.com/2/bookmarks', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Twitter data to common post format
    const posts = data.data.map((tweet: any) => ({
      id: tweet.id,
      title: tweet.text.split('\n')[0], // First line as title
      content: tweet.text,
      author: tweet.author_id,
      url: `https://twitter.com/user/status/${tweet.id}`,
      created_at: tweet.created_at,
      metadata: {
        retweet_count: tweet.public_metrics?.retweet_count,
        reply_count: tweet.public_metrics?.reply_count,
        like_count: tweet.public_metrics?.like_count,
        quote_count: tweet.public_metrics?.quote_count
      }
    }));

    // Store posts in database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // ... rest of implementation similar to reddit.ts
    
    return posts;
  } catch (error) {
    console.error('Error fetching Twitter bookmarks:', error);
    throw error;
  }
};