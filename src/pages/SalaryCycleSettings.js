import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Alert } from '../components/UI';
import { Calendar, DollarSign, Clock, Save, RefreshCw, AlertTriangle, History, Users } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { 
  SALARY_CYCLES, 
  DEFAULT_CYCLE_CONFIG, 
  getSalaryCyclePeriod,
  getYearlySalaryCycles,
  validateCycleConfig,
  getWorkingDaysInCycle
} from '../utils/salaryCycle';

const SalaryCycleSettings = () => {
  const { currentUser, holidays } = useAuth();
  const [config, setConfig] = useState(DEFAULT_CYCLE_CONFIG);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [yearCycles, setYearCycles] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [autoCalculate, setAutoCalculate] = useState(false);

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, []);

  useEffect(() => {
    const currentPeriod = getSalaryCyclePeriod(new Date(), config);
    setPreview(currentPeriod);
    setYearCycles(getYearlySalaryCycles(new Date().getFullYear(), config));
    validateConfiguration();
  }, [config]);

  useEffect(() => {
    if (autoCalculate && config.type === SALARY_CYCLES.MONTHLY) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const startDay = config.startDay || 1;
      const endDay = config.endDay === 'last' ? new Date(year, month + 1, 0).getDate() : parseInt(config.endDay);
      const cycleStart = new Date(year, month, startDay).toISOString().split('T')[0];
      const cycleEnd = new Date(year, month, endDay).toISOString().split('T')[0];
      const holidayDates = (holidays || []).map(h => h.date);
      const calculatedDays = getWorkingDaysInCycle(cycleStart, cycleEnd, holidayDates, [0, 6]);
      setConfig(prev => ({ ...prev, workingDaysPerMonth: calculatedDays }));
    }
  }, [autoCalculate, config.startDay, config.endDay, config.type, holidays]);

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

  const loadHistory = async () => {
    try {
      const q = query(collection(db, 'salaryCycleHistory'), orderBy('changedAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const validateConfiguration = () => {
    const warns = [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const weekdaysInMonth = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
      return d.getDay() !== 0 && d.getDay() !== 6;
    }).filter(Boolean).length;

    if (config.workingDaysPerMonth > weekdaysInMonth) {
      warns.push(`Working days (${config.workingDaysPerMonth}) exceeds weekdays in month (${weekdaysInMonth})`);
    }

    const currentDay = today.getDate();
    if (config.startDay !== 1 && currentDay >= config.startDay && currentDay <= 15) {
      warns.push('Changing cycle mid-period may affect current month payroll');
    }

    setWarnings(warns);
  };

  const handleSave = async () => {
    const validation = validateCycleConfig(config);
    
    if (!validation.valid) {
      setAlert({ type: 'error', message: validation.errors.join(', ') });
      return;
    }

    if (warnings.length > 0) {
      const confirm = window.confirm(`Warnings detected:\n${warnings.join('\n')}\n\nProceed anyway?`);
      if (!confirm) return;
    }

    try {
      await setDoc(doc(db, 'settings', 'salaryCycle'), config);
      await addDoc(collection(db, 'salaryCycleHistory'), {
        ...config,
        changedBy: currentUser.name,
        changedById: currentUser.id,
        changedAt: serverTimestamp()
      });
      setAlert({ type: 'success', message: 'Salary cycle configuration saved successfully' });
      loadHistory();
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
          <Button variant="secondary" onClick={() => setShowHistory(!showHistory)}>
            <History size={18} className="mr-2" />
            History
          </Button>
          <Button variant="secondary" onClick={() => setShowCalendar(!showCalendar)}>
            <Calendar size={18} className="mr-2" />
            Calendar
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            <RefreshCw size={18} className="mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save size={18} className="mr-2" />
            Save
          </Button>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Configuration Warnings</h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
                {warnings.map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Pay Period Configuration">
            <div className="space-y-4">
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
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Working Days per Month
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={config.workingDaysPerMonth}
                      onChange={(e) => setConfig({ ...config, workingDaysPerMonth: parseInt(e.target.value) })}
                      disabled={autoCalculate}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                    <button
                      onClick={() => setAutoCalculate(!autoCalculate)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold ${autoCalculate ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      title="Auto-calculate based on weekdays"
                    >
                      AUTO
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {autoCalculate ? 'Auto-calculated excluding weekends & holidays' : 'Manual entry for pro-rata calculations'}
                  </p>
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
                </div>
              </div>

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
              </div>
            </div>
          </Card>

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
            </div>
          </Card>
        </div>

        <div className="space-y-6">
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
        </div>
      </div>

      {showCalendar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCalendar(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Payroll Calendar {new Date().getFullYear()}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {yearCycles.map((cycle, i) => {
                const isCurrent = cycle.startDate <= new Date().toISOString().split('T')[0] && cycle.endDate >= new Date().toISOString().split('T')[0];
                return (
                  <div key={i} className={`p-4 rounded-lg border-2 ${isCurrent ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className={isCurrent ? 'text-primary-600' : 'text-gray-400'} />
                      <h3 className="font-bold text-sm">{cycle.period}</h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{cycle.startDate} to {cycle.endDate}</p>
                    {isCurrent && <span className="inline-block mt-2 px-2 py-1 bg-primary-600 text-white text-xs rounded-full">Current Period</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Configuration History</h2>
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No history available</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{h.type === SALARY_CYCLES.MONTHLY ? 'Monthly' : h.type}</p>
                        <p className="text-xs text-gray-500">Working Days: {h.workingDaysPerMonth} | Hours: {h.workingHoursPerDay}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {h.changedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Changed by: {h.changedBy}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryCycleSettings;
