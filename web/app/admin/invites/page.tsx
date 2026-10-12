import { AdminHeader } from "@/components/admin/AdminHeader";
import { InviteManager } from "@/components/admin/InviteManager";

export default function AdminInvitesPage() {
  return <div className="space-y-8"><AdminHeader title="Early-access invitations" description="Generate unique signup codes, monitor redemption, and revoke unused invitations." /><InviteManager /></div>;
}
