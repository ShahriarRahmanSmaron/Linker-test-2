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
import { SidebarFilters } from '../SidebarFilters';
import { SearchFabricCard } from '../SearchFabricCard';
import { SelectionPanel } from '../SelectionPanel';
import { MockupModal } from '../MockupModal';
import { TechpackModal } from '../TechpackModal';
import { Fabric, FabricFilter } from '../../types';
import { BuyerTopbar } from './BuyerTopbar';

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
      company: "Fab-Ai",
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

  // Search/Fabric Library State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FabricFilter>({ fabrication: '', type: '', gsmRange: '' });
  const [selectedFabrics, setSelectedFabrics] = useState<Fabric[]>([]);
  const [mockupModalFabric, setMockupModalFabric] = useState<Fabric | null>(null);
  const [techpackModalFabric, setTechpackModalFabric] = useState<Fabric | null>(null);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);


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
          <div>
            {/* Hero Section */}
            <div className="bg-[#111827] text-white py-16 px-4 sm:px-6 lg:px-8 font-display">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: Headline */}
                <div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                    Discover, Visualize, <br className="hidden lg:block" />
                    source fabrics—smarter.
                  </h1>
                </div>

                {/* Right: Search & Action */}
                <div className="flex flex-col gap-4">
                  <p className="text-xl sm:text-2xl text-white font-medium">
                    View Fabrics <span className="text-[#2563EB] font-bold">Smartly</span>
                  </p>

                  <div className="relative w-full max-w-xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-11 pr-4 py-4 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base shadow-lg"
                      placeholder="Search fabrics by name, composition, or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Feature Points */}
                  <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-300">Search or Filter Fabrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-300">Open Fabric Viewer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-300">Generate Mockup or Moodboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-300">Download Image or Techpack</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col lg:flex-row">
                {/* Left Sidebar */}
                <aside className="w-full lg:w-64 flex-shrink-0 mb-8 lg:mb-0">
                  <SidebarFilters
                    filters={filters}
                    setFilters={setFilters}
                    totalResults={totalResults}
                  />
                </aside>

                {/* Divider Line */}
                <div className="hidden lg:block w-px bg-neutral-200 mx-8 self-stretch" />

                {/* Right Content Grid */}
                <div className="flex-1">
                  {fabrics.length > 0 && (
                    <div className="flex justify-end items-center mb-4">
                      <span className="text-sm font-medium text-neutral-500">
                        {totalResults} Fabrics
                      </span>
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
                      <p className="text-neutral-500 font-medium">No fabrics found</p>
                    </div>
                  )}

                  {isLoading && fabrics.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
                      <p className="text-neutral-500 mt-4">Searching fabrics...</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                    <div className="text-center py-8">
                      <Button onClick={handleLoadMore} variant="outline" disabled={isLoading} className="min-w-[200px]">
                        {isLoading ? 'Loading...' : 'Load More Fabrics'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-6">Request for Quotations</h1>
            <div className="space-y-4">
              {data.buyer_dashboard.rfq_management.active_rfqs.map((rfq) => (
                <Card key={rfq.rfq_id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{rfq.title}</h3>
                      <p className="text-sm text-neutral-500">Posted on {rfq.posted_date}</p>
                    </div>
                    {getStatusBadge(rfq.status)}
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Manufacturer Bids</h4>
                    {rfq.manufacturer_bids.map((bid) => (
                      <div key={bid.manufacturer_id} className="bg-neutral-50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{bid.manufacturer_name}</p>
                          <p className="text-sm text-neutral-500">{bid.stock_status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{bid.bid_price}</p>
                          {bid.can_request_sample && (
                            <Button size="sm" variant="outline" className="mt-1">Request Sample</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'samples':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-6">Sample Orders</h1>
            <div className="space-y-4">
              {data.buyer_dashboard.sample_orders.map((order) => (
                <Card key={order.order_id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{order.order_id}</h3>
                      <p className="text-sm text-neutral-500">{order.items.join(', ')}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Tracking Timeline</h4>
                    <div className="space-y-4">
                      {order.tracking_timeline?.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className={`mt-1 w-2 h-2 rounded-full ${event.completed ? 'bg-green-500' : 'bg-neutral-300'}`} />
                          <div>
                            <p className="text-sm font-medium">{event.status}</p>
                            <p className="text-xs text-neutral-500">{event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Pending'}</p>
                            {event.details && <p className="text-xs text-neutral-500 mt-1">{event.details}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'workspace':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-6">Private Workspace</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.buyer_dashboard.private_workspace.saved_mockups.map((mockup) => (
                <Card key={mockup.id} className="overflow-hidden">
                  <div className="aspect-square bg-neutral-100 relative">
                    {/* Placeholder for mockup image */}
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{mockup.name}</h3>
                    <p className="text-sm text-neutral-500 mb-4">{mockup.garment_type}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="w-full">Download</Button>
                      <Button size="sm" variant="outline" className="w-full">Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Support Inbox</h1>
              <Button>New Message</Button>
            </div>
            <div className="space-y-4">
              {data.buyer_dashboard.support_inbox.active_threads.map((thread) => (
                <Card key={thread.thread_id} className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="p-2 bg-neutral-100 rounded-full h-fit">
                        <MessageSquare className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{thread.subject}</h3>
                        <p className="text-sm text-neutral-600 mt-1">{thread.last_message}</p>
                        <p className="text-xs text-neutral-400 mt-2">To: {thread.recipient}</p>
                      </div>
                    </div>
                    {getStatusBadge(thread.status)}
                  </div>
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
    <div className="min-h-screen bg-[#F9F9F7]">
      <BuyerTopbar
        activeView={activeView}
        onNavigate={(view) => setActiveView(view as DashboardView)}
        menuItems={menuItems}
      />

      {renderContent()}

      {/* Selection Panel */}
      <SelectionPanel
        selectedFabrics={selectedFabrics}
        onClear={() => setSelectedFabrics([])}
        onRemove={(id) => setSelectedFabrics(selectedFabrics.filter(f => (f.ref || f.id) !== id))}
        onGenerateMockup={() => {
          if (selectedFabrics.length > 0) {
            setMockupModalFabric(selectedFabrics[0]);
          }
        }}
        onGenerateTechpack={() => {
          if (selectedFabrics.length > 0) {
            setTechpackModalFabric(selectedFabrics[0]);
          }
        }}
      />

      {/* Modals */}
      {mockupModalFabric && (
        <MockupModal
          isOpen={!!mockupModalFabric}
          onClose={() => setMockupModalFabric(null)}
          fabric={mockupModalFabric}
        />
      )}

      {techpackModalFabric && (
        <TechpackModal
          isOpen={!!techpackModalFabric}
          onClose={() => setTechpackModalFabric(null)}
          fabric={techpackModalFabric}
        />
      )}
    </div>
  );
};
