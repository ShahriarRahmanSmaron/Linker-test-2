import React, { useState, useEffect } from 'react';
import { AdminFabric } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface FabricEditorProps {
    fabric: AdminFabric;
    onClose: () => void;
    onSave: () => void;
}

interface Mill {
    id: number;
    name: string;
}

export const FabricEditor: React.FC<FabricEditorProps> = ({ fabric, onClose, onSave }) => {
    const [formData, setFormData] = useState<AdminFabric>({ ...fabric });
    const [mills, setMills] = useState<Mill[]>([]);
    const [metaData, setMetaData] = useState<{ key: string; value: string }[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Initialize metadata from JSON
        if (fabric.meta_data) {
            const meta = Object.entries(fabric.meta_data).map(([key, value]) => ({
                key,
                value: String(value),
            }));
            setMetaData(meta);
        }

        // Fetch mills
        const fetchMills = async () => {
            try {
                const response = await api.get('/admin/mills');
                if (response.ok) {
                    setMills(await response.json());
                }
            } catch (error) {
                console.error('Error fetching mills:', error);
            }
        };
        fetchMills();
    }, [fabric]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMetaChange = (index: number, field: 'key' | 'value', value: string) => {
        const newMeta = [...metaData];
        newMeta[index][field] = value;
        setMetaData(newMeta);
    };

    const addMetaRow = () => {
        setMetaData([...metaData, { key: '', value: '' }]);
    };

    const removeMetaRow = (index: number) => {
        setMetaData(metaData.filter((_, i) => i !== index));
    };

    const handleSave = async (publish: boolean = false) => {
        setSaving(true);
        try {
            // Convert metadata array back to object
            const metaObject: Record<string, any> = {};
            metaData.forEach((item) => {
                if (item.key.trim()) {
                    metaObject[item.key.trim()] = item.value;
                }
            });

            const payload = {
                ...formData,
                status: publish ? 'LIVE' : formData.status,
                meta_data: metaObject,
            };

            const response = await api.put(`/admin/fabric/${fabric.id}`, payload);

            if (response.ok) {
                toast.success(publish ? 'Fabric published!' : 'Draft saved successfully');
                onSave();
            } else {
                toast.error('Failed to save changes');
            }
        } catch (error) {
            toast.error('Error saving fabric');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Edit Fabric: {fabric.ref}</CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Standard Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Ref ID</Label>
                        <Input name="ref" value={formData.ref} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Fabric Group</Label>
                        <Input name="fabric_group" value={formData.fabric_group} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Fabrication</Label>
                        <Input name="fabrication" value={formData.fabrication} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Composition</Label>
                        <Input name="composition" value={formData.composition} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>GSM</Label>
                        <Input name="gsm" value={formData.gsm} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Width</Label>
                        <Input name="width" value={formData.width} onChange={handleChange} />
                    </div>
                </div>

                {/* Ownership */}
                <div className="space-y-2">
                    <Label>Manufacturer (Owner)</Label>
                    <Select
                        value={String(formData.manufacturer_id)}
                        onValueChange={(val) => setFormData({ ...formData, manufacturer_id: Number(val) })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Mill" />
                        </SelectTrigger>
                        <SelectContent>
                            {mills.map((mill) => (
                                <SelectItem key={mill.id} value={String(mill.id)}>
                                    {mill.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Dynamic Data */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Dynamic Data (Meta Data)</Label>
                        <Button variant="outline" size="sm" onClick={addMetaRow}>
                            <Plus className="h-4 w-4 mr-2" /> Add Field
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {metaData.map((row, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input
                                    placeholder="Key (e.g. Shrinkage)"
                                    value={row.key}
                                    onChange={(e) => handleMetaChange(index, 'key', e.target.value)}
                                    className="w-1/3"
                                />
                                <Input
                                    placeholder="Value (e.g. 5%)"
                                    value={row.value}
                                    onChange={(e) => handleMetaChange(index, 'value', e.target.value)}
                                    className="flex-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeMetaRow(index)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                    Save Draft
                </Button>
                <Button onClick={() => handleSave(true)} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" /> Publish to Search Engine
                </Button>
            </CardFooter>
        </Card>
    );
};
