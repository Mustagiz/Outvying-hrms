import React, { useState } from 'react';
import TemplateManager from '../components/Hiring/TemplateManager';
import { Card, Button } from '../components/UI';
import { BookTemplate } from 'lucide-react';

const DocumentTemplates = () => {
    const [isManagerOpen, setIsManagerOpen] = useState(true);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">HR Document Templates</h1>
                    <p className="text-gray-500">Manage templates for Relieving Letters, Experience Certificates, and more.</p>
                </div>
            </div>

            <Card className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <BookTemplate size={32} />
                </div>
                <h2 className="text-xl font-semibold">Template Library</h2>
                <p className="text-gray-600 max-w-lg mx-auto">
                    This library allows you to create and manage standardized templates for various HR documents.
                    These templates can be used to generate official documents for employees.
                </p>
                <Button onClick={() => setIsManagerOpen(true)}>
                    Manage Templates
                </Button>
            </Card>

            <TemplateManager
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                collectionName="hrTemplates"
                title="HR Document Templates"
                categories={[
                    'Relieving Letter',
                    'Experience Certificate',
                    'Warning Letter',
                    'Appraisal Letter',
                    'General Policy',
                    'Promotion Letter',
                    'Termination Letter'
                ]}
            />
        </div>
    );
};

export default DocumentTemplates;
