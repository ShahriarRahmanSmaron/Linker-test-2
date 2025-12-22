import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Package,
  Star,
  FileText,
  MapPin,
  Truck,
  MessageSquare,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  Layers,
  Menu,
  ChevronLeft,
  Send,
  TrendingUp,
  Upload
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { FabricUploadForm } from './FabricUploadForm';
import { FabricTable } from './FabricTable';
import { FabricPreviewCard } from './FabricPreviewCard';
import { ConfirmDialog } from './ConfirmDialog';
import { StatusToast } from './StatusToast';
import { ManufacturerFabric } from '../../types';

// Types
interface ManufacturerDashboardData {
  manufacturer_dashboard: {
    stats: {
      live_opportunities: number;
      pending_samples: number;
      rating: number;
    };
    opportunity_feed: Opportunity[];
    my_bids: Bid[];
    sample_fulfillment: SampleFulfillment[];
    admin_communication: AdminCommunication;
  };
}

interface Opportunity {
  rfq_id: string;
  buyer_category: string;
  fabric_request: string;
  quantity: string;
  target_price: string;
  action: string;
}

interface Bid {
  rfq_id: string;
  status: string;
  buyer_interest: string;
}

interface SampleFulfillment {
  sample_order_id: string;
  fabric_ref: string;
  buyer_location: string;
  status: string;
  actions: Action[];
}

interface Action {
  label: string;
  required_input: string[];
}

interface AdminCommunication {
  notices: string[];
  support_chat: SupportThread[];
}

interface SupportThread {
  thread_id: string;
  subject: string;
  messages: Message[];
}

interface Message {
  sender: string;
  text: string;
}

type DashboardView = 'dashboard' | 'opportunities' | 'bids' | 'samples' | 'communication' | 'upload-fabric';

// Mock data
const MOCK_DATA: ManufacturerDashboardData = {
  manufacturer_dashboard: {
    stats: {
      live_opportunities: 12,
      pending_samples: 4,
      rating: 4.8
    },
    opportunity_feed: [
      {
        rfq_id: "RFQ-2024-99",
        buyer_category: "International Retailer",
        fabric_request: "100% Cotton Pique, 220GSM, Red",
        quantity: "2000 kg",
        target_price: "$4.00 - $5.00",
        action: "submit_attendance_bid"
      }
    ],
    my_bids: [
      {
        rfq_id: "RFQ-2024-85",
        status: "SHORTLISTED",
        buyer_interest: "HIGH"
      }
    ],
    sample_fulfillment: [
      {
        sample_order_id: "SMP-500",
        fabric_ref: "MK-2024-001",
        buyer_location: "Gulshan 2, Dhaka",
        status: "PROCESSING",
        actions: [
          {
            label: "Mark Shipped",
            required_input: ["tracking_number", "courier_name"]
          }
        ]
      }
    ],
    admin_communication: {
      notices: ["Please update your stock for Fabric F-22."],
      support_chat: [
        {
          thread_id: "T-55",
          subject: "Payment for Sample SMP-44",
          messages: [
            { sender: "ME", text: "When will the escrow be released?" },
            { sender: "ADMIN", text: "Once the buyer confirms receipt, within 24 hours." }
          ]
        }
      ]
    }
  }
};

// Initial dummy fabrics data
const INITIAL_FABRICS: ManufacturerFabric[] = [
  {
    id: 1,
    fabricCode: 'MK-2024-001',
    fabricName: 'Premium Cotton Pique',
    fabrication: 'Pique',
    fabricType: '100% Cotton',
    gsm: 220,
    composition: '100% Cotton',
    category: ['Men', 'Unisex'],
    season: 'All Season',
    certifications: ['GOTS', 'OEKO-TEX'],
    minOrderQty: 500,
    leadTime: 30,
    priceRange: '4.2-4.8 USD/kg',
    colorways: 'Black, White, Navy, Grey',
    notes: 'Premium quality with mercerized finish',
    swatchImageUrl: '',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    fabricCode: 'MK-2024-002',
    fabricName: 'Soft Fleece',
    fabrication: 'Fleece',
    fabricType: 'CVC',
    gsm: 280,
    composition: '60% Cotton / 40% Polyester',
    category: ['Men', 'Women'],
    season: 'Fall/Winter',
    certifications: ['BCI'],
    minOrderQty: 300,
    leadTime: 25,
    priceRange: '3.8-4.2 USD/kg',
    colorways: 'Charcoal, Burgundy, Olive',
    notes: 'Brushed inner surface for warmth',
    swatchImageUrl: '',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    fabricCode: 'MK-2024-003',
    fabricName: 'Lightweight Jersey',
    fabrication: 'Single Jersey',
    fabricType: 'Cotton Spandex',
    gsm: 150,
    composition: '95% Cotton / 5% Spandex',
    category: ['Women', 'Kids'],
    season: 'Spring/Summer',
    certifications: [],
    minOrderQty: 200,
    leadTime: 20,
    priceRange: '4.5-5.0 USD/kg',
    colorways: 'Pastel Pink, Sky Blue, Mint Green',
    notes: 'Stretchable and breathable',
    swatchImageUrl: '',
    isActive: false,
    createdAt: new Date().toISOString()
  }
];

export const ManufacturerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data] = useState<ManufacturerDashboardData>(MOCK_DATA);
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleFulfillment | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');

  // Upload Fabric State
  const [fabrics, setFabrics] = useState<ManufacturerFabric[]>(INITIAL_FABRICS);
  const [editingFabric, setEditingFabric] = useState<ManufacturerFabric | null>(null);
  const [currentFormData, setCurrentFormData] = useState<Partial<ManufacturerFabric>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; fabricId: string | number | null }>({
    isOpen: false,
    fabricId: null
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'SHORTLISTED': { label: 'Shortlisted', variant: 'default' },
      'PROCESSING': { label: 'Processing', variant: 'secondary' },
      'SHIPPED': { label: 'Shipped', variant: 'default' },
      'DELIVERED': { label: 'Delivered', variant: 'default' },
      'HIGH': { label: 'High Interest', variant: 'default' },
      'MEDIUM': { label: 'Medium Interest', variant: 'secondary' },
      'LOW': { label: 'Low Interest', variant: 'outline' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const handleMarkShipped = (sample: SampleFulfillment) => {
    setSelectedSample(sample);
    setShippingDialogOpen(true);
  };

  const handleSubmitShipping = () => {
    if (trackingNumber && courierName) {
      // Handle shipping submission
      console.log('Shipping submitted:', { trackingNumber, courierName, sample: selectedSample });
      setShippingDialogOpen(false);
      setTrackingNumber('');
      setCourierName('');
      setSelectedSample(null);
    }
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
    { id: 'dashboard' as DashboardView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'opportunities' as DashboardView, label: 'Opportunities', icon: Briefcase },
    { id: 'bids' as DashboardView, label: 'My Bids', icon: FileText },
    { id: 'samples' as DashboardView, label: 'Samples', icon: Package },
    { id: 'communication' as DashboardView, label: 'Communication', icon: MessageSquare },
    { id: 'upload-fabric' as DashboardView, label: 'Upload Fabric', icon: Upload },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
              <p className="text-neutral-500">Overview of your opportunities, bids, and samples</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Live Opportunities</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.manufacturer_dashboard.stats.live_opportunities}</p>
                  </div>
                  <div className="p-3 bg-primary-50 rounded-full">
                    <Briefcase className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Pending Samples</p>
                    <p className="text-3xl font-bold text-neutral-900">{data.manufacturer_dashboard.stats.pending_samples}</p>
                  </div>
                  <div className="p-3 bg-accent-50 rounded-full">
                    <Package className="w-6 h-6 text-accent-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-neutral-900">{data.manufacturer_dashboard.stats.rating}</p>
                      <Star className="w-5 h-5 fill-warning-400 text-warning-400" />
                    </div>
                  </div>
                  <div className="p-3 bg-warning-50 rounded-full">
                    <Star className="w-6 h-6 text-warning-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Overview Sections */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Opportunities */}
              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-neutral-900">Recent Opportunities</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveView('opportunities')}>View All</Button>
                </div>
                <div className="space-y-4">
                  {data.manufacturer_dashboard.opportunity_feed.slice(0, 2).map((opp) => (
                    <div key={opp.rfq_id} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-semibold text-neutral-900">{opp.rfq_id}</span>
                        <Badge variant="outline" className="text-xs">{opp.buyer_category}</Badge>
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">{opp.fabric_request}</p>
                      <p className="text-xs text-neutral-500">Qty: {opp.quantity} • Price: {opp.target_price}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* My Bids */}
              <Card className="p-6 bg-white border border-neutral-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-neutral-900">My Bids</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveView('bids')}>View All</Button>
                </div>
                <div className="space-y-4">
                  {data.manufacturer_dashboard.my_bids.map((bid) => (
                    <div key={bid.rfq_id} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-neutral-900">{bid.rfq_id}</span>
                        {getStatusBadge(bid.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-neutral-500">Buyer Interest:</span>
                        {getStatusBadge(bid.buyer_interest)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Admin Notices */}
            {data.manufacturer_dashboard.admin_communication.notices.length > 0 && (
              <Card className="p-6 bg-warning-50 border border-warning-200">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-warning-900 mb-2">Admin Notices</h3>
                    <ul className="space-y-1">
                      {data.manufacturer_dashboard.admin_communication.notices.map((notice, idx) => (
                        <li key={idx} className="text-sm text-warning-800">{notice}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 'opportunities':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Opportunity Feed</h1>
              <p className="text-neutral-500">Browse and bid on available RFQs</p>
            </div>

            <div className="space-y-4">
              {data.manufacturer_dashboard.opportunity_feed.map((opp) => (
                <Card key={opp.rfq_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">{opp.rfq_id}</h3>
                        <Badge variant="outline" className="text-xs">{opp.buyer_category}</Badge>
                      </div>
                      <p className="text-sm text-neutral-700 mb-2 font-medium">{opp.fabric_request}</p>
                      <div className="flex gap-4 text-sm text-neutral-500">
                        <span>Quantity: <span className="font-semibold text-neutral-700">{opp.quantity}</span></span>
                        <span>Target Price: <span className="font-semibold text-neutral-700">{opp.target_price}</span></span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => console.log('Submit bid for', opp.rfq_id)}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Submit Bid
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'bids':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">My Bids</h1>
              <p className="text-neutral-500">Track your submitted bids and their status</p>
            </div>

            <div className="space-y-4">
              {data.manufacturer_dashboard.my_bids.map((bid) => (
                <Card key={bid.rfq_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">{bid.rfq_id}</h3>
                        {getStatusBadge(bid.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm text-neutral-500">Buyer Interest:</span>
                        {getStatusBadge(bid.buyer_interest)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'samples':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Sample Fulfillment</h1>
              <p className="text-neutral-500">Manage sample orders and shipping</p>
            </div>

            <div className="space-y-4">
              {data.manufacturer_dashboard.sample_fulfillment.map((sample) => (
                <Card key={sample.sample_order_id} className="p-6 bg-white border border-neutral-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">{sample.fabric_ref}</h3>
                        {getStatusBadge(sample.status)}
                      </div>
                      <p className="text-sm text-neutral-500 mb-1">Order ID: {sample.sample_order_id}</p>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mt-2">
                        <MapPin className="w-4 h-4" />
                        <span>{sample.buyer_location}</span>
                      </div>
                    </div>
                  </div>

                  {sample.actions && sample.actions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      {sample.actions.map((action, idx) => (
                        <Button
                          key={idx}
                          onClick={() => handleMarkShipped(sample)}
                          className="flex items-center gap-2"
                        >
                          <Truck className="w-4 h-4" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );

      case 'communication':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Admin Communication</h1>
              <p className="text-neutral-500">Notices and support chat</p>
            </div>

            {/* Notices */}
            {data.manufacturer_dashboard.admin_communication.notices.length > 0 && (
              <Card className="p-6 bg-warning-50 border border-warning-200">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-warning-900 mb-3">Notices</h3>
                    <ul className="space-y-2">
                      {data.manufacturer_dashboard.admin_communication.notices.map((notice, idx) => (
                        <li key={idx} className="text-sm text-warning-800 flex items-start gap-2">
                          <span className="text-warning-600 mt-1">•</span>
                          <span>{notice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Support Chat */}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Support Chat</h2>
              <div className="space-y-4">
                {data.manufacturer_dashboard.admin_communication.support_chat.map((thread) => (
                  <Card key={thread.thread_id} className="p-6 bg-white border border-neutral-200">
                    <h3 className="font-semibold text-neutral-900 mb-4">{thread.subject}</h3>
                    <div className="space-y-3">
                      {thread.messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.sender === 'ME' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'ME'
                                ? 'bg-primary-600 text-white'
                                : 'bg-neutral-100 text-neutral-900'
                              }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          className="flex-1"
                        />
                        <Button>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 'upload-fabric':
        const filteredFabrics = fabrics.filter(f =>
          f.fabricCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.fabricName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Upload Fabric</h1>
              <p className="text-neutral-500">Upload and manage your fabric catalog</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column - Upload Form */}
              <div className="space-y-6">
                <FabricUploadForm
                  initialData={editingFabric}
                  onFormChange={(data) => setCurrentFormData(data)}
                  onSave={(formData) => {
                    if (editingFabric) {
                      // Update existing fabric
                      setFabrics(fabrics.map(f =>
                        f.id === editingFabric.id
                          ? { ...f, ...formData, updatedAt: new Date().toISOString() } as ManufacturerFabric
                          : f
                      ));
                      setToast({ message: 'Fabric updated successfully.', type: 'success', visible: true });
                    } else {
                      // Create new fabric
                      const newFabric: ManufacturerFabric = {
                        id: Date.now(),
                        fabricCode: formData.fabricCode || '',
                        fabricName: formData.fabricName || '',
                        fabrication: formData.fabrication || 'Single Jersey',
                        fabricType: formData.fabricType || '100% Cotton',
                        gsm: formData.gsm || 180,
                        composition: formData.composition || '',
                        category: formData.category || [],
                        season: formData.season || 'All Season',
                        certifications: formData.certifications || [],
                        minOrderQty: formData.minOrderQty || null,
                        leadTime: formData.leadTime || null,
                        priceRange: formData.priceRange || null,
                        colorways: formData.colorways || null,
                        notes: formData.notes || null,
                        swatchImageUrl: formData.swatchImageUrl || '',
                        isActive: formData.isActive !== undefined ? formData.isActive : true,
                        createdAt: new Date().toISOString()
                      };
                      setFabrics([...fabrics, newFabric]);
                      setToast({ message: 'Fabric saved successfully.', type: 'success', visible: true });
                    }
                    setEditingFabric(null);
                    setCurrentFormData({});
                  }}
                  onCancelEdit={() => {
                    setEditingFabric(null);
                    setCurrentFormData({});
                  }}
                />
              </div>

              {/* Right Column - Preview & Table */}
              <div className="space-y-6">
                {/* Preview Card */}
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 mb-4">Live Preview</h2>
                  <FabricPreviewCard data={editingFabric || currentFormData} />
                </div>

                {/* Fabric Table */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-neutral-900">Your Fabrics ({filteredFabrics.length})</h2>
                    <Input
                      type="text"
                      placeholder="Search by code or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <FabricTable
                    fabrics={filteredFabrics}
                    onEdit={(fabric) => setEditingFabric(fabric)}
                    onDelete={(id) => setConfirmDialog({ isOpen: true, fabricId: id })}
                    onToggleStatus={(id) => {
                      setFabrics(fabrics.map(f =>
                        f.id === id ? { ...f, isActive: !f.isActive } : f
                      ));
                      setToast({ message: 'Fabric status updated.', type: 'success', visible: true });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

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
              <div className="p-2 bg-accent-50 rounded-lg">
                <Layers className="w-6 h-6 text-accent-600" />
              </div>
              <span className="text-xl font-bold text-neutral-900">Fab-Ai</span>
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
        )}

        {/* User Info & Logout */}
        {sidebarOpen && (
          <div className="p-4 border-t border-neutral-200">
            <div className="mb-3 p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1 whitespace-nowrap">Logged in as</p>
              <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name || 'Manufacturer'}</p>
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
                <p className="text-sm text-neutral-500">Welcome back, {user?.name || 'Manufacturer'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Shipping Dialog */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1 block">Tracking Number</label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1 block">Courier Name</label>
              <Input
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="Enter courier name"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShippingDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitShipping} disabled={!trackingNumber || !courierName}>
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Fabric"
        message="Are you sure you want to delete this fabric? This action cannot be undone."
        onConfirm={() => {
          if (confirmDialog.fabricId) {
            setFabrics(fabrics.filter(f => f.id !== confirmDialog.fabricId));
            setToast({ message: 'Fabric deleted successfully.', type: 'success', visible: true });
            setConfirmDialog({ isOpen: false, fabricId: null });
          }
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, fabricId: null })}
      />

      {/* Status Toast */}
      <StatusToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
};
