import { StatCard } from "@/components/shared/cards/StatCard";
import { Users, UserCheck, DollarSign, CheckCircle2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getAdminStats = unstable_cache(
  async () => {
    try {
      // Get patient role ID
      const patientRole = await prisma.role.findUnique({
        where: { name: "patient" },
        select: { id: true },
      });

      // Use Promise.all for parallel execution and database aggregations
      const [
        totalUsers,
        totalPatients,
        totalDoctors,
        pendingVerifications,
        pendingApplications,
        monthlyRevenue,
      ] = await Promise.all([
        prisma.user.count(),
        patientRole
          ? prisma.user.count({ where: { roleId: patientRole.id } })
          : Promise.resolve(0),
        prisma.doctor.count(),
        prisma.doctorVerification.count({ where: { status: "PENDING" } }),
        prisma.doctorApplication.count({ where: { status: "PENDING" } }),
        (async () => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const result = await prisma.appointmentPayment.aggregate({
            where: {
              status: "COMPLETED",
              createdAt: {
                gte: startOfMonth,
              },
            },
            _sum: {
              commissionAmount: true,
            },
          });
          return Number(result._sum.commissionAmount || 0);
        })(),
      ]);

      return {
        totalUsers,
        totalPatients,
        totalDoctors,
        pendingVerifications: pendingVerifications + pendingApplications,
        monthlyRevenue,
      };
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return {
        totalUsers: 0,
        totalPatients: 0,
        totalDoctors: 0,
        pendingVerifications: 0,
        monthlyRevenue: 0,
      };
    }
  },
  ["admin-stats"],
  { revalidate: 60, tags: ["admin-stats"] }
);

export default async function AdminStatsGrid() {
  const stats = await getAdminStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        description="All platform users"
        icon={Users}
        href="/admin/users"
      />
      <StatCard
        title="Patients"
        value={stats.totalPatients}
        description="Registered patients"
        icon={UserCheck}
        href="/admin/users?role=patient"
      />
      <StatCard
        title="Doctors"
        value={stats.totalDoctors}
        description="All registered doctors"
        icon={Users}
        href="/admin/users"
      />
      <StatCard
        title="Pending Verifications"
        value={stats.pendingVerifications}
        description="Awaiting review"
        icon={CheckCircle2}
        href="/admin/verifications"
      />
      <StatCard
        title="Platform Revenue"
        value={`$${stats.monthlyRevenue.toFixed(2)}`}
        description="This month"
        icon={DollarSign}
        href="/admin/analytics"
      />
    </div>
  );
}

