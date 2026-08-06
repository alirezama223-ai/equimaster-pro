import AdminShell from "@/app/components/admin/AdminShell";

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
