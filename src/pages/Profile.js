import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert } from '../components/UI';
import { User, Mail, Phone, MapPin, Briefcase, Calendar } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    address: currentUser.address,
    emergencyContact: currentUser.emergencyContact,
    bloodGroup: currentUser.bloodGroup
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = updateUserProfile(currentUser.id, formData);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setIsEditing(false);
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-primary-600 flex items-center justify-center text-white text-5xl font-bold mb-4">
                {currentUser.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                {currentUser.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{currentUser.designation}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">{currentUser.employeeId}</p>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <Briefcase size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.dateOfJoining}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Reporting To</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.reportingTo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Personal Information">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={currentUser.email}
                    disabled
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />

                  <Input
                    label="Blood Group"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                  />

                  <Input
                    label="Emergency Contact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    required
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button type="button" variant="secondary" onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: currentUser.name,
                      phone: currentUser.phone,
                      address: currentUser.address,
                      emergencyContact: currentUser.emergencyContact,
                      bloodGroup: currentUser.bloodGroup
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <User className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="text-gray-400 mt-1">🩸</div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Blood Group</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.bloodGroup}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Emergency Contact</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.emergencyContact}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {currentUser.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
