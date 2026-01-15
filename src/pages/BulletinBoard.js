import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Input, Alert } from '../components/UI';
import { Megaphone, Plus, Calendar, Users, AlertCircle, Trophy, Gift, Pin } from 'lucide-react';

const BulletinBoard = () => {
  const { currentUser, announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement: removeAnnouncement } = useAuth();
  const [alert, setAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Important',
    title: '',
    message: '',
    pinned: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const iconMap = {
      'New Joiner': { icon: 'Users', color: 'blue' },
      'Holiday': { icon: 'Gift', color: 'purple' },
      'Important': { icon: 'AlertCircle', color: 'red' },
      'Achievement': { icon: 'Trophy', color: 'yellow' },
      'Event': { icon: 'Calendar', color: 'green' }
    };

    const announcementData = {
      ...formData,
      author: currentUser.name,
      ...iconMap[formData.type]
    };

    addAnnouncement(announcementData);
    setShowAddModal(false);
    setFormData({ type: 'Important', title: '', message: '', pinned: false });
    setAlert({ type: 'success', message: 'Announcement posted successfully' });
    setTimeout(() => setAlert(null), 3000);
  };

  const togglePin = (id) => {
    const announcement = announcements.find(a => a.id === id);
    updateAnnouncement(id, { pinned: !announcement.pinned });
  };

  const deleteAnnouncement = (id) => {
    removeAnnouncement(id);
    setAlert({ type: 'success', message: 'Announcement deleted' });
    setTimeout(() => setAlert(null), 3000);
  };

  const pinnedAnnouncements = announcements.filter(a => a.pinned);
  const regularAnnouncements = announcements.filter(a => !a.pinned);

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  };

  const AnnouncementCard = ({ announcement }) => {
    const iconMap = {
      'Users': Users,
      'Gift': Gift,
      'AlertCircle': AlertCircle,
      'Trophy': Trophy,
      'Calendar': Calendar
    };
    const Icon = iconMap[announcement.icon] || AlertCircle;
    return (
      <div className={`border-l-4 p-4 rounded-lg ${colorClasses[announcement.color]}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Icon className={`text-${announcement.color}-600 mt-1`} size={24} />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-800 dark:text-white">{announcement.title}</h3>
                {announcement.pinned && <Pin size={16} className="text-primary-600" />}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{announcement.message}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>{announcement.date}</span>
                </span>
                <span>By {announcement.author}</span>
                <span className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full">{announcement.type}</span>
              </div>
            </div>
          </div>
          {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => togglePin(announcement.id)}
                className="text-gray-400 hover:text-primary-600"
              >
                <Pin size={16} />
              </button>
              <button
                onClick={() => deleteAnnouncement(announcement.id)}
                className="text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bulletin Board</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Company announcements and updates</p>
        </div>
        {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} className="inline mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Posts</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{announcements.length}</p>
            </div>
            <Megaphone className="text-primary-600" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pinned</p>
              <p className="text-3xl font-bold text-blue-600">{pinnedAnnouncements.length}</p>
            </div>
            <Pin className="text-blue-600" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Joiners</p>
              <p className="text-3xl font-bold text-green-600">
                {announcements.filter(a => a.type === 'New Joiner').length}
              </p>
            </div>
            <Users className="text-green-600" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Holidays</p>
              <p className="text-3xl font-bold text-purple-600">
                {announcements.filter(a => a.type === 'Holiday').length}
              </p>
            </div>
            <Gift className="text-purple-600" size={32} />
          </div>
        </Card>
      </div>

      {pinnedAnnouncements.length > 0 && (
        <Card title="📌 Pinned Announcements" className="mb-6">
          <div className="space-y-4">
            {pinnedAnnouncements.map(announcement => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        </Card>
      )}

      <Card title="All Announcements">
        <div className="space-y-4">
          {regularAnnouncements.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No announcements yet</p>
          ) : (
            regularAnnouncements.map(announcement => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))
          )}
        </div>
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Announcement">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Important">Important Update</option>
              <option value="New Joiner">New Joiner</option>
              <option value="Holiday">Holiday</option>
              <option value="Achievement">Achievement</option>
              <option value="Event">Event</option>
            </select>
          </div>

          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter announcement title"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter announcement message"
              required
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Pin this announcement</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Post Announcement</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BulletinBoard;
