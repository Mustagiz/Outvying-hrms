/**
 * Experience Certificate Generator
 * Auto-generates professional experience letters
 */

import { jsPDF } from 'jspdf';

/**
 * Generate experience certificate PDF
 */
export const generateExperienceCertificate = (employee, exitData) => {
  const doc = new jsPDF();
  
  const joiningDate = new Date(employee.dateOfJoining || employee.joiningDate);
  const exitDate = new Date(exitData.lastWorkingDay);
  const tenure = calculateTenure(joiningDate, exitDate);

  // Company Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Outvying Media', 105, 20, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('A-106, 1st floor, Town Square, New Airport Road, Viman Nagar', 105, 28, { align: 'center' });
  doc.text('Pune, Maharashtra 411014', 105, 33, { align: 'center' });
  doc.text('Email: hr@outvying.com | Website: www.outvying.com', 105, 38, { align: 'center' });

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPERIENCE CERTIFICATE', 105, 55, { align: 'center' });

  // Reference Number & Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const refNo = `OVM/HR/${new Date().getFullYear()}/${Math.floor(Math.random() * 10000)}`;
  doc.text(`Ref No: ${refNo}`, 20, 70);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 170, 70);

  // Certificate Body
  doc.setFontSize(11);
  const bodyY = 85;
  const lineHeight = 7;
  let currentY = bodyY;

  doc.text('To Whom It May Concern,', 20, currentY);
  currentY += lineHeight * 2;

  const bodyText = [
    `This is to certify that ${employee.name} was employed with Outvying Media`,
    `from ${joiningDate.toLocaleDateString('en-IN')} to ${exitDate.toLocaleDateString('en-IN')}.`,
    '',
    `During the tenure of ${tenure}, ${employee.name.split(' ')[0]} worked as ${employee.designation}`,
    `in the ${employee.department} department.`,
    '',
    `${employee.name.split(' ')[0]} has been a valuable member of our team and has demonstrated`,
    `professionalism, dedication, and strong work ethics throughout the employment period.`,
    '',
    `We wish ${employee.name.split(' ')[0]} all the best for future endeavors.`
  ];

  bodyText.forEach(line => {
    doc.text(line, 20, currentY);
    currentY += lineHeight;
  });

  // Signature Section
  currentY += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('For Outvying Media', 20, currentY);
  currentY += 20;
  
  doc.setFont('helvetica', 'normal');
  doc.text('_______________________', 20, currentY);
  currentY += 7;
  doc.text('Authorized Signatory', 20, currentY);
  currentY += 5;
  doc.setFontSize(9);
  doc.text('HR Department', 20, currentY);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated document and does not require a physical signature.', 105, 280, { align: 'center' });

  // Save
  doc.save(`Experience_Certificate_${employee.employeeId || employee.id}_${employee.name.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Generate relieving letter PDF
 */
export const generateRelievingLetter = (employee, exitData) => {
  const doc = new jsPDF();
  
  const exitDate = new Date(exitData.lastWorkingDay);

  // Company Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Outvying Media', 105, 20, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('A-106, 1st floor, Town Square, New Airport Road, Viman Nagar', 105, 28, { align: 'center' });
  doc.text('Pune, Maharashtra 411014', 105, 33, { align: 'center' });

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RELIEVING LETTER', 105, 55, { align: 'center' });

  // Reference & Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const refNo = `OVM/HR/REL/${new Date().getFullYear()}/${Math.floor(Math.random() * 10000)}`;
  doc.text(`Ref No: ${refNo}`, 20, 70);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 170, 70);

  // Body
  doc.setFontSize(11);
  let currentY = 85;
  const lineHeight = 7;

  doc.text('To Whom It May Concern,', 20, currentY);
  currentY += lineHeight * 2;

  const bodyText = [
    `This is to certify that ${employee.name}, Employee ID: ${employee.employeeId || employee.id},`,
    `has been relieved from the services of Outvying Media with effect from`,
    `${exitDate.toLocaleDateString('en-IN')}.`,
    '',
    `${employee.name.split(' ')[0]} has completed all exit formalities and has handed over all company`,
    `properties, documents, and assets in good condition.`,
    '',
    `All dues have been settled as per company policy.`,
    '',
    `We wish ${employee.name.split(' ')[0]} success in all future endeavors.`
  ];

  bodyText.forEach(line => {
    doc.text(line, 20, currentY);
    currentY += lineHeight;
  });

  // Signature
  currentY += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('For Outvying Media', 20, currentY);
  currentY += 20;
  
  doc.setFont('helvetica', 'normal');
  doc.text('_______________________', 20, currentY);
  currentY += 7;
  doc.text('HR Manager', 20, currentY);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated document and does not require a physical signature.', 105, 280, { align: 'center' });

  doc.save(`Relieving_Letter_${employee.employeeId || employee.id}_${employee.name.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Calculate tenure in readable format
 */
const calculateTenure = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  
  return parts.join(' and ') || '0 months';
};

export default {
  generateExperienceCertificate,
  generateRelievingLetter
};
