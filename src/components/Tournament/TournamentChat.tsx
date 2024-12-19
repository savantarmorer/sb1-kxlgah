import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  tournament_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user: {
    username: string;
    avatar_url: string;
  };
}

interface TournamentChatProps {
  tournamentId: string;
}

export function TournamentChat({ tournamentId }: TournamentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    let subscription: any;

    async function setupChat() {
      try {
        // Load initial messages
        const { data, error } = await supabase
          .from('tournament_chat')
          .select(`
            *,
            user:user_id (
              username,
              avatar_url
            )
          `)
          .eq('tournament_id', tournamentId)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;
        setMessages(data);

        // Subscribe to new messages
        subscription = supabase
          .channel('tournament_chat')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'tournament_chat',
              filter: `tournament_id=eq.${tournamentId}`
            },
            (payload) => {
              setMessages((prev) => [...prev, payload.new as ChatMessage]);
              scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error setting up chat:', error);
      }
    }

    setupChat();

    return () => {
      subscription?.unsubscribe();
    };
  }, [tournamentId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tournament_chat')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[400px] border rounded-lg">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Tournament Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.user_id === user?.id ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar
                src={msg.user.avatar_url}
                alt={msg.user.username}
                className="w-8 h-8"
              />
              <div
                className={`flex flex-col ${
                  msg.user_id === user?.id ? 'items-end' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {msg.user.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div
                  className={`mt-1 px-3 py-2 rounded-lg ${
                    msg.user_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={loading || !user}
          />
          <Button type="submit" disabled={loading || !user}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
} 