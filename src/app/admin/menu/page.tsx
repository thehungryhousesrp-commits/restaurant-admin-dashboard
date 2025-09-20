import AdminDashboard from "@/components/pages/AdminDashboard";

// This would ideally be a protected route that checks for admin role.
export default function AdminMenuPage() {
    return <AdminDashboard />;
}
