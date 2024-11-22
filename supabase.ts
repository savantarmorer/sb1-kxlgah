// supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvmjnkdgiuwutobtqprh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bWpua2RnaXV3dXRvYnRxcHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5NzE2MDAsImV4cCI6MjAyNDU0NzYwMH0.JqKsN-RXFMrC1rqH3a7TyQV9kHDSk-L-VBBC4QdXrR0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)