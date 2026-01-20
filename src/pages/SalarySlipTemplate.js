import React, { useState } from 'react';
import { Card, Button, Modal } from '../components/UI';
import { Save, Eye, Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';

const SalarySlipTemplate = () => {
  const [template, setTemplate] = useState(() => {
    const saved = localStorage.getItem('salarySlipTemplate');
    return saved ? JSON.parse(saved) : {
      header: { logo: true, companyName: true, monthYear: true, employeeDetails: true },
      earnings: ['basic', 'hra', 'medical', 'transport', 'shift', 'attendance'],
      deductions: ['pf', 'ptax', 'tds'],
      summary: { workingDays: true, grossSalary: true, totalDeductions: true, netPay: true },
      visibility: { grossPay: true, deductions: true, netPay: true },
      footer: { signature: true, bankDetails: true, terms: true }
    };
  });

  const deductionReasons = [
    'LOP (Loss of Pay)', 'Income Tax / TDS', 'Professional Tax', 'Provident Fund',
    'Advance Recovery', 'Loan EMI', 'Other'
  ];

  const [showPreview, setShowPreview] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('');
  const [newComponent, setNewComponent] = useState('');

  const availableEarnings = [
    'basic', 'hra', 'medical', 'transport', 'shift', 'attendance',
    'bonus', 'overtime', 'special_allowance', 'conveyance'
  ];

  const availableDeductions = [
    'pf', 'esi', 'ptax', 'tds', 'loan', 'advance', 'other'
  ];

  const componentLabels = {
    basic: 'Basic Salary', hra: 'House Rent Allowance', medical: 'Medical Allowance',
    transport: 'Transport Allowance', shift: 'Shift Allowance', attendance: 'Attendance Allowance',
    bonus: 'Bonus', overtime: 'Overtime', special_allowance: 'Special Allowance',
    conveyance: 'Conveyance', pf: 'Provident Fund', esi: 'ESI', ptax: 'Professional Tax',
    tds: 'TDS', loan: 'Loan EMI', advance: 'Advance', other: 'Other Deductions'
  };

  const handleSave = () => {
    localStorage.setItem('salarySlipTemplate', JSON.stringify(template));
    alert('Template saved successfully');
  };

  const toggleHeader = (key) => {
    setTemplate({ ...template, header: { ...template.header, [key]: !template.header[key] } });
  };

  const toggleSummary = (key) => {
    setTemplate({ ...template, summary: { ...template.summary, [key]: !template.summary[key] } });
  };

  const toggleFooter = (key) => {
    setTemplate({ ...template, footer: { ...template.footer, [key]: !template.footer[key] } });
  };

  const toggleVisibility = (key) => {
    setTemplate({ ...template, visibility: { ...template.visibility, [key]: !template.visibility[key] } });
  };

  const removeComponent = (type, component) => {
    setTemplate({ ...template, [type]: template[type].filter(c => c !== component) });
  };

  const moveComponent = (type, index, direction) => {
    const arr = [...template[type]];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setTemplate({ ...template, [type]: arr });
  };

  const addComponent = () => {
    if (!newComponent) return;
    setTemplate({ ...template, [addType]: [...template[addType], newComponent] });
    setShowAddModal(false);
    setNewComponent('');
  };

  const openAddModal = (type) => {
    setAddType(type);
    setShowAddModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Salary Slip Template</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowPreview(true)} variant="secondary">
            <Eye size={18} className="inline mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave}>
            <Save size={18} className="inline mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Header Section">
          <div className="space-y-2">
            {Object.keys(template.header).map(key => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.header[key]}
                  onChange={() => toggleHeader(key)}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card title="Summary/Visibility Section">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Show in Summary</p>
              <div className="space-y-2">
                {Object.keys(template.summary).map(key => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.summary[key]}
                      onChange={() => toggleSummary(key)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Global Visibility Controls</p>
              <div className="space-y-2">
                {Object.keys(template.visibility || { grossPay: true, deductions: true, netPay: true }).map(key => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.visibility ? template.visibility[key] : true}
                      onChange={() => toggleVisibility(key)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Earnings Components">
          <Button onClick={() => openAddModal('earnings')} variant="secondary" className="mb-3 text-xs">
            <Plus size={14} className="inline mr-1" /> Add Component
          </Button>
          <div className="space-y-2">
            {template.earnings.map((comp, idx) => (
              <div key={comp} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">{componentLabels[comp]}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveComponent('earnings', idx, 'up')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <MoveUp size={14} />
                  </button>
                  <button onClick={() => moveComponent('earnings', idx, 'down')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <MoveDown size={14} />
                  </button>
                  <button onClick={() => removeComponent('earnings', comp)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Deduction Components">
          <Button onClick={() => openAddModal('deductions')} variant="secondary" className="mb-3 text-xs">
            <Plus size={14} className="inline mr-1" /> Add Component
          </Button>
          <div className="space-y-2">
            {template.deductions.map((comp, idx) => (
              <div key={comp} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">{componentLabels[comp]}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveComponent('deductions', idx, 'up')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <MoveUp size={14} />
                  </button>
                  <button onClick={() => moveComponent('deductions', idx, 'down')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <MoveDown size={14} />
                  </button>
                  <button onClick={() => removeComponent('deductions', comp)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Footer Section">
          <div className="space-y-2">
            {Object.keys(template.footer).map(key => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.footer[key]}
                  onChange={() => toggleFooter(key)}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`Add ${addType === 'earnings' ? 'Earning' : 'Deduction'} Component`}>
        <div className="space-y-4">
          <select
            value={newComponent}
            onChange={(e) => setNewComponent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Component</option>
            {(addType === 'earnings' ? availableEarnings : availableDeductions)
              .filter(c => !(template[addType] || []).includes(c))
              .map(c => (
                <option key={c} value={c}>{componentLabels[c]}</option>
              ))}
          </select>
          <Button onClick={addComponent} className="w-full">Add Component</Button>
        </div>
      </Modal>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Template Preview" size="lg">
        <div className="border border-gray-300 dark:border-gray-600 p-6 bg-white dark:bg-gray-800 rounded">
          {template.header.companyName && (
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Outvying HRMS</h2>
              {template.header.monthYear && <p className="text-gray-600 dark:text-gray-400">Month Year</p>}
            </div>
          )}

          {template.header.employeeDetails && (
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-semibold">Employee Name:</span> John Doe</div>
              <div><span className="font-semibold">Employee ID:</span> EMP001</div>
              <div><span className="font-semibold">Designation:</span> Executive</div>
              <div><span className="font-semibold">Department:</span> Sales</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Earnings</h3>
              <div className="space-y-1 text-sm">
                {template.earnings.map(comp => (
                  <div key={comp} className="flex justify-between">
                    <span>{componentLabels[comp]}</span>
                    <span>₹0.00</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Deductions</h3>
              <div className="space-y-1 text-sm">
                {template.deductions.map(comp => (
                  <div key={comp} className="flex justify-between">
                    <span>{componentLabels[comp]}</span>
                    <span>₹0.00</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {template.summary.grossSalary && (
            <div className="border-t pt-3 space-y-1 text-sm">
              {template.summary.workingDays && <div className="flex justify-between"><span>Working Days:</span><span>0/30</span></div>}
              {template.summary.grossSalary && <div className="flex justify-between"><span>Gross Salary:</span><span>₹0.00</span></div>}
              {template.summary.totalDeductions && <div className="flex justify-between"><span>Total Deductions:</span><span>₹0.00</span></div>}
              {template.summary.netPay && <div className="flex justify-between font-bold text-lg"><span>Net Pay:</span><span>₹0.00</span></div>}
            </div>
          )}

          {template.footer.signature && (
            <div className="mt-6 text-right text-sm">
              <p className="font-semibold">Authorized Signatory</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SalarySlipTemplate;
