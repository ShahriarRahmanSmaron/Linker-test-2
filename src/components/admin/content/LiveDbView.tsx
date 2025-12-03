import React, { useState, useEffect } from 'react';
import { AdminFabric } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Trash2, Archive } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface LiveDbViewProps {
    onEdit: (fabric: AdminFabric) => void;
}

export const LiveDbView: React.FC<LiveDbViewProps> = ({ onEdit }) => {
    const [fabrics, setFabrics] = useState<AdminFabric[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFabrics = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/fabrics?status=LIVE');
            if (response.ok) {
                const data = await response.json();
                setFabrics(data);
            } else {
                toast.error('Failed to fetch live fabrics');
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

    const handleUnpublish = async (id: number) => {
        try {
            const response = await api.put(`/admin/fabric/${id}`, { status: 'PENDING_REVIEW' });

            if (response.ok) {
                toast.success('Fabric unpublished (moved to Staging)');
                fetchFabrics();
            } else {
                toast.error('Failed to unpublish fabric');
            }
        } catch (error) {
            toast.error('Error updating fabric');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this fabric? This cannot be undone.')) return;

        try {
            const response = await api.delete(`/admin/fabric/${id}`);

            if (response.ok) {
                toast.success('Fabric deleted');
                fetchFabrics();
            } else {
                toast.error('Failed to delete fabric');
            }
        } catch (error) {
            toast.error('Error deleting fabric');
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Live Database ({fabrics.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center p-8">Loading...</div>
                ) : fabrics.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                        No live fabrics found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Ref ID</th>
                                    <th className="px-4 py-3">Fabrication</th>
                                    <th className="px-4 py-3">Owner</th>
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
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                {fabric.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => onEdit(fabric)}>
                                                <Eye className="h-4 w-4 mr-1" /> Edit
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => handleUnpublish(fabric.id)}>
                                                <Archive className="h-4 w-4 mr-1" /> Unpublish
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(fabric.id)}>
                                                <Trash2 className="h-4 w-4 mr-1" /> Delete
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
