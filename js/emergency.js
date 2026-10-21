/**
 * CareTrack - Modern Healthcare Management System
 * Emergency Care Controller (emergency.js)
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  if (!Auth.requireAuth()) return;
  const user = Auth.getCurrentUser();
  if (!user) return;

  Common.initHeaderAndSidebar();

  // Setup Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      Common.confirmDialog('Log Out', 'Are you sure you want to log out?', 'Log Out', () => Auth.logout());
    };
  }

  // Display Elements
  const pName = document.getElementById('em-primary-name');
  const pRelation = document.getElementById('em-primary-relation');
  const pPhone = document.getElementById('em-primary-phone');
  const callPrimaryBtn = document.getElementById('em-call-primary-btn');

  const sName = document.getElementById('em-secondary-name');
  const sRelation = document.getElementById('em-secondary-relation');
  const sPhone = document.getElementById('em-secondary-phone');
  const callSecondaryBtn = document.getElementById('em-call-secondary-btn');

  const bloodGroup = document.getElementById('em-blood-group');
  const doctorName = document.getElementById('em-doctor-name');
  const allergies = document.getElementById('em-allergies');

  // Modal Elements
  const editModal = document.getElementById('edit-emergency-modal');
  const btnOpenEdit = document.getElementById('btn-edit-emergency');
  const btnCloseModal = document.getElementById('close-emergency-modal');
  const btnCancelModal = document.getElementById('btn-cancel-em');
  const emergencyForm = document.getElementById('emergency-form');

  const inputPName = document.getElementById('form-pname');
  const inputPRelation = document.getElementById('form-prelation');
  const inputPPhone = document.getElementById('form-pphone');
  const inputSName = document.getElementById('form-sname');
  const inputSRelation = document.getElementById('form-srelation');
  const inputSPhone = document.getElementById('form-sphone');
  const inputBlood = document.getElementById('form-blood');
  const inputDoc = document.getElementById('form-docname');
  const inputAllergies = document.getElementById('form-allergies');

  btnOpenEdit.onclick = () => openEditModal();
  btnCloseModal.onclick = () => Common.closeModal('edit-emergency-modal');
  btnCancelModal.onclick = () => Common.closeModal('edit-emergency-modal');

  function loadEmergencyDetails() {
    const em = Storage.getEmergencyInfo(user.id);

    pName.textContent = em.primaryName || 'Not Set';
    pRelation.textContent = em.primaryRelation || 'Primary Contact';
    pPhone.textContent = em.primaryPhone || 'N/A';
    if (callPrimaryBtn) {
      callPrimaryBtn.setAttribute('href', `tel:${(em.primaryPhone || '').replace(/\s+/g, '')}`);
    }

    sName.textContent = em.secondaryName || 'Not Set';
    sRelation.textContent = em.secondaryRelation || 'Alternate Contact';
    sPhone.textContent = em.secondaryPhone || 'N/A';
    if (callSecondaryBtn) {
      callSecondaryBtn.setAttribute('href', `tel:${(em.secondaryPhone || '').replace(/\s+/g, '')}`);
    }

    bloodGroup.textContent = em.bloodGroup || 'Not Specified';
    doctorName.textContent = em.doctorName || 'None Listed';
    allergies.textContent = em.allergies || 'None Reported';
  }

  function openEditModal() {
    const em = Storage.getEmergencyInfo(user.id);

    inputPName.value = em.primaryName || '';
    inputPRelation.value = em.primaryRelation || '';
    inputPPhone.value = em.primaryPhone || '';

    inputSName.value = em.secondaryName || '';
    inputSRelation.value = em.secondaryRelation || '';
    inputSPhone.value = em.secondaryPhone || '';

    inputBlood.value = em.bloodGroup || '';
    inputDoc.value = em.doctorName || '';
    inputAllergies.value = em.allergies || '';

    Common.openModal('edit-emergency-modal');
  }

  emergencyForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const updated = {
      primaryName: inputPName.value.trim(),
      primaryRelation: inputPRelation.value.trim(),
      primaryPhone: inputPPhone.value.trim(),
      secondaryName: inputSName.value.trim(),
      secondaryRelation: inputSRelation.value.trim(),
      secondaryPhone: inputSPhone.value.trim(),
      bloodGroup: inputBlood.value.trim(),
      doctorName: inputDoc.value.trim(),
      allergies: inputAllergies.value.trim()
    };

    Storage.updateEmergencyInfo(user.id, updated);
    Common.showToast('Emergency contact information updated', 'success');
    Common.closeModal('edit-emergency-modal');
    loadEmergencyDetails();
  });

  // Initial load
  loadEmergencyDetails();
});
