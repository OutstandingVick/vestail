"use client";

import { createContext, useContext } from "react";

import type { AdminOverview } from "@/lib/admin-types";

export const AdminContext = createContext<AdminOverview | null>(null);

export function useAdminOverview(): AdminOverview {
  const value = useContext(AdminContext);
  if (!value) throw new Error("Admin data is only available inside the owner dashboard.");
  return value;
}
