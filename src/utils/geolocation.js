// Geolocation utilities for attendance tracking

export const geolocation = {
    // Get current position
    getCurrentPosition: () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                    });
                },
                (error) => {
                    let errorMessage = 'Unable to retrieve location';

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location permission denied. Please enable location access.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out.';
                            break;
                    }

                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    },

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    },

    // Check if user is within geofence
    isWithinGeofence: (userLat, userLon, officeLat, officeLon, radiusMeters = 100) => {
        const distance = geolocation.calculateDistance(
            userLat,
            userLon,
            officeLat,
            officeLon
        );

        return {
            isWithin: distance <= radiusMeters,
            distance: Math.round(distance),
            radius: radiusMeters,
        };
    },

    // Validate location for clock in/out
    validateLocation: async (officeLocations) => {
        try {
            const position = await geolocation.getCurrentPosition();

            // Check against all office locations
            for (const office of officeLocations) {
                const result = geolocation.isWithinGeofence(
                    position.latitude,
                    position.longitude,
                    office.latitude,
                    office.longitude,
                    office.radius || 100
                );

                if (result.isWithin) {
                    return {
                        valid: true,
                        office: office.name,
                        distance: result.distance,
                        location: {
                            latitude: position.latitude,
                            longitude: position.longitude,
                        },
                    };
                }
            }

            // Not within any office location
            const nearestOffice = officeLocations.reduce((nearest, office) => {
                const distance = geolocation.calculateDistance(
                    position.latitude,
                    position.longitude,
                    office.latitude,
                    office.longitude
                );

                if (!nearest || distance < nearest.distance) {
                    return { office, distance };
                }
                return nearest;
            }, null);

            return {
                valid: false,
                message: `You are ${Math.round(nearestOffice.distance)}m away from ${nearestOffice.office.name}. Please be within ${nearestOffice.office.radius || 100}m to clock in.`,
                nearestOffice: nearestOffice.office.name,
                distance: Math.round(nearestOffice.distance),
                location: {
                    latitude: position.latitude,
                    longitude: position.longitude,
                },
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
            };
        }
    },

    // Get address from coordinates (reverse geocoding)
    getAddressFromCoordinates: async (latitude, longitude) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch address');
            }

            const data = await response.json();
            return data.display_name || 'Unknown location';
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
    },

    // Watch position for continuous tracking
    watchPosition: (callback, errorCallback) => {
        if (!navigator.geolocation) {
            errorCallback(new Error('Geolocation is not supported'));
            return null;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                callback({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                });
            },
            (error) => {
                errorCallback(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return watchId;
    },

    // Stop watching position
    clearWatch: (watchId) => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
    },

    // Format distance for display
    formatDistance: (meters) => {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    },
};

// Default office locations (example)
export const defaultOfficeLocations = [
    {
        id: '1',
        name: 'Head Office - Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        radius: 100, // meters
        address: 'MG Road, Bangalore, Karnataka',
    },
    {
        id: '2',
        name: 'Branch Office - Mumbai',
        latitude: 19.0760,
        longitude: 72.8777,
        radius: 100,
        address: 'Andheri, Mumbai, Maharashtra',
    },
];

export default geolocation;
