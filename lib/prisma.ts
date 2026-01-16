// Supabase database adapter
import { supabaseDb } from './supabase-db'

// Export as prisma for compatibility with existing code
export const prisma = supabaseDb as any
