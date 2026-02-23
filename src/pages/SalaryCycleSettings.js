import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Alert } from '../components/UI';
import { Calendar, DollarSign, Clock, Save, RefreshCw } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  SALARY_CYCLES, 
  DEFAULT_CYCLE_CONFIG, 
  getSalaryCyclePeriod,
  getYearlySalaryCycles,
  validateCycleConfig 
} from '../utils/salaryCycle';

const SalaryCycleSettings = () => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState(DEFAULT_CYCLE_CONFIG);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    // Update preview when config changes
    const currentPeriod = getSalaryCyclePeriod(new Date(), config);
    setPreview(currentPeriod);
  }, [config]);

  const loadConfig = async () => {
    try {
      const docRef = doc(db, 'settings', 'salaryCycle');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setConfig({ ...DEFAULT_CYCLE_CONFIG, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const validation = validateCycleConfig(config);
    
    if (!validation.valid) {
      setAlert({ type: 'error', message: validation.errors.join(', ') });
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'salaryCycle'), config);
      setAlert({ type: 'success', message: 'Salary cycle configuration saved successfully' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to save configuration' });
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CYCLE_CONFIG);
    setAlert({ type: 'info', message: 'Configuration reset to defaults' });
    setTimeout(() => setAlert(null), 3000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salary Cycle Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure pay periods and salary calculation rules</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReset}>
            <RefreshCw size={18} className="mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave}>
            <Save size={18} className="mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Pay Period Configuration">
            <div className="space-y-4">
              {/* Cycle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salary Cycle Type
                </label>
                <select
                  value={config.type}
                  onChange={(e) => setConfig({ ...config, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={SALARY_CYCLES.MONTHLY}>Monthly (1st to Last Day)</option>
                  <option value={SALARY_CYCLES.SEMI_MONTHLY}>Semi-Monthly (1-15, 16-End)</option>
                  <option value={SALARY_CYCLES.BI_WEEKLY}>Bi-Weekly (Every 2 Weeks)</option>
                  <option value={SALARY_CYCLES.WEEKLY}>Weekly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {config.type === SALARY_CYCLES.MONTHLY && 'Employees are paid once per month'}
                  {config.type === SALARY_CYCLES.SEMI_MONTHLY && 'Employees are paid twice per month'}
                  {config.type === SALARY_CYCLES.BI_WEEKLY && 'Employees are paid every 2 weeks (26 times/year)'}
                  {config.type === SALARY_CYCLES.WEEKLY && 'Employees are paid every week (52 times/year)'}
                </p>
              </div>

              {/* Start Day (for monthly cycles) */}
              {config.type === SALARY_CYCLES.MONTHLY && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cycle Start Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={config.startDay}
                      onChange={(e) => setConfig({ ...config, startDay: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cycle End Day
                    </label>
                    <select
                      value={config.endDay}
                      onChange={(e) => setConfig({ ...config, endDay: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="last">Last Day of Month</option>
                      {[...Array(31)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Working Days Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Working Days per Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={config.workingDaysPerMonth}
                    onChange={(e) => setConfig({ ...config, workingDaysPerMonth: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for pro-rata calculations</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Working Hours per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={config.workingHoursPerDay}
                    onChange={(e) => setConfig({ ...config, workingHoursPerDay: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for hourly rate calculations</p>
                </div>
              </div>

              {/* Overtime Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overtime Multiplier
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  step="0.1"
                  value={config.overtimeMultiplier}
                  onChange={(e) => setConfig({ ...config, overtimeMultiplier: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Overtime pay = Hourly rate × Hours × {config.overtimeMultiplier}x
                </p>
              </div>
            </div>
          </Card>

          {/* Calculation Examples */}
          <Card title="Calculation Examples">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Pro-Rata Salary</h4>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  If an employee with ₹50,000 monthly salary works 20 out of {config.workingDaysPerMonth} days:
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-300 mt-2">
                  ₹{((50000 / config.workingDaysPerMonth) * 20).toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Overtime Pay</h4>
                <p className="text-sm text-green-800 dark:text-green-400">
                  For 10 hours overtime at ₹50,000 monthly salary:
                </p>
                <p className="text-lg font-bold text-green-900 dark:text-green-300 mt-2">
                  ₹{((50000 / (config.workingDaysPerMonth * config.workingHoursPerDay)) * 10 * config.overtimeMultiplier).toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Hourly Rate</h4>
                <p className="text-sm text-purple-800 dark:text-purple-400">
                  For ₹50,000 monthly salary:
                </p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-300 mt-2">
                  ₹{(50000 / (config.workingDaysPerMonth * config.workingHoursPerDay)).toFixed(2)}/hour
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview & Info */}
        <div className="space-y-6">
          {/* Current Period Preview */}
          <Card title="Current Pay Period">
            <div className="space-y-4">
              {preview && (
                <>
                  <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <Calendar className="text-primary-600" size={24} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Period</p>
                      <p className="font-bold text-gray-900 dark:text-white">{preview.period}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{preview.startDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{preview.endDate}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card title="Configuration Summary">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <DollarSign className="text-green-600" size={20} />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Pay Frequency</p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {config.type === SALARY_CYCLES.MONTHLY && '12 times/year'}
                    {config.type === SALARY_CYCLES.SEMI_MONTHLY && '24 times/year'}
                    {config.type === SALARY_CYCLES.BI_WEEKLY && '26 times/year'}
                    {config.type === SALARY_CYCLES.WEEKLY && '52 times/year'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Clock className="text-blue-600" size={20} />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Total Monthly Hours</p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {config.workingDaysPerMonth * config.workingHoursPerDay} hours
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Important Notes */}
          <Card title="Important Notes">
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p>• Changes will apply to future payroll calculations</p>
              <p>• Existing processed payrolls will not be affected</p>
              <p>• Pro-rata calculations use working days, not calendar days</p>
              <p>• Overtime is calculated based on hourly rate</p>
              <p>• Mid-cycle joiners/exits are automatically pro-rated</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalaryCycleSettings;
