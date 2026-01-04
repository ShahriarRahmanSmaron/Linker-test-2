import React, { useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from './ui/dialog';
import { Button } from './ui/button';
import { api } from '../lib/api';

interface TechpackPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    mockupData: {
        face?: string;
        back?: string;
        single?: string;
    };
    fabricRef: string;
    garmentName: string;
}

interface TechpackFormData {
    style: string;
    buyer: string;
    size: string;
    gender: string;
    sampleStatus: string;
    season: string;
    styleName: string;
    designSource: string;
}

export const TechpackPromptModal: React.FC<TechpackPromptModalProps> = ({
    isOpen,
    onClose,
    mockupData,
    fabricRef,
    garmentName,
}) => {
    const [formData, setFormData] = useState<TechpackFormData>({
        style: '',
        buyer: '',
        size: 'M',
        gender: '',
        sampleStatus: '',
        season: '',
        styleName: '',
        designSource: 'Internal',
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setError(null);

        try {
            const response = await api.post('/generate-techpack', {
                fabric_ref: fabricRef,
                garment_name: garmentName,
                mockup_urls: mockupData,
                form_data: formData,
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Techpack_${fabricRef}_${garmentName}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to generate techpack');
            }
        } catch (err) {
            console.error('Error generating techpack:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const inputClass =
        'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogOverlay className="bg-black/60" onClick={onClose} />
            <DialogContent
                className="max-w-md w-full p-0 overflow-hidden border-0 bg-white rounded-2xl shadow-2xl [&>button]:hidden"
                hideOverlay={true}
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Techpack Details</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-gray-200"
                    >
                        <X size={18} />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Style</label>
                            <input
                                type="text"
                                name="style"
                                value={formData.style}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g., ST-001"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Gender</label>
                            <input
                                type="text"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g., Men"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Buyer</label>
                            <input
                                type="text"
                                name="buyer"
                                value={formData.buyer}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g., H&M"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Size</label>
                            <input
                                type="text"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g., M"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Sample Status</label>
                            <input
                                type="text"
                                name="sampleStatus"
                                value={formData.sampleStatus}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g., Proto"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Style Name</label>
                            <input
                                type="text"
                                name="styleName"
                                value={formData.styleName}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g., Classic Polo"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Season</label>
                            <input
                                type="text"
                                name="season"
                                value={formData.season}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g., SS25"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Design Source</label>
                            <input
                                type="text"
                                name="designSource"
                                value={formData.designSource}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g., Internal"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Download Techpack'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
