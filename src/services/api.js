// Centralized API service for Firebase operations
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generic API service with error handling and retry logic
class APIService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    // Retry logic wrapper
    async withRetry(operation, retries = this.maxRetries) {
        try {
            return await operation();
        } catch (error) {
            if (retries > 0 && this.isRetryableError(error)) {
                await this.delay(this.retryDelay);
                return this.withRetry(operation, retries - 1);
            }
            throw error;
        }
    }

    // Check if error is retryable
    isRetryableError(error) {
        const retryableCodes = [
            'unavailable',
            'deadline-exceeded',
            'resource-exhausted',
        ];
        return retryableCodes.includes(error.code);
    }

    // Delay helper
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Generic CRUD operations
    async getAll(collectionName, options = {}) {
        return this.withRetry(async () => {
            let q = collection(db, collectionName);

            // Apply filters
            if (options.where) {
                options.where.forEach(([field, operator, value]) => {
                    q = query(q, where(field, operator, value));
                });
            }

            // Apply ordering
            if (options.orderBy) {
                options.orderBy.forEach(([field, direction = 'asc']) => {
                    q = query(q, orderBy(field, direction));
                });
            }

            // Apply limit
            if (options.limit) {
                q = query(q, limit(options.limit));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        });
    }

    async getById(collectionName, id) {
        return this.withRetry(async () => {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error(`Document not found: ${id}`);
            }

            return {
                id: docSnap.id,
                ...docSnap.data(),
            };
        });
    }

    async create(collectionName, data) {
        return this.withRetry(async () => {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            return {
                id: docRef.id,
                ...data,
            };
        });
    }

    async update(collectionName, id, data) {
        return this.withRetry(async () => {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp(),
            });

            return {
                id,
                ...data,
            };
        });
    }

    async delete(collectionName, id) {
        return this.withRetry(async () => {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
            return { id };
        });
    }

    // Batch operations
    async batchCreate(collectionName, items) {
        const promises = items.map((item) => this.create(collectionName, item));
        return Promise.all(promises);
    }

    async batchUpdate(collectionName, updates) {
        const promises = updates.map(({ id, data }) =>
            this.update(collectionName, id, data)
        );
        return Promise.all(promises);
    }

    async batchDelete(collectionName, ids) {
        const promises = ids.map((id) => this.delete(collectionName, id));
        return Promise.all(promises);
    }
}

// Create singleton instance
const apiService = new APIService();

// Specific collection services
export const employeeService = {
    getAll: (options) => apiService.getAll('employees', options),
    getById: (id) => apiService.getById('employees', id),
    create: (data) => apiService.create('employees', data),
    update: (id, data) => apiService.update('employees', id, data),
    delete: (id) => apiService.delete('employees', id),
    getByDepartment: (department) =>
        apiService.getAll('employees', {
            where: [['department', '==', department]],
        }),
    getActive: () =>
        apiService.getAll('employees', {
            where: [['status', '==', 'Active']],
        }),
};

export const attendanceService = {
    getAll: (options) => apiService.getAll('attendance', options),
    getById: (id) => apiService.getById('attendance', id),
    create: (data) => apiService.create('attendance', data),
    update: (id, data) => apiService.update('attendance', id, data),
    delete: (id) => apiService.delete('attendance', id),
    getByEmployee: (employeeId) =>
        apiService.getAll('attendance', {
            where: [['employeeId', '==', employeeId]],
            orderBy: [['date', 'desc']],
        }),
    getByDateRange: (startDate, endDate) =>
        apiService.getAll('attendance', {
            where: [
                ['date', '>=', startDate],
                ['date', '<=', endDate],
            ],
        }),
};

export const leaveService = {
    getAll: (options) => apiService.getAll('leaves', options),
    getById: (id) => apiService.getById('leaves', id),
    create: (data) => apiService.create('leaves', data),
    update: (id, data) => apiService.update('leaves', id, data),
    delete: (id) => apiService.delete('leaves', id),
    getByEmployee: (employeeId) =>
        apiService.getAll('leaves', {
            where: [['employeeId', '==', employeeId]],
            orderBy: [['startDate', 'desc']],
        }),
    getPending: () =>
        apiService.getAll('leaves', {
            where: [['status', '==', 'Pending']],
        }),
};

export const jobService = {
    getAll: (options) => apiService.getAll('jobs', options),
    getById: (id) => apiService.getById('jobs', id),
    create: (data) => apiService.create('jobs', data),
    update: (id, data) => apiService.update('jobs', id, data),
    delete: (id) => apiService.delete('jobs', id),
    getActive: () =>
        apiService.getAll('jobs', {
            where: [['status', '==', 'Active']],
        }),
};

export const applicantService = {
    getAll: (options) => apiService.getAll('applicants', options),
    getById: (id) => apiService.getById('applicants', id),
    create: (data) => apiService.create('applicants', data),
    update: (id, data) => apiService.update('applicants', id, data),
    delete: (id) => apiService.delete('applicants', id),
    getByJob: (jobId) =>
        apiService.getAll('applicants', {
            where: [['jobId', '==', jobId]],
        }),
    getByStage: (stage) =>
        apiService.getAll('applicants', {
            where: [['stage', '==', stage]],
        }),
};

export const courseService = {
    getAll: (options) => apiService.getAll('courses', options),
    getById: (id) => apiService.getById('courses', id),
    create: (data) => apiService.create('courses', data),
    update: (id, data) => apiService.update('courses', id, data),
    delete: (id) => apiService.delete('courses', id),
    getActive: () =>
        apiService.getAll('courses', {
            where: [['status', '==', 'Active']],
        }),
};

export const assetService = {
    getAll: (options) => apiService.getAll('assets', options),
    getById: (id) => apiService.getById('assets', id),
    create: (data) => apiService.create('assets', data),
    update: (id, data) => apiService.update('assets', id, data),
    delete: (id) => apiService.delete('assets', id),
    getAvailable: () =>
        apiService.getAll('assets', {
            where: [['status', '==', 'Available']],
        }),
    getByEmployee: (employeeId) =>
        apiService.getAll('assets', {
            where: [['assignedTo', '==', employeeId]],
        }),
};

export const expenseService = {
    getAll: (options) => apiService.getAll('expenses', options),
    getById: (id) => apiService.getById('expenses', id),
    create: (data) => apiService.create('expenses', data),
    update: (id, data) => apiService.update('expenses', id, data),
    delete: (id) => apiService.delete('expenses', id),
    getPending: () =>
        apiService.getAll('expenses', {
            where: [['status', '==', 'Pending']],
        }),
    getByEmployee: (employeeId) =>
        apiService.getAll('expenses', {
            where: [['employeeId', '==', employeeId]],
            orderBy: [['date', 'desc']],
        }),
};

export default apiService;
