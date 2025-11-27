import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    Package,
    AlertTriangle,
    CheckCircle,
    XCircle,
    DollarSign,
    LogOut,
    MoreVertical,
    Search
} from 'lucide-react';

// Types based on the JSON structure
interface PendingRFQ {
    rfq_id: string;
    buyer_name: string;
    content: string;
    risk_flag: boolean;
    actions: string[];
}

interface PendingFabricListing {
    fabric_id: string;
    manufacturer: string;
    images: string[];
    actions: string[];
}

interface PendingMessage {
    thread_id: string;
    sender: string;
    recipient: string;
    content_preview: string;
    system_flag: string;
    actions: string[];
}

interface FinancialOverview {
    escrow_balance: number;
    pending_payouts: number;
    sample_revenue: number;
}

interface AdminData {
    moderation_queue: {
        pending_rfqs: PendingRFQ[];
        pending_fabric_listings: PendingFabricListing[];
        pending_messages: PendingMessage[];
    };
    financial_overview: FinancialOverview;
    active_disputes: any[];
}

// Mock Data
const MOCK_ADMIN_DATA: AdminData = {
    moderation_queue: {
        pending_rfqs: [
            {
                rfq_id: "RFQ-2024-92",
                buyer_name: "Zara Buying House",
                content: "Need 100% Nylon... [content]",
                risk_flag: false,
                actions: ["approve", "reject", "edit"]
            }
        ],
        pending_fabric_listings: [
            {
                fabric_id: "F-552",
                manufacturer: "Global Tex",
                images: ["/temp/img1.jpg"],
                actions: ["approve_listing", "reject_quality"]
            }
        ],
        pending_messages: [
            {
                thread_id: "MSG-404",
                sender: "Manufacturer A",
                recipient: "Buyer B",
                content_preview: "We can offer a discount if you pay outside Linker...",
                system_flag: "Potential disintermediation risk",
                actions: ["approve_send", "block_message"]
            }
        ]
    },
    financial_overview: {
        escrow_balance: 1500.00,
        pending_payouts: 450.00,
        sample_revenue: 150.00
    },
    active_disputes: []
};

export const AdminDashboard: React.FC = () => {
    const { logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'moderation' | 'financial' | 'disputes'>('moderation');

    // State for moderation sub-tabs
    const [moderationTab, setModerationTab] = useState<'rfqs' | 'fabrics' | 'messages'>('rfqs');

    const data = MOCK_ADMIN_DATA;

    return (
        <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-50 p-2 rounded-lg">
                            <LayoutDashboard className="h-6 w-6 text-red-600" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-neutral-900">
                            Linker <span className="text-red-600">Admin</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full">
                            {user?.email || 'admin@linker.com'}
                        </div>
                        <button
                            onClick={logout}
                            className="text-neutral-400 hover:text-red-600 transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={64} className="text-green-600" />
                        </div>
                        <p className="text-neutral-500 font-medium mb-1">Escrow Balance</p>
                        <h3 className="text-3xl font-bold text-neutral-900">${data.financial_overview.escrow_balance.toFixed(2)}</h3>
                        <div className="mt-4 text-xs font-medium text-green-600 bg-green-50 inline-block px-2 py-1 rounded">
                            +12% from last week
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Package size={64} className="text-blue-600" />
                        </div>
                        <p className="text-neutral-500 font-medium mb-1">Pending Payouts</p>
                        <h3 className="text-3xl font-bold text-neutral-900">${data.financial_overview.pending_payouts.toFixed(2)}</h3>
                        <div className="mt-4 text-xs font-medium text-neutral-500 bg-neutral-100 inline-block px-2 py-1 rounded">
                            48h processing time
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText size={64} className="text-purple-600" />
                        </div>
                        <p className="text-neutral-500 font-medium mb-1">Sample Revenue</p>
                        <h3 className="text-3xl font-bold text-neutral-900">${data.financial_overview.sample_revenue.toFixed(2)}</h3>
                        <div className="mt-4 text-xs font-medium text-purple-600 bg-purple-50 inline-block px-2 py-1 rounded">
                            +5% this month
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1 space-y-2">
                        <button
                            onClick={() => setActiveTab('moderation')}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'moderation' ? 'bg-white shadow-md text-primary-600' : 'text-neutral-500 hover:bg-white/50'}`}
                        >
                            <AlertTriangle size={18} />
                            Moderation Queue
                            <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {data.moderation_queue.pending_rfqs.length + data.moderation_queue.pending_fabric_listings.length + data.moderation_queue.pending_messages.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'financial' ? 'bg-white shadow-md text-primary-600' : 'text-neutral-500 hover:bg-white/50'}`}
                        >
                            <DollarSign size={18} />
                            Financials
                        </button>
                        <button
                            onClick={() => setActiveTab('disputes')}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-all ${activeTab === 'disputes' ? 'bg-white shadow-md text-primary-600' : 'text-neutral-500 hover:bg-white/50'}`}
                        >
                            <XCircle size={18} />
                            Disputes
                            {data.active_disputes.length > 0 && (
                                <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {data.active_disputes.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Dashboard Content */}
                    <div className="lg:col-span-3">
                        {activeTab === 'moderation' && (
                            <div className="space-y-6">
                                <div className="flex gap-2 border-b border-neutral-200 pb-4 overflow-x-auto">
                                    <button
                                        onClick={() => setModerationTab('rfqs')}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${moderationTab === 'rfqs' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-100'}`}
                                    >
                                        Pending RFQs ({data.moderation_queue.pending_rfqs.length})
                                    </button>
                                    <button
                                        onClick={() => setModerationTab('fabrics')}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${moderationTab === 'fabrics' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-100'}`}
                                    >
                                        Fabric Listings ({data.moderation_queue.pending_fabric_listings.length})
                                    </button>
                                    <button
                                        onClick={() => setModerationTab('messages')}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${moderationTab === 'messages' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-100'}`}
                                    >
                                        Flagged Messages ({data.moderation_queue.pending_messages.length})
                                    </button>
                                </div>

                                {/* RFQs List */}
                                {moderationTab === 'rfqs' && (
                                    <div className="space-y-4">
                                        {data.moderation_queue.pending_rfqs.map((rfq) => (
                                            <div key={rfq.rfq_id} className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-500">{rfq.rfq_id}</span>
                                                            {rfq.risk_flag && <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle size={10} /> Risk</span>}
                                                        </div>
                                                        <h3 className="font-bold text-lg">{rfq.buyer_name}</h3>
                                                    </div>
                                                    <div className="text-sm text-neutral-400">Today, 10:23 AM</div>
                                                </div>
                                                <p className="text-neutral-600 mb-6 bg-neutral-50 p-4 rounded-lg text-sm">
                                                    {rfq.content}
                                                </p>
                                                <div className="flex gap-3 justify-end">
                                                    <button className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                                                        Edit Content
                                                    </button>
                                                    <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        Reject
                                                    </button>
                                                    <button className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-lg shadow-neutral-900/20">
                                                        Approve RFQ
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Fabrics List */}
                                {moderationTab === 'fabrics' && (
                                    <div className="space-y-4">
                                        {data.moderation_queue.pending_fabric_listings.map((fabric) => (
                                            <div key={fabric.fabric_id} className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 flex gap-6">
                                                <div className="w-32 h-32 bg-neutral-100 rounded-lg flex-shrink-0">
                                                    {/* Placeholder for image */}
                                                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                        <Package size={32} />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-500 mb-1 inline-block">{fabric.fabric_id}</span>
                                                            <h3 className="font-bold text-lg">{fabric.manufacturer}</h3>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 mt-8 justify-end">
                                                        <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            Reject Quality
                                                        </button>
                                                        <button className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-lg shadow-neutral-900/20">
                                                            Approve Listing
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Messages List */}
                                {moderationTab === 'messages' && (
                                    <div className="space-y-4">
                                        {data.moderation_queue.pending_messages.map((msg) => (
                                            <div key={msg.thread_id} className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 border-l-4 border-l-red-500">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle size={10} /> {msg.system_flag}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-bold">{msg.sender}</span>
                                                            <span className="text-neutral-400">to</span>
                                                            <span className="font-bold">{msg.recipient}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-neutral-600 mb-6 bg-red-50/50 p-4 rounded-lg text-sm font-medium">
                                                    "{msg.content_preview}"
                                                </p>
                                                <div className="flex gap-3 justify-end">
                                                    <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        Block Message
                                                    </button>
                                                    <button className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                                                        Allow & Send
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'financial' && (
                            <div className="bg-white rounded-xl p-12 text-center border border-neutral-200">
                                <div className="bg-neutral-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign size={32} className="text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900">Financial Details</h3>
                                <p className="text-neutral-500">Detailed financial reports and transaction history would appear here.</p>
                            </div>
                        )}

                        {activeTab === 'disputes' && (
                            <div className="bg-white rounded-xl p-12 text-center border border-neutral-200">
                                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-green-500" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900">No Active Disputes</h3>
                                <p className="text-neutral-500">Great job! There are currently no active disputes requiring attention.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
