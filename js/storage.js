/**
 * CareTrack - Modern Healthcare Management System
 * Data Storage & Persistence Module (storage.js)
 * Handles LocalStorage data isolation by user ID and CRUD operations.
 */

const Storage = (function () {
  'use strict';

  // Seed default data for the 3 demo users if not already present
  function seedDefaultDataForDemoUsers() {
    // Demo 1: Kartavya Singh
    if (!localStorage.getItem('caretrack_data_user_kartavya')) {
      const dataKartavya = {
        medicines: [
          {
            id: 'med_k1',
            name: 'Metformin',
            dosage: '500 mg',
            frequency: 'Twice Daily',
            time: '08:00 AM',
            startDate: '2026-01-10',
            endDate: '2026-12-31',
            status: 'Active',
            takenToday: true,
            reminder: true,
            instructions: 'Take with breakfast and plenty of water.'
          },
          {
            id: 'med_k2',
            name: 'Atorvastatin',
            dosage: '20 mg',
            frequency: 'Once Daily',
            time: '09:00 PM',
            startDate: '2026-02-01',
            endDate: '2026-12-31',
            status: 'Active',
            takenToday: false,
            reminder: true,
            instructions: 'Take after dinner before going to bed.'
          },
          {
            id: 'med_k3',
            name: 'Vitamin D3',
            dosage: '60,000 IU',
            frequency: 'Weekly',
            time: '10:00 AM',
            startDate: '2026-03-01',
            endDate: '2026-06-01',
            status: 'Active',
            takenToday: false,
            reminder: true,
            instructions: 'Take every Sunday morning with milk.'
          },
          {
            id: 'med_k4',
            name: 'Lisinopril',
            dosage: '10 mg',
            frequency: 'Once Daily',
            time: '08:30 AM',
            startDate: '2026-01-15',
            endDate: '2026-12-31',
            status: 'Active',
            takenToday: true,
            reminder: false,
            instructions: 'Blood pressure control. Take after morning tea.'
          },
          {
            id: 'med_k5',
            name: 'Paracetamol',
            dosage: '650 mg',
            frequency: 'As Needed',
            time: '12:00 PM',
            startDate: '2026-01-01',
            endDate: '2026-01-10',
            status: 'Completed',
            takenToday: false,
            reminder: false,
            instructions: 'For occasional headaches or fever.'
          }
        ],
        appointments: [
          {
            id: 'apt_k1',
            doctorName: 'Dr. Sarah Jenkins',
            specialty: 'Cardiologist',
            date: '2026-10-22',
            time: '10:30 AM',
            location: 'Apollo Heart Clinic, Room 302',
            status: 'Upcoming',
            notes: 'Routine 6-month cardiovascular checkup and ECG test.'
          },
          {
            id: 'apt_k2',
            doctorName: 'Dr. Robert Chen',
            specialty: 'Endocrinologist',
            date: '2026-11-04',
            time: '02:00 PM',
            location: 'City Care Hospital, Block B',
            status: 'Upcoming',
            notes: 'Review HbA1c glucose levels and dietary adjustments.'
          },
          {
            id: 'apt_k3',
            doctorName: 'Dr. Emily Parker',
            specialty: 'General Physician',
            date: '2026-09-15',
            time: '11:00 AM',
            location: 'Wellness Medical Center',
            status: 'Completed',
            notes: 'General health clearance and annual physical exam.'
          }
        ],
        tasks: [
          {
            id: 'tsk_k1',
            title: 'Morning Blood Pressure Check',
            category: 'Health',
            dueDate: '2026-10-20',
            dueTime: '08:00 AM',
            completed: true
          },
          {
            id: 'tsk_k2',
            title: '30-minute Brisk Morning Walk',
            category: 'Fitness',
            dueDate: '2026-10-20',
            dueTime: '07:00 AM',
            completed: true
          },
          {
            id: 'tsk_k3',
            title: 'Take Sunday Vitamin D3 Supplement',
            category: 'Medication',
            dueDate: '2026-10-20',
            dueTime: '10:00 AM',
            completed: false
          },
          {
            id: 'tsk_k4',
            title: 'Drink 2.5 Liters of Water',
            category: 'Wellness',
            dueDate: '2026-10-20',
            dueTime: '08:00 PM',
            completed: false
          },
          {
            id: 'tsk_k5',
            title: 'Log Evening Blood Glucose Reading',
            category: 'Health',
            dueDate: '2026-10-20',
            dueTime: '09:30 PM',
            completed: false
          }
        ],
        records: [
          {
            id: 'rec_k1',
            title: 'Comprehensive Lipid & Cardiac Profile',
            category: 'Lab Report',
            date: '2026-09-14',
            notes: 'Cholesterol and triglycerides are within target range.',
            fileName: 'cardiac_panel_sep2026.pdf',
            fileSize: '1.8 MB'
          },
          {
            id: 'rec_k2',
            title: 'HbA1c & Fasting Blood Sugar Report',
            category: 'Lab Report',
            date: '2026-08-20',
            notes: 'HbA1c level recorded at 6.1%. Stable glycemic control.',
            fileName: 'hba1c_glucose_report.pdf',
            fileSize: '1.2 MB'
          },
          {
            id: 'rec_k3',
            title: 'Annual Ophthalmology & Retina Exam',
            category: 'General',
            date: '2026-07-10',
            notes: 'Normal intraocular pressure and no diabetic retinopathy.',
            fileName: 'retina_eval_doc.pdf',
            fileSize: '2.4 MB'
          },
          {
            id: 'rec_k4',
            title: 'Pneumococcal & Flu Vaccine Certificate',
            category: 'Vaccination',
            date: '2026-05-18',
            notes: 'Annual seasonal flu shot administered at Metro Clinic.',
            fileName: 'vaccine_cert_2026.pdf',
            fileSize: '850 KB'
          }
        ],
        emergency: {
          primaryName: 'Dr. Vikram Malhotra',
          primaryRelation: 'Family Doctor',
          primaryPhone: '+91 94535 00111',
          secondaryName: 'Priya Sharma',
          secondaryRelation: 'Spouse',
          secondaryPhone: '+91 94535 22334',
          bloodGroup: 'B Positive (B+)',
          allergies: 'Penicillin, Sulfa drugs',
          doctorName: 'Dr. Sarah Jenkins (Cardiology)',
          doctorPhone: '+91 94535 99888'
        },
        notifications: [
          {
            id: 'notif_1',
            title: 'Upcoming Appointment',
            message: 'Tomorrow at 10:30 AM with Dr. Sarah Jenkins (Cardiologist).',
            time: '2 hours ago',
            read: false,
            type: 'info'
          },
          {
            id: 'notif_2',
            title: 'Medicine Due Tonight',
            message: 'Remember to take Atorvastatin 20mg at 09:00 PM.',
            time: '4 hours ago',
            read: false,
            type: 'warning'
          },
          {
            id: 'notif_3',
            title: 'Care Tasks Update',
            message: 'You have completed 2 out of 5 care tasks today.',
            time: '6 hours ago',
            read: true,
            type: 'success'
          }
        ],
        activityWeekly: [80, 100, 60, 90, 75, 85, 95] // Mon - Sun percentage
      };
      localStorage.setItem('caretrack_data_user_kartavya', JSON.stringify(dataKartavya));
    }

    // Demo 2: GGIT
    if (!localStorage.getItem('caretrack_data_user_ggit')) {
      const dataGGIT = {
        medicines: [
          {
            id: 'med_g1',
            name: 'Amoxicillin',
            dosage: '500 mg',
            frequency: '3 Times Daily',
            time: '09:00 AM',
            startDate: '2026-10-15',
            endDate: '2026-10-25',
            status: 'Active',
            takenToday: true,
            reminder: true,
            instructions: 'Course for throat infection. Complete the full 10-day cycle.'
          },
          {
            id: 'med_g2',
            name: 'Multivitamin Complex',
            dosage: '1 Tablet',
            frequency: 'Once Daily',
            time: '01:00 PM',
            startDate: '2026-09-01',
            endDate: '2026-12-31',
            status: 'Active',
            takenToday: false,
            reminder: true,
            instructions: 'Take after lunch for nutritional balance.'
          }
        ],
        appointments: [
          {
            id: 'apt_g1',
            doctorName: 'Dr. Alok Gupta',
            specialty: 'Orthopedic Surgeon',
            date: '2026-10-24',
            time: '11:00 AM',
            location: 'Metro Ortho Care, 4th Floor',
            status: 'Upcoming',
            notes: 'Follow up examination on posture alignment and back stiffness.'
          }
        ],
        tasks: [
          {
            id: 'tsk_g1',
            title: '15-minute Ergonomic Spine Stretches',
            category: 'Fitness',
            dueDate: '2026-10-20',
            dueTime: '10:00 AM',
            completed: true
          },
          {
            id: 'tsk_g2',
            title: 'Hydration Target: 3 Liters Water',
            category: 'Wellness',
            dueDate: '2026-10-20',
            dueTime: '06:00 PM',
            completed: false
          },
          {
            id: 'tsk_g3',
            title: 'Evening Walk & Deep Breathing',
            category: 'Wellness',
            dueDate: '2026-10-20',
            dueTime: '08:00 PM',
            completed: false
          }
        ],
        records: [
          {
            id: 'rec_g1',
            title: 'Digital Lumbar Spine X-Ray',
            category: 'Imaging',
            date: '2026-09-28',
            notes: 'Mild lumbar muscle spasm, bone alignment normal.',
            fileName: 'spine_xray_report.pdf',
            fileSize: '3.1 MB'
          },
          {
            id: 'rec_g2',
            title: 'Complete Blood Count (CBC)',
            category: 'Lab Report',
            date: '2026-09-10',
            notes: 'Hemoglobin and WBC count within healthy bounds.',
            fileName: 'cbc_blood_test.pdf',
            fileSize: '920 KB'
          }
        ],
        emergency: {
          primaryName: 'Campus Medical Helpline',
          primaryRelation: 'Clinic Emergency Desk',
          primaryPhone: '+91 98765 00000',
          secondaryName: 'Sunita Verma',
          secondaryRelation: 'Guardian',
          secondaryPhone: '+91 98765 11223',
          bloodGroup: 'O Positive (O+)',
          allergies: 'None reported',
          doctorName: 'Dr. Alok Gupta',
          doctorPhone: '+91 98765 44332'
        },
        notifications: [
          {
            id: 'notif_g1',
            title: 'Orthopedic Visit Ahead',
            message: 'Appointment scheduled for Friday 11:00 AM with Dr. Alok Gupta.',
            time: '1 day ago',
            read: false,
            type: 'info'
          }
        ],
        activityWeekly: [70, 85, 90, 80, 65, 95, 75]
      };
      localStorage.setItem('caretrack_data_user_ggit', JSON.stringify(dataGGIT));
    }

    // Demo 3: ZCOP
    if (!localStorage.getItem('caretrack_data_user_zcop')) {
      const dataZCOP = {
        medicines: [
          {
            id: 'med_z1',
            name: 'Budesonide Inhaler',
            dosage: '2 Puffs (200 mcg)',
            frequency: 'Twice Daily',
            time: '08:00 AM',
            startDate: '2026-02-15',
            endDate: '2026-12-31',
            status: 'Active',
            takenToday: true,
            reminder: true,
            instructions: 'Inhale using spacer chamber. Rinse mouth afterward.'
          },
          {
            id: 'med_z2',
            name: 'Montelukast',
            dosage: '10 mg',
            frequency: 'Once Daily',
            time: '09:30 PM',
            startDate: '2026-03-01',
            endDate: '2026-12-31',
            status: 'Active',
            takenToday: false,
            reminder: true,
            instructions: 'Night dosage for allergy prophylaxis.'
          },
          {
            id: 'med_z3',
            name: 'Levocetirizine',
            dosage: '5 mg',
            frequency: 'As Needed',
            time: '10:00 PM',
            startDate: '2026-08-01',
            endDate: '2026-11-30',
            status: 'Active',
            takenToday: false,
            reminder: false,
            instructions: 'Take in case of acute allergic flare-up.'
          }
        ],
        appointments: [
          {
            id: 'apt_z1',
            doctorName: 'Dr. Neha Kapoor',
            specialty: 'Pulmonologist',
            date: '2026-10-28',
            time: '04:00 PM',
            location: 'Chest & Allergy Care Institute, Suite 105',
            status: 'Upcoming',
            notes: 'Review Spirometry lung capacity test and inhaler dosage.'
          }
        ],
        tasks: [
          {
            id: 'tsk_z1',
            title: 'Morning Peak Flow Meter Reading',
            category: 'Health',
            dueDate: '2026-10-20',
            dueTime: '08:15 AM',
            completed: true
          },
          {
            id: 'tsk_z2',
            title: 'HEPA Air Purifier Filter Inspection',
            category: 'Wellness',
            dueDate: '2026-10-20',
            dueTime: '11:00 AM',
            completed: true
          },
          {
            id: 'tsk_z3',
            title: 'Evening Inhaler Administration',
            category: 'Medication',
            dueDate: '2026-10-20',
            dueTime: '09:00 PM',
            completed: false
          }
        ],
        records: [
          {
            id: 'rec_z1',
            title: 'Pulmonary Function Spirometry Report',
            category: 'Lab Report',
            date: '2026-07-22',
            notes: 'FEV1 value showed 18% improvement with inhaled corticosteroid.',
            fileName: 'spirometry_test_jul2026.pdf',
            fileSize: '1.5 MB'
          },
          {
            id: 'rec_z2',
            title: 'Comprehensive Allergen IgE Panel',
            category: 'Lab Report',
            date: '2026-04-12',
            notes: 'Positive for dust mite antigen and cedar pollen.',
            fileName: 'allergy_ige_panel.pdf',
            fileSize: '2.1 MB'
          }
        ],
        emergency: {
          primaryName: 'Dr. Anand Mehta',
          primaryRelation: 'Pulmonology Consultant',
          primaryPhone: '+91 91234 11111',
          secondaryName: 'Aman Patel',
          secondaryRelation: 'Brother',
          secondaryPhone: '+91 91234 88990',
          bloodGroup: 'A Positive (A+)',
          allergies: 'Dust mites, shellfish, NSAIDs',
          doctorName: 'Dr. Neha Kapoor',
          doctorPhone: '+91 91234 55443'
        },
        notifications: [
          {
            id: 'notif_z1',
            title: 'Inhaler Refill Reminder',
            message: 'Your current budesonide canister has approximately 15 doses remaining.',
            time: '5 hours ago',
            read: false,
            type: 'warning'
          }
        ],
        activityWeekly: [85, 90, 95, 70, 80, 85, 90]
      };
      localStorage.setItem('caretrack_data_user_zcop', JSON.stringify(dataZCOP));
    }
  }

  // Initialize a fresh user dataset for newly registered accounts
  function initializeNewUserData(userId, userName) {
    const starterData = {
      medicines: [
        {
          id: 'med_' + Date.now(),
          name: 'Multivitamin Formula',
          dosage: '1 Capsule',
          frequency: 'Once Daily',
          time: '09:00 AM',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '2026-12-31',
          status: 'Active',
          takenToday: false,
          reminder: true,
          instructions: 'Take with morning meal and water.'
        }
      ],
      appointments: [
        {
          id: 'apt_' + Date.now(),
          doctorName: 'Dr. Emily Parker',
          specialty: 'General Practitioner',
          date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          time: '10:00 AM',
          location: 'CareTrack Wellness Center, Clinic 1',
          status: 'Upcoming',
          notes: 'Initial health consultation and wellness profile setup.'
        }
      ],
      tasks: [
        {
          id: 'tsk_' + (Date.now() + 1),
          title: 'Complete Profile & Medical History',
          category: 'Wellness',
          dueDate: new Date().toISOString().split('T')[0],
          dueTime: '10:00 AM',
          completed: false
        },
        {
          id: 'tsk_' + (Date.now() + 2),
          title: 'Log Today\'s Water Intake (2 Liters)',
          category: 'Wellness',
          dueDate: new Date().toISOString().split('T')[0],
          dueTime: '06:00 PM',
          completed: false
        },
        {
          id: 'tsk_' + (Date.now() + 3),
          title: 'Evening Walk (20 minutes)',
          category: 'Fitness',
          dueDate: new Date().toISOString().split('T')[0],
          dueTime: '07:30 PM',
          completed: false
        }
      ],
      records: [],
      emergency: {
        primaryName: 'Emergency Contact',
        primaryRelation: 'Family Member',
        primaryPhone: '+91 99999 00000',
        secondaryName: 'Alternate Contact',
        secondaryRelation: 'Friend',
        secondaryPhone: '+91 88888 00000',
        bloodGroup: 'Not specified',
        allergies: 'None recorded',
        doctorName: 'Dr. Emily Parker',
        doctorPhone: '+91 94535 00000'
      },
      notifications: [
        {
          id: 'notif_new_1',
          title: 'Welcome to CareTrack!',
          message: 'Explore your dashboard, add your prescriptions, and stay on track with your health.',
          time: 'Just now',
          read: false,
          type: 'info'
        }
      ],
      activityWeekly: [50, 60, 40, 70, 80, 75, 60]
    };

    localStorage.setItem('caretrack_data_' + userId, JSON.stringify(starterData));

    // Also set default settings
    const defaultSettings = {
      theme: 'light',
      notificationsEmail: true,
      notificationsPush: true,
      medicineReminders: true,
      soundEnabled: true
    };
    localStorage.setItem('caretrack_settings_' + userId, JSON.stringify(defaultSettings));
  }

  // Helper: Get storage key for current user
  function getUserDataKey(userId) {
    return 'caretrack_data_' + userId;
  }

  // Get raw dataset for a user
  function getUserData(userId) {
    if (!userId) return null;
    try {
      const dataStr = localStorage.getItem(getUserDataKey(userId));
      if (!dataStr) {
        initializeNewUserData(userId, 'User');
        return JSON.parse(localStorage.getItem(getUserDataKey(userId)));
      }
      return JSON.parse(dataStr);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  // Save entire dataset for a user
  function saveUserData(userId, data) {
    if (!userId || !data) return false;
    try {
      localStorage.setItem(getUserDataKey(userId), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving user data:', e);
      return false;
    }
  }

  // --- MEDICINE CRUD ---
  function getMedicines(userId) {
    const data = getUserData(userId);
    return data && Array.isArray(data.medicines) ? data.medicines : [];
  }

  function addMedicine(userId, medicine) {
    const data = getUserData(userId);
    if (!data) return null;
    if (!data.medicines) data.medicines = [];
    
    medicine.id = 'med_' + Date.now();
    medicine.takenToday = false;
    data.medicines.unshift(medicine);
    saveUserData(userId, data);
    return medicine;
  }

  function updateMedicine(userId, medicineId, updatedFields) {
    const data = getUserData(userId);
    if (!data || !data.medicines) return null;
    const index = data.medicines.findIndex(m => m.id === medicineId);
    if (index === -1) return null;

    data.medicines[index] = { ...data.medicines[index], ...updatedFields };
    saveUserData(userId, data);
    return data.medicines[index];
  }

  function deleteMedicine(userId, medicineId) {
    const data = getUserData(userId);
    if (!data || !data.medicines) return false;
    const initialLen = data.medicines.length;
    data.medicines = data.medicines.filter(m => m.id !== medicineId);
    if (data.medicines.length !== initialLen) {
      saveUserData(userId, data);
      return true;
    }
    return false;
  }

  function toggleMedicineTaken(userId, medicineId) {
    const data = getUserData(userId);
    if (!data || !data.medicines) return null;
    const item = data.medicines.find(m => m.id === medicineId);
    if (!item) return null;

    item.takenToday = !item.takenToday;
    saveUserData(userId, data);
    return item;
  }

  // --- APPOINTMENT CRUD ---
  function getAppointments(userId) {
    const data = getUserData(userId);
    return data && Array.isArray(data.appointments) ? data.appointments : [];
  }

  function addAppointment(userId, appointment) {
    const data = getUserData(userId);
    if (!data) return null;
    if (!data.appointments) data.appointments = [];

    appointment.id = 'apt_' + Date.now();
    appointment.status = appointment.status || 'Upcoming';
    data.appointments.unshift(appointment);
    saveUserData(userId, data);
    return appointment;
  }

  function updateAppointment(userId, appointmentId, updatedFields) {
    const data = getUserData(userId);
    if (!data || !data.appointments) return null;
    const index = data.appointments.findIndex(a => a.id === appointmentId);
    if (index === -1) return null;

    data.appointments[index] = { ...data.appointments[index], ...updatedFields };
    saveUserData(userId, data);
    return data.appointments[index];
  }

  function deleteAppointment(userId, appointmentId) {
    const data = getUserData(userId);
    if (!data || !data.appointments) return false;
    const initialLen = data.appointments.length;
    data.appointments = data.appointments.filter(a => a.id !== appointmentId);
    if (data.appointments.length !== initialLen) {
      saveUserData(userId, data);
      return true;
    }
    return false;
  }

  function cancelAppointment(userId, appointmentId) {
    return updateAppointment(userId, appointmentId, { status: 'Cancelled' });
  }

  // --- CARE TASKS CRUD ---
  function getTasks(userId) {
    const data = getUserData(userId);
    return data && Array.isArray(data.tasks) ? data.tasks : [];
  }

  function addTask(userId, task) {
    const data = getUserData(userId);
    if (!data) return null;
    if (!data.tasks) data.tasks = [];

    task.id = 'tsk_' + Date.now();
    task.completed = false;
    data.tasks.unshift(task);
    saveUserData(userId, data);
    return task;
  }

  function updateTask(userId, taskId, updatedFields) {
    const data = getUserData(userId);
    if (!data || !data.tasks) return null;
    const index = data.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    data.tasks[index] = { ...data.tasks[index], ...updatedFields };
    saveUserData(userId, data);
    return data.tasks[index];
  }

  function deleteTask(userId, taskId) {
    const data = getUserData(userId);
    if (!data || !data.tasks) return false;
    const initialLen = data.tasks.length;
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    if (data.tasks.length !== initialLen) {
      saveUserData(userId, data);
      return true;
    }
    return false;
  }

  function toggleTask(userId, taskId) {
    const data = getUserData(userId);
    if (!data || !data.tasks) return null;
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return null;

    task.completed = !task.completed;
    saveUserData(userId, data);
    return task;
  }

  // --- HEALTH RECORDS CRUD ---
  function getRecords(userId) {
    const data = getUserData(userId);
    return data && Array.isArray(data.records) ? data.records : [];
  }

  function addRecord(userId, record) {
    const data = getUserData(userId);
    if (!data) return null;
    if (!data.records) data.records = [];

    record.id = 'rec_' + Date.now();
    data.records.unshift(record);
    saveUserData(userId, data);
    return record;
  }

  function deleteRecord(userId, recordId) {
    const data = getUserData(userId);
    if (!data || !data.records) return false;
    const initialLen = data.records.length;
    data.records = data.records.filter(r => r.id !== recordId);
    if (data.records.length !== initialLen) {
      saveUserData(userId, data);
      return true;
    }
    return false;
  }

  // --- EMERGENCY CONTACTS ---
  function getEmergencyInfo(userId) {
    const data = getUserData(userId);
    return data && data.emergency ? data.emergency : {
      primaryName: '',
      primaryRelation: '',
      primaryPhone: '',
      secondaryName: '',
      secondaryRelation: '',
      secondaryPhone: '',
      bloodGroup: '',
      allergies: '',
      doctorName: '',
      doctorPhone: ''
    };
  }

  function updateEmergencyInfo(userId, emergencyInfo) {
    const data = getUserData(userId);
    if (!data) return false;
    data.emergency = { ...(data.emergency || {}), ...emergencyInfo };
    return saveUserData(userId, data);
  }

  // --- USER SETTINGS & THEME ---
  function getSettings(userId) {
    const key = 'caretrack_settings_' + userId;
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        const defaultSettings = {
          theme: 'light',
          notificationsEmail: true,
          notificationsPush: true,
          medicineReminders: true,
          soundEnabled: true
        };
        localStorage.setItem(key, JSON.stringify(defaultSettings));
        return defaultSettings;
      }
      return JSON.parse(item);
    } catch (e) {
      return { theme: 'light' };
    }
  }

  function saveSettings(userId, newSettings) {
    const key = 'caretrack_settings_' + userId;
    try {
      const current = getSettings(userId);
      const merged = { ...current, ...newSettings };
      localStorage.setItem(key, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error('Error saving settings:', e);
      return null;
    }
  }

  // --- NOTIFICATIONS ---
  function getNotifications(userId) {
    const data = getUserData(userId);
    return data && Array.isArray(data.notifications) ? data.notifications : [];
  }

  function markNotificationRead(userId, notifId) {
    const data = getUserData(userId);
    if (!data || !data.notifications) return false;
    const item = data.notifications.find(n => n.id === notifId);
    if (item) {
      item.read = true;
      saveUserData(userId, data);
      return true;
    }
    return false;
  }

  function clearAllNotifications(userId) {
    const data = getUserData(userId);
    if (!data) return false;
    data.notifications = [];
    return saveUserData(userId, data);
  }

  // Public Interface
  return {
    seedDefaultDataForDemoUsers: seedDefaultDataForDemoUsers,
    initializeNewUserData: initializeNewUserData,
    getUserData: getUserData,
    saveUserData: saveUserData,
    
    getMedicines: getMedicines,
    addMedicine: addMedicine,
    updateMedicine: updateMedicine,
    deleteMedicine: deleteMedicine,
    toggleMedicineTaken: toggleMedicineTaken,

    getAppointments: getAppointments,
    addAppointment: addAppointment,
    updateAppointment: updateAppointment,
    deleteAppointment: deleteAppointment,
    cancelAppointment: cancelAppointment,

    getTasks: getTasks,
    addTask: addTask,
    updateTask: updateTask,
    deleteTask: deleteTask,
    toggleTask: toggleTask,

    getRecords: getRecords,
    addRecord: addRecord,
    deleteRecord: deleteRecord,

    getEmergencyInfo: getEmergencyInfo,
    updateEmergencyInfo: updateEmergencyInfo,

    getSettings: getSettings,
    saveSettings: saveSettings,

    getNotifications: getNotifications,
    markNotificationRead: markNotificationRead,
    clearAllNotifications: clearAllNotifications
  };
})();
