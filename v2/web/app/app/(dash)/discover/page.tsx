import { redirect } from "next/navigation";

/** Preserve old bookmarks after the separate Discover directory was removed. */
export default function DiscoverRedirect() {
  redirect("/app/search");
}
