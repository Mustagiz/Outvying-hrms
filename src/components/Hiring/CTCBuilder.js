import React, { useState, useEffect } from 'react';
import { Card, Input } from '../UI';

const CTCBuilder = ({ annualCTC, onChange }) => {
    const [breakdown, setBreakdown] = useState({
        monthlyCTC: 0,
        basic: 0,
        hra: 0,
        lta: 0,
        special: 0,
        pfEmployer: 1800,
        insurance: 500,
        professionalTax: 200,
    });

    useEffect(() => {
        const monthly = (annualCTC / 12);
        const inclusiveOfPF = monthly;

        // Simple standard Indian breakdown
        const basic = Math.round(inclusiveOfPF * 0.5);
        const hra = Math.round(basic * 0.4); // 40% of basic
        const lta = Math.round(basic * 0.1);

        const currentSum = basic + hra + lta + breakdown.pfEmployer + breakdown.insurance;
        const special = Math.max(0, Math.round(inclusiveOfPF - currentSum));

        const newBreakdown = {
            ...breakdown,
            monthlyCTC: Math.round(monthly),
            basic,
            hra,
            lta,
            special
        };

        setBreakdown(newBreakdown);
        if (onChange) onChange(newBreakdown);
    }, [annualCTC]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold">Annual CTC</p>
                    <p className="text-xl font-bold text-primary-600">₹{(annualCTC || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold">Monthly Gross</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">₹{breakdown.monthlyCTC.toLocaleString()}</p>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">Earnings (Monthly)</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between p-2 rounded bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800">
                        <span className="text-gray-500">Basic Salary</span>
                        <span className="font-medium">₹{breakdown.basic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800">
                        <span className="text-gray-500">HRA</span>
                        <span className="font-medium">₹{breakdown.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800">
                        <span className="text-gray-500">LTA</span>
                        <span className="font-medium">₹{breakdown.lta.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800">
                        <span className="text-gray-500">Special Allowance</span>
                        <span className="font-medium">₹{breakdown.special.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">Statutory & Other Benefits</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between p-2 rounded bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800">
                        <span className="text-gray-500">Employer PF</span>
                        <span className="font-medium">₹{breakdown.pfEmployer.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800">
                        <span className="text-gray-500">Insurance</span>
                        <span className="font-medium">₹{breakdown.insurance.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 italic font-medium">* This is an automated calculation based on standard percentage breakup.</p>
        </div>
    );
};

export default CTCBuilder;
