import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import {
  LayoutDashboard,
  AlertCircle,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Edit,
  Send,
  LogOut,
  Menu,
  ChevronLeft,
  Shield,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StagingInbox } from './content/StagingInbox';
import { LiveDbView } from './content/LiveDbView';
import { FabricEditor } from './content/FabricEditor';
import { UserManagement } from './content/UserManagement';
import { AdminFabric } from '@/types';

// Types
interface AdminDashboardData {
  admin_dashboard: {
    overview_stats: {
      pending_approvals: number;
      active_disputes: number;
      pending_refunds: number;
      total_escrow_holdings: string;
    };
    action_center: {
      rfq_moderation: RFQModeration[];
      fabric_approval: FabricApproval[];
    };
    finance_desk: {
      pending_refunds: PendingRefund[];
    };
    message_relay_center: {
      buyer_queries: Query[];
      manufacturer_queries: Query[];
    };
  };
}

interface RFQModeration {
  rfq_id: string;
  buyer: string;
  content: string;
  risk_score: string;
  actions: string[];
}

interface FabricApproval {
  id: string;
  manufacturer: string;
  issue: string;
  actions: string[];
}

interface PendingRefund {
  task_id: string;
  buyer_id: string;
  amount: string;
  reason: string;
  status: string;
  actions: string[];
}

interface Query {
  from: string;
  subject: string;
  related_rfq: string;
  action: string;
}

type DashboardView = 'dashboard' | 'action-center' | 'finance' | 'messages' | 'content-manager' | 'user-management';

// Mock data
const MOCK_DATA: AdminDashboardData = {
  admin_dashboard: {
    overview_stats: {
      pending_approvals: 5,
      active_disputes: 0,
      pending_refunds: 3,
      total_escrow_holdings: "$1,250.00"
    },
    action_center: {
      rfq_moderation: [
        {
          rfq_id: "RFQ-2024-105",
          buyer: "New Buyer Corp",
          content: "Need polyester...",
          risk_score: "LOW",
          actions: ["Approve & Broadcast", "Reject", "Edit"]
        }
      ],
      fabric_approval: [
        {
          id: "FAB-999",
          manufacturer: "TexCo",
          issue: "Image too blurry",
          actions: ["Approve", "Request Resubmission"]
        }
      ]
    },
    finance_desk: {
      pending_refunds: [
        {
          task_id: "REF-001",
          buyer_id: "BUYER-882",
          amount: "$20.00",
          reason: "Sample Accepted - Credit Applied to Bulk",
          status: "PENDING_ACTION",
          actions: ["Mark Refunded", "Reject Request"]
        }
      ]
    },
    message_relay_center: {
      buyer_queries: [
        {
          from: "BUYER-882",
          subject: "Can Manufacturer X do custom colors?",
          related_rfq: "RFQ-2024-99",
          action: "Reply as Admin"
        }
      ],
      manufacturer_queries: [
        {
          from: "MFG-01",
          subject: "Is the buyer ready for bulk?",
          related_rfq: "RFQ-2024-99",
          action: "Reply as Admin"
        }
      ]
    }
  }
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data] = useState<AdminDashboardData>(MOCK_DATA);
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionCenterTab, setActionCenterTab] = useState<'rfqs' | 'fabrics'>('rfqs');
  const [messageTab, setMessageTab] = useState<'buyers' | 'manufacturers'>('buyers');

  // Content Manager State
  const [contentTab, setContentTab] = useState<'staging' | 'live'>('staging');
  const [editingFabric, setEditingFabric] = useState<AdminFabric | null>(null);

  const getRiskBadge = (riskScore: string) => {
    const riskMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'LOW': { label: 'Low Risk', variant: 'default' },
      'MEDIUM': { label: 'Medium Risk', variant: 'secondary' },
      'HIGH': { label: 'High Risk', variant: 'destructive' }
    };

    const riskInfo = riskMap[riskScore] || { label: riskScore, variant: 'outline' as const };
    return (
      <Badge variant={riskInfo.variant} className="text-xs">
        {riskInfo.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'PENDING_ACTION': { label: 'Pending Action', variant: 'secondary' },
      'APPROVED': { label: 'Approved', variant: 'default' },
      'REJECTED': { label: 'Rejected', variant: 'destructive' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isToggleButton = target.closest('[data-sidebar-toggle]');
    const isSidebar = target.closest('[data-sidebar]');

    if (!isToggleButton && !isSidebar && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const menuItems = [
    { id: 'dashboard' as DashboardView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'user-management' as DashboardView, label: 'User Management', icon: Users },
    { id: 'content-manager' as DashboardView, label: 'Content Manager', icon: Edit },
    { id: 'action-center' as DashboardView, label: 'Action Center', icon: AlertCircle },
    { id: 'finance' as DashboardView, label: 'Finance Desk', icon: DollarSign },
    { id: 'messages' as DashboardView, label: 'Message Relay', icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Admin Dashboard</h1>
              <p className="text-neutral-500">Overview of platform operations and pending actions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Pending Approvals</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.admin_dashboard.overview_stats.pending_approvals}</p>
                  </div>
                  <div className="p-3 bg-warning-50 rounded-full">
                    <AlertCircle className="w-6 h-6 text-warning-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Active Disputes</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.admin_dashboard.overview_stats.active_disputes}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-full">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Pending Refunds</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.admin_dashboard.overview_stats.pending_refunds}</p>
                  </div>
                  <div className="p-3 bg-accent-50 rounded-full">
                    <DollarSign className="w-6 h-6 text-accent-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Escrow Holdings</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.admin_dashboard.overview_stats.total_escrow_holdings}</p>
                  </div>
                  <div className="p-3 bg-primary-50 rounded-full">
                    <DollarSign className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-neutral-900">Action Center</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveView('action-center')}>View All</Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">RFQ Moderation</p>
                      <p className="text-xs text-neutral-500">{data.admin_dashboard.action_center.rfq_moderation.length} pending</p>
                    </div>
                    <Badge variant="secondary">{data.admin_dashboard.action_center.rfq_moderation.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Fabric Approval</p>
                      <p className="text-xs text-neutral-500">{data.admin_dashboard.action_center.fabric_approval.length} pending</p>
                    </div>
                    <Badge variant="secondary">{data.admin_dashboard.action_center.fabric_approval.length}</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-neutral-900">Finance Desk</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveView('finance')}>View All</Button>
                </div>
                <div className="space-y-3">
                  {data.admin_dashboard.finance_desk.pending_refunds.slice(0, 2).map((refund) => (
                    <div key={refund.task_id} className="p-3 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-semibold text-neutral-900">{refund.task_id}</span>
                        {getStatusBadge(refund.status)}
                      </div>
                      <p className="text-xs text-neutral-500 mb-1">{refund.buyer_id}</p>
                      <p className="text-sm font-semibold text-primary-600">{refund.amount}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case 'content-manager':
        if (editingFabric) {
          return (
            <FabricEditor
              fabric={editingFabric}
              onClose={() => setEditingFabric(null)}
              onSave={() => {
                setEditingFabric(null);
                // Ideally refresh the list, but components handle their own fetching for now.
                // We could lift state or use a query library, but for this scope, re-mounting or internal refresh is fine.
              }}
            />
          );
        }

        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Content Manager</h1>
              <p className="text-neutral-500">Moderate fabric uploads and manage the live database</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-neutral-200">
              <button
                onClick={() => setContentTab('staging')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${contentTab === 'staging'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                Staging Inbox
              </button>
              <button
                onClick={() => setContentTab('live')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${contentTab === 'live'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                Live Database
              </button>
            </div>

            {contentTab === 'staging' ? (
              <StagingInbox onReview={setEditingFabric} />
            ) : (
              <LiveDbView onEdit={setEditingFabric} />
            )}
          </div>
        );

      case 'action-center':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Action Center</h1>
              <p className="text-neutral-500">Moderate RFQs and approve fabric listings</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-neutral-200">
              <button
                onClick={() => setActionCenterTab('rfqs')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${actionCenterTab === 'rfqs'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                RFQ Moderation ({data.admin_dashboard.action_center.rfq_moderation.length})
              </button>
              <button
                onClick={() => setActionCenterTab('fabrics')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${actionCenterTab === 'fabrics'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                Fabric Approval ({data.admin_dashboard.action_center.fabric_approval.length})
              </button>
            </div>

            {/* RFQ Moderation */}
            {actionCenterTab === 'rfqs' && (
              <div className="space-y-4">
                {data.admin_dashboard.action_center.rfq_moderation.map((rfq) => (
                  <Card key={rfq.rfq_id} className="p-6 bg-white border border-neutral-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">{rfq.rfq_id}</h3>
                          {getRiskBadge(rfq.risk_score)}
                        </div>
                        <p className="text-sm font-medium text-neutral-700 mb-2">Buyer: {rfq.buyer}</p>
                        <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">{rfq.content}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {rfq.actions.includes('Approve & Broadcast') && (
                        <Button className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Approve & Broadcast
                        </Button>
                      )}
                      {rfq.actions.includes('Reject') && (
                        <Button variant="destructive" className="flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      )}
                      {rfq.actions.includes('Edit') && (
                        <Button variant="outline" className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Fabric Approval */}
            {actionCenterTab === 'fabrics' && (
              <div className="space-y-4">
                {data.admin_dashboard.action_center.fabric_approval.map((fabric) => (
                  <Card key={fabric.id} className="p-6 bg-white border border-neutral-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">{fabric.id}</h3>
                        </div>
                        <p className="text-sm font-medium text-neutral-700 mb-2">Manufacturer: {fabric.manufacturer}</p>
                        <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                          <p className="text-sm text-warning-900">Issue: {fabric.issue}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {fabric.actions.includes('Approve') && (
                        <Button className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </Button>
                      )}
                      {fabric.actions.includes('Request Resubmission') && (
                        <Button variant="outline" className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Request Resubmission
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'finance':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Finance Desk</h1>
              <p className="text-neutral-500">Manage refunds and financial transactions</p>
            </div>

            <div className="space-y-4">
              {data.admin_dashboard.finance_desk.pending_refunds.map((refund) => (
                <Card key={refund.task_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">{refund.task_id}</h3>
                        {getStatusBadge(refund.status)}
                      </div>
                      <p className="text-sm text-neutral-500 mb-1">Buyer: {refund.buyer_id}</p>
                      <p className="text-lg font-bold text-primary-600 mb-2">{refund.amount}</p>
                      <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">{refund.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {refund.actions.includes('Mark Refunded') && (
                      <Button className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Refunded
                      </Button>
                    )}
                    {refund.actions.includes('Reject Request') && (
                      <Button variant="destructive" className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Reject Request
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Message Relay Center</h1>
              <p className="text-neutral-500">Manage buyer and manufacturer queries</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-neutral-200">
              <button
                onClick={() => setMessageTab('buyers')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${messageTab === 'buyers'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                Buyer Queries ({data.admin_dashboard.message_relay_center.buyer_queries.length})
              </button>
              <button
                onClick={() => setMessageTab('manufacturers')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${messageTab === 'manufacturers'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                Manufacturer Queries ({data.admin_dashboard.message_relay_center.manufacturer_queries.length})
              </button>
            </div>

            {/* Buyer Queries */}
            {messageTab === 'buyers' && (
              <div className="space-y-4">
                {data.admin_dashboard.message_relay_center.buyer_queries.map((query, idx) => (
                  <Card key={idx} className="p-6 bg-white border border-neutral-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">{query.from}</Badge>
                          <span className="text-xs text-neutral-500">RFQ: {query.related_rfq}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{query.subject}</h3>
                      </div>
                    </div>
                    <Button className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {query.action}
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Manufacturer Queries */}
            {messageTab === 'manufacturers' && (
              <div className="space-y-4">
                {data.admin_dashboard.message_relay_center.manufacturer_queries.map((query, idx) => (
                  <Card key={idx} className="p-6 bg-white border border-neutral-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">{query.from}</Badge>
                          <span className="text-xs text-neutral-500">RFQ: {query.related_rfq}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{query.subject}</h3>
                      </div>
                    </div>
                    <Button className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {query.action}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'user-management':
        return <UserManagement />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex">
      {/* Sidebar */}
      <div
        data-sidebar
        className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-neutral-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative`}
      >
        {/* Logo */}
        {sidebarOpen && (
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-xl font-bold text-neutral-900">LinkER Admin</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        {sidebarOpen && (
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-red-50 text-red-700 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* User Info & Logout */}
        {sidebarOpen && (
          <div className="p-4 border-t border-neutral-200">
            <div className="mb-3 p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1 whitespace-nowrap">Logged in as</p>
              <p className="text-sm font-semibold text-neutral-900 truncate">{user?.email || 'admin@linker.com'}</p>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full flex items-center gap-2 justify-start text-neutral-600 hover:text-neutral-900"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Logout</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-neutral-200 px-4 sm:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                data-sidebar-toggle
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center justify-center"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
              <div>
                <p className="text-sm text-neutral-500">Admin Portal - {user?.email || 'admin@linker.com'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" onClick={handleContentClick}>
          <div className="max-w-7xl mx-auto px-8 py-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
