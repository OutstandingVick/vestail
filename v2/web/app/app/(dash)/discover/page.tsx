import { redirect } from "next/navigation";

/** Preserve old bookmarks after Search and Discover were combined. */
export default function DiscoverRedirect() {
  redirect("/app/search#discover");
}
