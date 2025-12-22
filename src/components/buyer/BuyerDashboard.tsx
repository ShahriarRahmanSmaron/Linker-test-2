import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard,
  Search,
  FileText,
  Package,
  AlertCircle,
  Eye,
  X,
  Clock,
  Truck,
  Star,
  Image as ImageIcon,
  ExternalLink,
  LogOut,
  Layers,
  Menu,
  ChevronLeft,
  MessageSquare,
  Download,
  Trash2,
  Link as LinkIcon,
  Building2,
  Award,
  CheckCircle2,
  Send
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { SearchFilters } from '../SearchFilters';
import { SearchFabricCard } from '../SearchFabricCard';
import { SelectionPanel } from '../SelectionPanel';
import { MockupModal } from '../MockupModal';
import { TechpackModal } from '../TechpackModal';
import { Fabric, FabricFilter } from '../../types';

type DashboardView = 'dashboard' | 'fabric-library' | 'rfqs' | 'samples' | 'workspace' | 'support';

// Types
interface BuyerDashboardData {
  buyer_dashboard: {
    user_profile: {
      id: string;
      company: string;
      tier: string;
    };
    stats: {
      open_rfqs: number;
      samples_tracking: number;
      unread_admin_messages: number;
    };
    private_workspace: {
      saved_mockups: SavedMockup[];
      moodboards: any[];
    };
    rfq_management: {
      active_rfqs: ActiveRFQ[];
    };
    sample_orders: SampleOrder[];
    support_inbox: {
      active_threads: SupportThread[];
    };
  };
}

interface SavedMockup {
  id: string;
  name: string;
  garment_type: string;
  fabric_ref_used: string;
  created_at: string;
  preview_url: string;
  actions: string[];
}

interface ActiveRFQ {
  rfq_id: string;
  title: string;
  status: string;
  posted_date: string;
  expires_in: string;
  admin_approval_status: string;
  manufacturer_bids: ManufacturerBid[];
}

interface ManufacturerBid {
  manufacturer_id: string;
  manufacturer_name: string;
  bid_price: string;
  stock_status: string;
  can_request_sample: boolean;
}

interface TrackingEvent {
  status: string;
  timestamp: string | null;
  completed: boolean;
  details?: string;
}

interface SampleOrder {
  order_id: string;
  items: string[];
  status: string;
  tracking_number: string;
  courier: string;
  payment_status: string;
  actions: string[];
  tracking_timeline?: TrackingEvent[];
}

interface SupportThread {
  thread_id: string;
  subject: string;
  last_message: string;
  status: string;
  recipient: string;
}

// Mock data
const MOCK_DATA: BuyerDashboardData = {
  buyer_dashboard: {
    user_profile: {
      id: "BUYER-882",
      company: "Shahriar",
      tier: "Gold"
    },
    stats: {
      open_rfqs: 3,
      samples_tracking: 2,
      unread_admin_messages: 1
    },
    private_workspace: {
      saved_mockups: [
        {
          id: "MOCK-102",
          name: "Summer 24 Polo Visualization",
          garment_type: "Men Polo",
          fabric_ref_used: "FAB-552",
          created_at: "2024-03-25T10:00:00Z",
          preview_url: "/static/private/user_882/mockup_102.jpg",
          actions: ["download", "attach_to_rfq", "delete"]
        }
      ],
      moodboards: []
    },
    rfq_management: {
      active_rfqs: [
        {
          rfq_id: "RFQ-2024-99",
          title: "100% Cotton Pique 220GSM",
          status: "APPROVED_LIVE",
          posted_date: "2024-03-20",
          expires_in: "10 days",
          admin_approval_status: "APPROVED",
          manufacturer_bids: [
            {
              manufacturer_id: "MFG-01",
              manufacturer_name: "Global Tex (Admin Verified)",
              bid_price: "$4.50/yd",
              stock_status: "Available",
              can_request_sample: true
            }
          ]
        }
      ]
    },
    sample_orders: [
      {
        order_id: "SMP-500",
        items: ["Sample: Global Tex Pique"],
        status: "SHIPPED",
        tracking_number: "DEX-882910",
        courier: "RedX",
        payment_status: "PAID",
        actions: ["mark_received", "report_issue"],
        tracking_timeline: [
          { status: "PLACED", timestamp: "2024-03-21T09:00:00Z", completed: true },
          { status: "PAID", timestamp: "2024-03-21T09:05:00Z", completed: true },
          { status: "PROCESSING", timestamp: "2024-03-22T14:00:00Z", completed: true },
          { status: "SHIPPED", timestamp: "2024-03-23T08:30:00Z", completed: true, details: "Courier: RedX, ID: DEX-882910" },
          { status: "DELIVERED", timestamp: null, completed: false }
        ]
      }
    ],
    support_inbox: {
      active_threads: [
        {
          thread_id: "T-101",
          subject: "Inquiry about RFQ-2024-99",
          last_message: "Admin: The manufacturer has confirmed they can match that color.",
          status: "UNREAD",
          recipient: "FAB_AI_ADMIN"
        }
      ]
    }
  }
};

export const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data] = useState<BuyerDashboardData>(MOCK_DATA);
  const [activeView, setActiveView] = useState<DashboardView>('fabric-library');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search/Fabric Library State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FabricFilter>({ fabrication: '', type: '', gsmRange: '' });
  const [selectedFabrics, setSelectedFabrics] = useState<Fabric[]>([]);
  const [mockupModalFabric, setMockupModalFabric] = useState<Fabric | null>(null);
  const [techpackModalFabric, setTechpackModalFabric] = useState<Fabric | null>(null);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Close the mobile sidebar when the main content is interacted with
  const handleContentClick = () => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'APPROVED_LIVE': { label: 'Live', variant: 'default' },
      'APPROVED': { label: 'Approved', variant: 'default' },
      'PENDING_ADMIN_APPROVAL': { label: 'Pending Approval', variant: 'secondary' },
      'SHIPPED': { label: 'Shipped', variant: 'default' },
      'DELIVERED': { label: 'Delivered', variant: 'default' },
      'PLACED': { label: 'Placed', variant: 'secondary' },
      'PAID': { label: 'Paid', variant: 'default' },
      'PROCESSING': { label: 'Processing', variant: 'secondary' },
      'UNREAD': { label: 'Unread', variant: 'secondary' },
      'READ': { label: 'Read', variant: 'outline' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierColors: Record<string, string> = {
      'Gold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Silver': 'bg-gray-100 text-gray-800 border-gray-200',
      'Bronze': 'bg-orange-100 text-orange-800 border-orange-200',
      'Platinum': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return tierColors[tier] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  // Fetch fabrics for search
  React.useEffect(() => {
    const hasSearchCriteria = searchTerm.trim() !== '' ||
      filters.fabrication !== '' ||
      filters.type !== '' ||
      filters.gsmRange !== '';

    if (!hasSearchCriteria) {
      setFabrics([]);
      setHasMore(false);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }

    const fetchFabrics = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '20');
        if (searchTerm) params.append('search', searchTerm);
        if (filters.fabrication) params.append('group', filters.fabrication);
        if (filters.gsmRange) params.append('weight', filters.gsmRange);

        const response = await fetch(`/api/find-fabrics?${params.toString()}`);
        if (response.ok) {
          const result = await response.json();
          if (page === 1) {
            setFabrics(result.results || []);
          } else {
            setFabrics(prev => [...prev, ...(result.results || [])]);
          }
          setHasMore(page < result.pages);
          setTotalResults(result.total);
        }
      } catch (error) {
        console.error('Error fetching fabrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchFabrics();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, page]);

  React.useEffect(() => {
    setPage(1);
    setFabrics([]);
  }, [searchTerm, filters]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  // Auto-collapse sidebar when user clicks outside of sidebar
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isToggleButton = target.closest('[data-sidebar-toggle]');
      const isSidebar = target.closest('[data-sidebar]');

      if (!isToggleButton && !isSidebar && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  const menuItems = [
    { id: 'fabric-library' as DashboardView, label: 'Fabric Library', icon: Search },
    { id: 'dashboard' as DashboardView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rfqs' as DashboardView, label: 'RFQs', icon: FileText },
    { id: 'samples' as DashboardView, label: 'Samples', icon: Package },
    { id: 'workspace' as DashboardView, label: 'Private Workspace', icon: ImageIcon },
    { id: 'support' as DashboardView, label: 'Support Inbox', icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'fabric-library':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Fabric Library</h1>
              <p className="text-sm sm:text-base text-neutral-500">Search by fabrication, code, composition, or mill.</p>
            </div>

            <div className="mb-6">
              <div className="relative max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-lg leading-5 bg-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out sm:text-sm"
                  placeholder="Search fabrics (e.g. 'Organic Cotton', 'Fleece', 'Masco Knits')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-6">
              <SearchFilters
                filters={filters}
                setFilters={setFilters}
              />
            </div>

            {fabrics.length > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-neutral-500">
                  {totalResults} {totalResults === 1 ? 'fabric' : 'fabrics'} found
                </p>
              </div>
            )}

            {fabrics.length === 0 && !isLoading && (searchTerm || filters.fabrication || filters.type || filters.gsmRange) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500">No fabrics found. Try adjusting your search.</p>
              </div>
            )}

            {fabrics.length === 0 && !isLoading && !searchTerm && !filters.fabrication && !filters.type && !filters.gsmRange && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500 font-medium">Start Your Fabric Search</p>
              </div>
            )}

            {isLoading && fabrics.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
                <p className="text-neutral-500 mt-4">Searching fabrics...</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {fabrics.map((fabric) => {
                const fabricId = fabric.ref || fabric.id;
                return (
                  <SearchFabricCard
                    key={fabricId}
                    fabric={fabric}
                    isSelected={!!selectedFabrics.find(f => (f.ref || f.id) === fabricId)}
                    onToggleSelect={(f) => {
                      const id = f.ref || f.id;
                      if (selectedFabrics.find(sf => (sf.ref || sf.id) === id)) {
                        setSelectedFabrics(selectedFabrics.filter(sf => (sf.ref || sf.id) !== id));
                      } else {
                        setSelectedFabrics([...selectedFabrics, f]);
                      }
                    }}
                    onOpenMockup={setMockupModalFabric}
                    onOpenTechpack={setTechpackModalFabric}
                  />
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center py-4">
                <Button onClick={handleLoadMore} variant="outline" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
              <p className="text-sm sm:text-base text-neutral-500">Overview of your RFQs, samples, and activities</p>
            </div>

            {/* User Profile Card */}
            <Card className="p-6 bg-white border border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-50 rounded-full">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{data.buyer_dashboard.user_profile.company}</h3>
                    <p className="text-sm text-neutral-500">ID: {data.buyer_dashboard.user_profile.id}</p>
                  </div>
                </div>
                <Badge className={`${getTierBadge(data.buyer_dashboard.user_profile.tier)} border`}>
                  <Award className="w-3 h-3 mr-1" />
                  {data.buyer_dashboard.user_profile.tier} Tier
                </Badge>
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Open RFQs</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.buyer_dashboard.stats.open_rfqs}</p>
                  </div>
                  <div className="p-3 bg-primary-50 rounded-full">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Samples Tracking</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.buyer_dashboard.stats.samples_tracking}</p>
                  </div>
                  <div className="p-3 bg-accent-50 rounded-full">
                    <Truck className="w-6 h-6 text-accent-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Unread Messages</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.buyer_dashboard.stats.unread_admin_messages}</p>
                  </div>
                  <div className="p-3 bg-warning-50 rounded-full">
                    <MessageSquare className="w-6 h-6 text-warning-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-neutral-900">Active RFQs</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveView('rfqs')}>View All</Button>
                </div>
                <div className="space-y-3">
                  {data.buyer_dashboard.rfq_management.active_rfqs.slice(0, 2).map((rfq) => (
                    <div key={rfq.rfq_id} className="p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-neutral-900">{rfq.title}</p>
                        {getStatusBadge(rfq.status)}
                      </div>
                      <p className="text-xs text-neutral-500">Expires in {rfq.expires_in}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-neutral-900">Support Inbox</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveView('support')}>View All</Button>
                </div>
                <div className="space-y-3">
                  {data.buyer_dashboard.support_inbox.active_threads.slice(0, 2).map((thread) => (
                    <div key={thread.thread_id} className="p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-neutral-900">{thread.subject}</p>
                        {getStatusBadge(thread.status)}
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-1">{thread.last_message}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case 'rfqs':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">RFQ Management</h1>
              <p className="text-neutral-500">Manage your Request for Quotations</p>
            </div>
            <div className="space-y-4">
              {data.buyer_dashboard.rfq_management.active_rfqs.map((rfq) => (
                <Card key={rfq.rfq_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">{rfq.title}</h3>
                        {getStatusBadge(rfq.status)}
                        {getStatusBadge(rfq.admin_approval_status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span>RFQ ID: {rfq.rfq_id}</span>
                        <span>Posted: {rfq.posted_date}</span>
                        <span>Expires in: {rfq.expires_in}</span>
                      </div>
                    </div>
                  </div>

                  {/* Manufacturer Bids */}
                  {rfq.manufacturer_bids && rfq.manufacturer_bids.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-neutral-700 mb-3">Manufacturer Bids</h4>
                      <div className="space-y-3">
                        {rfq.manufacturer_bids.map((bid, idx) => (
                          <div key={idx} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-neutral-900">{bid.manufacturer_name}</span>
                                <Badge variant="outline" className="text-xs">ID: {bid.manufacturer_id}</Badge>
                              </div>
                              <span className="text-lg font-bold text-primary-600">{bid.bid_price}</span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant={bid.stock_status === 'Available' ? 'default' : 'secondary'} className="text-xs">
                                {bid.stock_status}
                              </Badge>
                              {bid.can_request_sample && (
                                <Button size="sm" variant="outline" className="flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  Request Sample
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );

      case 'samples':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Sample Orders</h1>
              <p className="text-neutral-500">Track your sample orders and deliveries</p>
            </div>
            <div className="space-y-4">
              {data.buyer_dashboard.sample_orders.map((order) => (
                <Card key={order.order_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">Order ID: {order.order_id}</h3>
                      <div className="space-y-1 mb-3">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-neutral-600">{item}</p>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span>Tracking: {order.tracking_number}</span>
                        <span>Courier: {order.courier}</span>
                        <span className="font-medium text-primary-600">Payment: {order.payment_status}</span>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Tracking Timeline */}
                  {order.tracking_timeline && order.tracking_timeline.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-neutral-700 mb-4">Tracking Timeline</h4>
                      <div className="space-y-4">
                        {order.tracking_timeline.map((event, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${event.completed ? 'bg-primary-600' : 'bg-neutral-300 border-2 border-neutral-400'
                                }`} />
                              {idx < order.tracking_timeline.length - 1 && (
                                <div className={`w-0.5 h-12 ${event.completed ? 'bg-primary-600' : 'bg-neutral-300'}`} />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`text-sm font-medium ${event.completed ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                  {event.status}
                                </p>
                                {event.completed && event.timestamp && (
                                  <Clock className="w-3 h-3 text-neutral-400" />
                                )}
                              </div>
                              {event.timestamp && (
                                <p className="text-xs text-neutral-500 mb-1">{formatDate(event.timestamp)}</p>
                              )}
                              {event.details && (
                                <p className="text-xs text-neutral-600 mt-1">{event.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.actions && order.actions.length > 0 && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200">
                      {order.actions.includes('mark_received') && (
                        <Button size="sm" className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Received
                        </Button>
                      )}
                      {order.actions.includes('report_issue') && (
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Report Issue
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );

      case 'workspace':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Private Workspace</h1>
              <p className="text-neutral-500">Your saved mockups and moodboards</p>
            </div>

            {/* Saved Mockups */}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Saved Mockups</h2>
              {data.buyer_dashboard.private_workspace.saved_mockups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data.buyer_dashboard.private_workspace.saved_mockups.map((mockup) => (
                    <Card key={mockup.id} className="p-4 bg-white border border-neutral-200 hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-neutral-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                        <ImageIcon className="w-12 h-12 text-neutral-400" />
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-1">{mockup.name}</h3>
                      <div className="space-y-1 mb-3">
                        <p className="text-xs text-neutral-500">Type: {mockup.garment_type}</p>
                        <p className="text-xs text-neutral-500">Fabric: {mockup.fabric_ref_used}</p>
                        <p className="text-xs text-neutral-500">Created: {formatDate(mockup.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        {mockup.actions.includes('download') && (
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                        {mockup.actions.includes('attach_to_rfq') && (
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                          </Button>
                        )}
                        {mockup.actions.includes('delete') && (
                          <Button size="sm" variant="outline" className="flex items-center gap-1 text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 bg-white border border-neutral-200 text-center">
                  <ImageIcon className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-500">No saved mockups yet</p>
                </Card>
              )}
            </div>

            {/* Moodboards */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Moodboards</h2>
              {data.buyer_dashboard.private_workspace.moodboards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Moodboards would be rendered here */}
                </div>
              ) : (
                <Card className="p-12 bg-white border border-neutral-200 text-center">
                  <Layers className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-500">No moodboards yet</p>
                </Card>
              )}
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Support Inbox</h1>
              <p className="text-neutral-500">Communicate with Fab-Ai Admin</p>
            </div>
            <div className="space-y-4">
              {data.buyer_dashboard.support_inbox.active_threads.map((thread) => (
                <Card key={thread.thread_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">{thread.subject}</h3>
                        {getStatusBadge(thread.status)}
                      </div>
                      <p className="text-sm text-neutral-500 mb-1">Thread ID: {thread.thread_id}</p>
                      <p className="text-sm text-neutral-500">To: {thread.recipient}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg mb-4">
                    <p className="text-sm text-neutral-700">{thread.last_message}</p>
                  </div>
                  <Button className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Reply
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex relative">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        data-sidebar
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-in-out lg:transition-none`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Layers className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-xl font-bold text-neutral-900">Fab-Ai</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  // Always close sidebar on mobile after selection
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-neutral-200">
          <div className="mb-3 p-3 bg-neutral-50 rounded-lg">
            <p className="text-xs text-neutral-500 mb-1 whitespace-nowrap">Logged in as</p>
            <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name || user?.email || 'User'}</p>
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
                <p className="text-sm text-neutral-500">Welcome back, {user?.name || user?.email || 'User'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" onClick={handleContentClick}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      {selectedFabrics.length > 0 && (
        <SelectionPanel
          selectedFabrics={selectedFabrics}
          onRemove={(id) => setSelectedFabrics(selectedFabrics.filter(f => (f.ref || f.id) !== id))}
          onClear={() => setSelectedFabrics([])}
        />
      )}

      {/* Modals */}
      {mockupModalFabric && (
        <MockupModal
          fabric={mockupModalFabric}
          isSelected={!!selectedFabrics.find(f => (f.ref || f.id) === (mockupModalFabric.ref || mockupModalFabric.id))}
          onToggleSelect={(fabric) => {
            const id = fabric.ref || fabric.id;
            if (selectedFabrics.find(sf => (sf.ref || sf.id) === id)) {
              setSelectedFabrics(selectedFabrics.filter(sf => (sf.ref || sf.id) !== id));
            } else {
              setSelectedFabrics([...selectedFabrics, fabric]);
            }
          }}
          onClose={() => setMockupModalFabric(null)}
        />
      )}

      {techpackModalFabric && (
        <TechpackModal
          fabric={techpackModalFabric}
          onClose={() => setTechpackModalFabric(null)}
        />
      )}
    </div>
  );
};
