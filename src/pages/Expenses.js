import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import { Plus, Receipt, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { showToast } from '../utils/toast';

const Expenses = () => {
    const [expenses, setExpenses] = useState([
        {
            id: '1',
            employeeName: 'John Doe',
            category: 'Travel',
            amount: 5500,
            currency: 'INR',
            date: '2026-01-25',
            description: 'Client meeting in Mumbai',
            receiptUrl: '#',
            status: 'Pending',
            submittedDate: '2026-01-26',
        },
        {
            id: '2',
            employeeName: 'Sarah Smith',
            category: 'Food & Meals',
            amount: 1200,
            currency: 'INR',
            date: '2026-01-24',
            description: 'Team lunch',
            receiptUrl: '#',
            status: 'Approved',
            submittedDate: '2026-01-25',
        },
        {
            id: '3',
            employeeName: 'Mike Johnson',
            category: 'Office Supplies',
            amount: 3400,
            currency: 'INR',
            date: '2026-01-23',
            description: 'Stationery and equipment',
            receiptUrl: '#',
            status: 'Reimbursed',
            submittedDate: '2026-01-24',
        },
    ]);

    const getStatusColor = (status) => {
        const colors = {
            Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            Reimbursed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        };
        return colors[status] || colors.Pending;
    };

    const getStatusIcon = (status) => {
        const icons = {
            Pending: Clock,
            Approved: CheckCircle,
            Rejected: XCircle,
            Reimbursed: DollarSign,
        };
        return icons[status] || Clock;
    };

    const stats = {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        pending: expenses.filter((e) => e.status === 'Pending').length,
        approved: expenses.filter((e) => e.status === 'Approved').length,
        reimbursed: expenses.filter((e) => e.status === 'Reimbursed').length,
    };

    const handleApprove = (id) => {
        setExpenses(expenses.map((e) =>
            e.id === id ? { ...e, status: 'Approved' } : e
        ));
        showToast.success('Expense approved successfully');
    };

    const handleReject = (id) => {
        setExpenses(expenses.map((e) =>
            e.id === id ? { ...e, status: 'Rejected' } : e
        ));
        showToast.success('Expense rejected');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Expense Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track and approve employee expenses
                    </p>
                </div>
                <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Expense
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                ₹{stats.total.toLocaleString()}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.pending}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.approved}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Reimbursed</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.reimbursed}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-600" />
                    </div>
                </Card>
            </div>

            {/* Expense List */}
            <div className="grid grid-cols-1 gap-4">
                {expenses.map((expense) => {
                    const StatusIcon = getStatusIcon(expense.status);
                    return (
                        <Card key={expense.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <Receipt className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {expense.category}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(expense.status)}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {expense.status}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {expense.description}
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Employee</p>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {expense.employeeName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    ₹{expense.amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Expense Date</p>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(expense.submittedDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <a
                                                href={expense.receiptUrl}
                                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                            >
                                                View Receipt
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {expense.status === 'Pending' && (
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleApprove(expense.id)}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleReject(expense.id)}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Expenses;
