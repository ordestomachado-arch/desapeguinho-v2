import { createClient } from '@supabase/supabase-js'

// A URL precisa terminar estritamente em .co (sem a barra e o resto do texto no final)
const supabaseUrl = 'https://dgojsroegfulootuhxiu.supabase.co'

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnb2pzcm9lZ2Z1bG9vdHVoeGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg4MDcsImV4cCI6MjA5NTMyNDgwN30.l3mpBAQMgszoWJjA7EurqmuhKG1oD8njMiQJqnwgYlw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
