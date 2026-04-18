import { getSidebarData } from '@/lib/server-data'
import { SidebarShell } from '@/components/employee/SidebarShell'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const sidebarData = await getSidebarData()
  return <SidebarShell sidebarData={sidebarData}>{children}</SidebarShell>
}
