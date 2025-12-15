import AdminAntLayout from '~/components/admin/ant-layout'
import { App } from 'antd'

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminAntLayout>
      <App>
        {children}
      </App>
    </AdminAntLayout>
  )
}
