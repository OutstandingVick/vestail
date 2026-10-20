import { AdminHeader } from "@/components/admin/AdminHeader";
import { TesterApplications } from "@/components/admin/TesterApplications";

export default function AdminTestersPage() {
  return <div className="space-y-7"><AdminHeader title="Tester applications" description="Review people who applied through the Call for Testers page. Contact details and wallet addresses are shown only in this protected owner view." /><TesterApplications /></div>;
}
