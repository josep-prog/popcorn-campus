import { supabase } from "./supabase";

export type UserRole = "admin" | "client" | "unknown";

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const getUserRole = async (): Promise<UserRole> => {
  const user = await getCurrentUser();
  if (!user) return "unknown";

  const email = user.email || "";
  const userMeta = (user.user_metadata || {}) as Record<string, any>;
  const appMeta = (user.app_metadata || {}) as Record<string, any>;

  const envAdmins = (import.meta as any).env?.VITE_ADMIN_EMAILS as string | undefined;
  const adminEmailList = (envAdmins || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

  const isAdminFlag = userMeta.is_admin === true || appMeta.is_admin === true;
  const roleStr = (userMeta.role || appMeta.role || "").toString().toLowerCase();
  const emailMatch = email && adminEmailList.includes(email.toLowerCase());
  if (isAdminFlag || roleStr === "admin" || emailMatch) return "admin";

  // Check admins table for current user id (RLS allows self-read)
  try {
    const { data: adminRows, error } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .limit(1);
    if (!error && adminRows && adminRows.length > 0) {
      return "admin";
    }
  } catch {
    // ignore – fall through to client
  }
  return "client";
};

export const isAdminUser = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === "admin";
};


