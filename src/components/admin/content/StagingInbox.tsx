import React, { useState, useEffect } from 'react';
import { AdminFabric } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface StagingInboxProps {
    onReview: (fabric: AdminFabric) => void;
}

export const StagingInbox: React.FC<StagingInboxProps> = ({ onReview }) => {
    const [fabrics, setFabrics] = useState<AdminFabric[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFabrics = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/fabrics?status=PENDING_REVIEW');
            if (response.ok) {
                const data = await response.json();
                setFabrics(data);
            } else {
                toast.error('Failed to fetch staging fabrics');
            }
        } catch (error) {
            toast.error('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFabrics();
    }, []);

    const handleQuickApprove = async (id: number) => {
        try {
            const response = await api.put(`/admin/fabric/${id}`, { status: 'LIVE' });

            if (response.ok) {
                toast.success('Fabric approved and published!');
                fetchFabrics(); // Refresh list
            } else {
                toast.error('Failed to approve fabric');
            }
        } catch (error) {
            toast.error('Error updating fabric');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Are you sure you want to reject (delete) this fabric?')) return;

        try {
            const response = await api.delete(`/admin/fabric/${id}`);

            if (response.ok) {
                toast.success('Fabric rejected and removed.');
                fetchFabrics();
            } else {
                toast.error('Failed to reject fabric');
            }
        } catch (error) {
            toast.error('Error deleting fabric');
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Staging Inbox ({fabrics.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : fabrics.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                        No fabrics pending review.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Ref ID</th>
                                    <th className="px-4 py-3">Fabrication</th>
                                    <th className="px-4 py-3">Uploaded By</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fabrics.map((fabric) => (
                                    <tr key={fabric.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{fabric.ref}</td>
                                        <td className="px-4 py-3">{fabric.fabrication}</td>
                                        <td className="px-4 py-3">{fabric.owner_name}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                {fabric.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => onReview(fabric)}>
                                                <Eye className="h-4 w-4 mr-1" /> Review
                                            </Button>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleQuickApprove(fabric.id)}>
                                                <Check className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleReject(fabric.id)}>
                                                <X className="h-4 w-4 mr-1" /> Reject
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
