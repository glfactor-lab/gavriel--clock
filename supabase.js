// Supabase is optional. The app works with localStorage until these values are configured.
// 1. Create a Supabase project.
// 2. Add the schema from supabase-schema.sql.
// 3. Replace the values below and include the Supabase browser client from a CDN or build step.
window.WORK_CLOCK_SUPABASE_CONFIG = {
  url: "",
  anonKey: "",
};

window.workClockSupabase = {
  async syncShifts(records) {
    const config = window.WORK_CLOCK_SUPABASE_CONFIG;
    if (!config.url || !config.anonKey || !window.supabase) return;

    const client = window.supabase.createClient(config.url, config.anonKey);
    const { data } = await client.auth.getUser();
    if (!data.user) return;

    await client.from("shifts").upsert(
      records.map((record) => ({
        id: record.id,
        user_id: data.user.id,
        clock_in: record.clockIn,
        clock_out: record.clockOut,
        notes: record.notes,
      })),
    );
  },
};
