// Simple fallback functions to prevent Supabase errors
// These return default/empty values to keep the app working

export const isSupabaseConfigured = () => false;

export const supabase = {
  from: () => ({
    select: () => ({
      single: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    upsert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
  channel: () => ({
    on: () => ({
      subscribe: () => Promise.resolve(),
    }),
  }),
  removeChannel: () => {},
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
};

console.log("🚫 Using Supabase fallback - all Supabase calls disabled");
