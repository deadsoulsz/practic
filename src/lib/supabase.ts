import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          company: string | null
          position: string | null
          linkedin_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          position?: string | null
          linkedin_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          position?: string | null
          linkedin_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: 'conference' | 'seminar' | 'workshop' | 'webinar' | 'networking'
          format: 'online' | 'offline' | 'hybrid'
          date: string
          end_date: string | null
          location: string | null
          max_participants: number | null
          image_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_type: 'conference' | 'seminar' | 'workshop' | 'webinar' | 'networking'
          format: 'online' | 'offline' | 'hybrid'
          date: string
          end_date?: string | null
          location?: string | null
          max_participants?: number | null
          image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_type?: 'conference' | 'seminar' | 'workshop' | 'webinar' | 'networking'
          format?: 'online' | 'offline' | 'hybrid'
          date?: string
          end_date?: string | null
          location?: string | null
          max_participants?: number | null
          image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          registered_at: string
          status: 'registered' | 'attended' | 'cancelled'
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          registered_at?: string
          status?: 'registered' | 'attended' | 'cancelled'
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          registered_at?: string
          status?: 'registered' | 'attended' | 'cancelled'
        }
      }
      network_connections: {
        Row: {
          id: string
          requester_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          event_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}
