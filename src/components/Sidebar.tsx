import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store';
import { LayoutDashboard, PackageCheck, PlusCircle, ClipboardList, CheckCircle, Truck, ScrollText, PieChart, Database, BarChart2 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const auth = useAppStore((state) => state.auth);

  const navGroups = [
    {
      label: 'OPERATIONS',
      items: [
        { id: 'nav_dashboard', icon: <LayoutDashboard size={18} />, label: 'Site Dashboard', route: '/dashboard' },
        { id: 'nav_receive', icon: <PackageCheck size={18} />, label: 'Receive Fuel', route: '/receive' },
      ]
    },
    {
      label: 'PROCUREMENT',
      items: [
        { id: 'nav_request', icon: <PlusCircle size={18} />, label: 'Request Delivery', route: '/requests/new' },
        { id: 'nav_requests', icon: <ClipboardList size={18} />, label: 'My Requests', route: '/requests' },
        { id: 'nav_approve', icon: <CheckCircle size={18} />, label: 'Approve Requests', route: '/approvals' },
      ]
    },
    {
      label: 'TRACKING',
      items: [
        { id: 'nav_deliveries', icon: <Truck size={18} />, label: 'Delivery Tracking', route: '/deliveries' },
        { id: 'nav_receipts', icon: <ScrollText size={18} />, label: 'Signed Receipts', route: '/receipts' },
      ]
    },
    {
      label: 'INVENTORY & REPORTING',
      items: [
        { id: 'nav_allocations', icon: <PieChart size={18} />, label: 'Allocation Ceiling', route: '/allocations' },
        { id: 'nav_stock', icon: <Database size={18} />, label: 'Site Stock', route: '/stock' },
        { id: 'nav_reports', icon: <BarChart2 size={18} />, label: 'Consumption Reports', route: '/reports' },
      ]
    }
  ];

  return (
    <aside style={{ width: '236px', background: 'var(--sidebar-bg)', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--sidebar-active)' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>{auth?.project_name}</h2>
        <div style={{ fontSize: '11px', color: '#8FBA74' }}>{auth?.site_name}</div>
      </div>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {navGroups.map((group, idx) => (
          <div key={idx} style={{ marginBottom: '24px' }}>
            <div style={{ padding: '0 16px', fontSize: '10px', color: '#4A6B42', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {group.label}
            </div>
            {group.items.map(item => (
              <NavLink
                key={item.id}
                to={item.route}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  color: '#fff',
                  background: isActive ? 'var(--sidebar-active)' : 'transparent',
                  gap: '12px',
                  fontSize: '14px'
                })}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
};
