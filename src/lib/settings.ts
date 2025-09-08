import { supabase } from "./supabase";

export type SettingsMap = Record<string, string>;

export async function fetchSettingsMap(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) {
    return {};
  }
  const map: SettingsMap = {};
  for (const row of data || []) {
    map[row.key] = row.value ?? "";
  }
  return map;
}

export async function getSetting(key: string): Promise<string | undefined> {
  const map = await fetchSettingsMap();
  return map[key];
}


