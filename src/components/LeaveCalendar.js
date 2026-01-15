import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal, Button } from '../components/UI';
import { ChevronLeft, ChevronRight, Download, AlertTriangle } from 'lucide-react';

const LeaveCalendar = () => {
  const { leaves, allUsers } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterDept, setFilterDept] = useState('all');

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getLeaveCountForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const approvedLeaves = leaves.filter(l => {
      if (l.status !== 'Approved') return false;
      const startDate = new Date(l.startDate);
      const endDate = new Date(l.endDate);
      const checkDate = new Date(dateStr);
      
      if (filterDept !== 'all') {
        const emp = allUsers.find(u => u.id === l.employeeId);
        if (emp?.department !== filterDept) return false;
      }
      
      return checkDate >= startDate && checkDate <= endDate;
    });
    
    return approvedLeaves;
  };

  const getColorClass = (count, total) => {
    const percentage = (count / total) * 100;
    if (percentage >= 16) return 'bg-red-100 text-red-800 border-red-300';
    if (percentage >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setShowModal(true);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalEmployees = allUsers.filter(u => u.role === 'employee').length;

  const selectedDateLeaves = selectedDate ? getLeaveCountForDate(selectedDate) : [];
  const selectedDateCount = selectedDateLeaves.length;
  const selectedDatePct = ((selectedDateCount / totalEmployees) * 100).toFixed(1);

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const departments = ['all', ...new Set(allUsers.map(u => u.department).filter(Boolean))];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 mb-6 border border-blue-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          📅 Leave Impact Calendar
        </h3>
        <div className="flex items-center gap-4">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2 border-2 border-blue-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-medium shadow-sm hover:border-blue-300 transition-colors"
          >
            <option value="all">🏢 All Departments</option>
            {departments.filter(d => d !== 'all').map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-md border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => navigateMonth(-1)} 
              className="p-2 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-blue-600 dark:text-blue-400" />
            </button>
            <span className="font-bold text-gray-800 dark:text-white min-w-[160px] text-center text-lg">{monthName}</span>
            <button 
              onClick={() => navigateMonth(1)} 
              className="p-2 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="grid grid-cols-7 gap-3 mb-3">
          {weekDays.map(day => (
            <div key={day} className="text-center font-bold text-gray-700 dark:text-gray-300 text-sm py-2 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            const date = new Date(year, month, day);
            const leavesOnDate = getLeaveCountForDate(date);
            const count = leavesOnDate.length;
            const colorClass = getColorClass(count, totalEmployees);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-square border-2 rounded-xl p-3 hover:shadow-xl hover:scale-105 transition-all duration-200 ${colorClass} ${
                  isToday ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-lg font-bold mb-1">{day}</div>
                  <div className="text-xs font-bold px-2 py-1 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                    {count === 0 ? '✓' : count}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8 text-sm bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded-lg shadow-sm"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">0-5% Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded-lg shadow-sm"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">6-15% Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded-lg shadow-sm"></div>
          <span className="font-medium text-gray-700 dark:text-gray-300">16%+ Critical</span>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`📅 ${selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`} size="lg">
        {selectedDate && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">👥 Total Employees</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalEmployees}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">🏝️ On Leave</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{selectedDateCount} <span className="text-lg">({selectedDatePct}%)</span></p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">✅ Available</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{totalEmployees - selectedDateCount} <span className="text-lg">({(100 - parseFloat(selectedDatePct)).toFixed(1)}%)</span></p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">🚦 Status</p>
                <p className={`text-2xl font-bold ${
                  parseFloat(selectedDatePct) >= 16 ? 'text-red-600 dark:text-red-400' :
                  parseFloat(selectedDatePct) >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {parseFloat(selectedDatePct) >= 16 ? '🔴 Critical' :
                   parseFloat(selectedDatePct) >= 6 ? '🟡 Warning' : '🟢 Normal'}
                </p>
              </div>
            </div>

            {selectedDateCount > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
                  👥 Employees on Leave ({selectedDateCount})
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {selectedDateLeaves.map(leave => (
                    <div key={leave.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white text-lg">{leave.employeeName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">🏝️ {leave.leaveType}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                            {leave.days} day{leave.days > 1 ? 's' : ''}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDateCount === 0 && (
              <div className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No employees on leave</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Full team availability on this date</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setShowModal(false)} variant="primary" className="px-6">Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveCalendar;
