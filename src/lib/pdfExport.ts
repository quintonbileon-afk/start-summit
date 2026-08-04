import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RegistrationData } from '../types';

export interface PDFExportOptions {
  mode: 'full' | 'table';
  scope: 'all' | 'filtered';
  filterDescription?: string;
}

export function generateRegistrationsPDF(
  registrations: RegistrationData[],
  options: PDFExportOptions
) {
  if (!registrations || registrations.length === 0) {
    alert('No registrations available to export.');
    return;
  }

  const { mode } = options;

  // Portrait for Full Detailed Profiles, Landscape for Master Executive Table
  const isTable = mode === 'table';
  const doc = new jsPDF({
    orientation: isTable ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Primary Brand Color Palette
  const colors = {
    primary: [15, 23, 42] as [number, number, number], // #0f172a Navy
    primaryLight: [30, 41, 59] as [number, number, number], // #1e293b
    accent: [239, 68, 68] as [number, number, number], // #ef4444 Red
    yellow: [217, 119, 6] as [number, number, number], // #d97706 Warm Gold
    textDark: [15, 23, 42] as [number, number, number],
    textMuted: [100, 116, 139] as [number, number, number],
    bgLight: [248, 250, 252] as [number, number, number],
    borderLight: [226, 232, 240] as [number, number, number],
    green: [22, 163, 74] as [number, number, number],
    blue: [37, 99, 235] as [number, number, number],
    purple: [147, 51, 234] as [number, number, number],
  };

  // Format Ticket ID
  const getTicketId = (reg: RegistrationData) => {
    if (reg.ticketId) return reg.ticketId;
    if (reg.id) return `TKT-${reg.id.substring(0, 6).toUpperCase()}`;
    return 'TKT-PENDING';
  };

  // Format Date Safely
  const formatDate = (val: any) => {
    if (!val) return 'N/A';
    if (typeof val?.toDate === 'function') {
      return val.toDate().toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    if (val instanceof Date) {
      return val.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      }
    }
    return 'N/A';
  };

  // Calculate Statistics
  const totalCount = registrations.length;
  const attendantsCount = registrations.filter((r) => r.registrationType === 'attendant').length;
  const exhibitorsCount = registrations.filter((r) => r.registrationType === 'exhibitor').length;
  const partnersCount = registrations.filter((r) => r.registrationType === 'partner').length;
  const speakersCount = registrations.filter((r) => (r as any).registrationType === 'speaker').length;
  const verifiedCount = registrations.filter(
    (r) => r.paymentStatus === 'verified' || r.registrationType === 'partner' || (r as any).registrationType === 'speaker'
  ).length;
  const checkedInCount = registrations.filter((r) => r.checkedIn).length;

  // Draw Main Document Header & Stat Cards
  const addDocumentHeader = (startY: number = 10) => {
    // Header Banner Box
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, startY, contentWidth, 26, 3, 3, 'F');

    // Main Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('STARTUP SUMMIT BOTSWANA 2026', margin + 6, startY + 9.5);

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(245, 158, 11); // Gold
    doc.text(
      isTable ? 'OFFICIAL REGISTRATION MASTER TABLE' : 'OFFICIAL REGISTRATION DETAILED PROFILES REPORT',
      margin + 6,
      startY + 16.5
    );

    // Export Timestamp & Count (Right aligned)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    const dateStr = `Exported: ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`;
    doc.text(dateStr, margin + contentWidth - 6, startY + 9.5, { align: 'right' });
    doc.text(`Total Records: ${totalCount}`, margin + contentWidth - 6, startY + 16.5, { align: 'right' });

    // Decorative Accent Strip
    doc.setFillColor(...colors.accent);
    doc.rect(margin, startY + 24, contentWidth, 2, 'F');

    // Summary Statistics Cards Bar
    const statsY = startY + 30;
    const gap = 3;
    const statBoxWidth = (contentWidth - gap * 5) / 6;
    const statBoxHeight = 13;

    const statItems = [
      { label: 'Total Regs', val: totalCount, color: colors.primary },
      { label: 'Attendants', val: attendantsCount, color: colors.blue },
      { label: 'Exhibitors', val: exhibitorsCount, color: colors.purple },
      { label: 'Partners', val: partnersCount, color: colors.accent },
      { label: 'Verified Paid', val: verifiedCount, color: colors.green },
      { label: 'Checked In', val: checkedInCount, color: colors.yellow },
    ];

    statItems.forEach((item, index) => {
      const x = margin + index * (statBoxWidth + gap);
      doc.setFillColor(...colors.bgLight);
      doc.setDrawColor(...colors.borderLight);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, statsY, statBoxWidth, statBoxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...item.color);
      doc.text(String(item.val), x + 4, statsY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.textMuted);
      doc.text(item.label, x + 4, statsY + 10.5);
    });

    return statsY + statBoxHeight + 6;
  };

  // ==========================================
  // MODE 1: EXECUTIVE MASTER TABLE MODE
  // ==========================================
  if (isTable) {
    const tableStartY = addDocumentHeader(10);

    const tableHeaders = [
      ['#', 'Ticket ID', 'Full Name', 'Contact Info', 'Organization & Sector', 'Type', 'Payment Status', 'Check-In']
    ];

    const tableRows = registrations.map((reg, index) => {
      const typeStr = (reg.registrationType || 'Attendant').toUpperCase();
      const isFree = reg.registrationType === 'partner' || (reg as any).registrationType === 'speaker';
      const statusStr = isFree
        ? 'FREE PASS'
        : (reg.paymentStatus || 'PENDING').toUpperCase();

      const payRefStr = reg.paymentReference ? `Ref: ${reg.paymentReference}` : '';
      const fullPaymentInfo = payRefStr ? `${statusStr}\n${payRefStr}` : statusStr;

      const checkInStr = reg.checkedIn ? 'CHECKED IN' : 'NOT YET';

      const emailStr = reg.email || 'N/A';
      const phoneStr = reg.mobileNumber || '';
      const contactCombined = phoneStr ? `${emailStr}\n${phoneStr}` : emailStr;

      const companyStr = reg.company || 'N/A';
      const roleStr = reg.role ? `(${reg.role})` : '';
      const sectorStr = reg.businessSector || reg.participantCategory || '';
      const orgCombined = `${companyStr} ${roleStr}`.trim() + (sectorStr ? `\n${sectorStr}` : '');

      return [
        index + 1,
        getTicketId(reg),
        reg.fullName || 'N/A',
        contactCombined,
        orgCombined,
        typeStr,
        fullPaymentInfo,
        checkInStr,
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: tableHeaders,
      body: tableRows,
      margin: { top: 14, left: margin, right: margin, bottom: 15 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: colors.textDark,
        lineColor: colors.borderLight,
        lineWidth: 0.15,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 55 },
        4: { cellWidth: 55 },
        5: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
        6: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        7: { cellWidth: 28, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Color code payment
          if (data.column.index === 6) {
            const cellVal = String(data.cell.raw);
            if (cellVal.includes('VERIFIED') || cellVal.includes('FREE')) {
              data.cell.styles.textColor = colors.green;
            } else {
              data.cell.styles.textColor = colors.accent;
            }
          }
          // Color code check-in
          if (data.column.index === 7) {
            const cellVal = String(data.cell.raw);
            if (cellVal.includes('CHECKED')) {
              data.cell.styles.textColor = colors.green;
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = colors.textMuted;
            }
          }
        }
      },
      didDrawPage: (data) => {
        // Top Banner on Page 2+
        if (data.pageNumber > 1) {
          doc.setFillColor(...colors.primary);
          doc.rect(margin, 5, contentWidth, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('STARTUP SUMMIT BOTSWANA 2026 — REGISTRATIONS MASTER TABLE', margin + 4, 10.2);
          doc.setFont('helvetica', 'normal');
          doc.text(`Page ${data.pageNumber}`, margin + contentWidth - 4, 10.2, { align: 'right' });
        }

        // Footer
        const totalPages = (doc as any).internal.getNumberOfPages();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...colors.textMuted);
        doc.text(
          `Startup Summit Botswana 2026 Official Report | Page ${data.pageNumber} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );
      },
    });
  }

  // ==========================================
  // MODE 2: FULL DETAILED PROFILES MODE
  // ==========================================
  else {
    let currentY = addDocumentHeader(10);

    registrations.forEach((reg, index) => {
      const isExhibitor = reg.registrationType === 'exhibitor';
      const isPartner = reg.registrationType === 'partner';
      const isSpeaker = (reg as any).registrationType === 'speaker';

      // 1. Prepare Text Data with Proper Wrapping calculations
      const colWidth = (contentWidth - 16) / 2; // ~85mm per column
      const fullSpanWidth = contentWidth - 12;

      const ticketIdStr = getTicketId(reg);
      const submittedDateStr = formatDate(reg.submittedAt);
      const isVerified = reg.paymentStatus === 'verified' || isPartner || isSpeaker;
      const payStatusText = isPartner || isSpeaker ? 'FREE PASS' : (reg.paymentStatus || 'PENDING').toUpperCase();
      const checkInText = reg.checkedIn ? 'CHECKED IN' : 'NO';

      const emailStr = reg.email || 'N/A';
      const phoneStr = reg.mobileNumber || 'N/A';

      const orgStr = `${reg.company || 'N/A'}${reg.role ? ` (${reg.role})` : ''}`;
      const sectorCatStr = reg.businessSector || reg.participantCategory || 'N/A';

      const payRefStr = reg.paymentReference || 'N/A';
      const ticketOptionStr = (reg.ticketOption || 'STANDARD').toUpperCase();

      // Wrapped multiline texts
      doc.setFontSize(8);
      const wrappedAddress = doc.splitTextToSize(reg.physicalAddress || 'N/A', fullSpanWidth);

      // Calculate Card Dynamic Height cleanly
      let bodyContentHeight = 28; // Base fields Y space (Ticket info, contacts, org, address)
      bodyContentHeight += wrappedAddress.length * 3.8;

      if (isExhibitor) {
        const prodWrapped = doc.splitTextToSize(reg.productsExhibited || 'N/A', fullSpanWidth - 25);
        bodyContentHeight += 18 + (prodWrapped.length > 1 ? (prodWrapped.length - 1) * 3.5 : 0);
      }
      if (isPartner) {
        const objWrapped = doc.splitTextToSize(reg.partnershipInterest || 'N/A', fullSpanWidth - 25);
        bodyContentHeight += 16 + (objWrapped.length > 1 ? (objWrapped.length - 1) * 3.5 : 0);
      }
      if (isSpeaker) {
        const bioWrapped = doc.splitTextToSize((reg as any).bio || 'Guest Speaker', fullSpanWidth - 25);
        bodyContentHeight += 16 + (bioWrapped.length > 1 ? (bioWrapped.length - 1) * 3.5 : 0);
      }
      if (reg.specialRequirements) {
        const reqsWrapped = doc.splitTextToSize(reg.specialRequirements, fullSpanWidth - 35);
        bodyContentHeight += 10 + reqsWrapped.length * 3.5;
      }

      const totalCardHeight = 10 + bodyContentHeight + 4; // Title bar (10mm) + body + padding

      // Check if card fits on current page
      if (currentY + totalCardHeight > pageHeight - 15) {
        doc.addPage();
        currentY = 14;

        // Sub-page top header bar
        doc.setFillColor(...colors.primary);
        doc.roundedRect(margin, currentY, contentWidth, 9, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text('STARTUP SUMMIT BOTSWANA 2026 — REGISTRATION PROFILES (CONT.)', margin + 5, currentY + 6);
        currentY += 13;
      }

      const cardX = margin;
      const cardStartY = currentY;

      // 1. Draw Card Outer Container
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...colors.borderLight);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardStartY, contentWidth, totalCardHeight, 2, 2, 'FD');

      // 2. Card Header Title Bar
      const typeUpper = (reg.registrationType || 'Attendant').toUpperCase();
      let typeBg = colors.blue;
      if (isExhibitor) typeBg = colors.purple;
      if (isPartner) typeBg = colors.accent;
      if (isSpeaker) typeBg = colors.yellow;

      doc.setFillColor(...colors.primary);
      doc.roundedRect(cardX, cardStartY, contentWidth, 10, 2, 2, 'F');
      // Square off bottom corners of header bar
      doc.rect(cardX, cardStartY + 7, contentWidth, 3, 'F');

      // Name & Number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      const nameTitle = `#${index + 1}.  ${reg.fullName || 'N/A'}`;
      doc.text(nameTitle, cardX + 5, cardStartY + 6.5);

      // Type Badge
      const badgeWidth = 28;
      const badgeX = cardX + contentWidth - badgeWidth - 4;
      doc.setFillColor(...typeBg);
      doc.roundedRect(badgeX, cardStartY + 2, badgeWidth, 6, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(typeUpper, badgeX + badgeWidth / 2, cardStartY + 6, { align: 'center' });

      // 3. Card Body Grid
      let py = cardStartY + 15;
      const col1X = cardX + 5;
      const col2X = cardX + margin + colWidth + 2;

      // Row 1: Ticket ID, Date | Payment Status, Check-In
      doc.setFontSize(8);
      
      // Col 1
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('TICKET ID:', col1X, py);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text(ticketIdStr, col1X + 22, py);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('SUBMITTED:', col1X + 50, py);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textDark);
      doc.text(submittedDateStr, col1X + 72, py);

      // Col 2
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('PAYMENT:', col2X, py);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(isVerified ? colors.green : colors.accent));
      doc.text(payStatusText, col2X + 22, py);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('CHECK-IN:', col2X + 50, py);
      doc.setTextColor(...(reg.checkedIn ? colors.green : colors.textMuted));
      doc.text(checkInText, col2X + 70, py);

      // Horizontal Divider Line
      py += 4;
      doc.setDrawColor(...colors.borderLight);
      doc.setLineWidth(0.15);
      doc.line(cardX + 4, py, cardX + contentWidth - 4, py);

      // Row 2: Email | Phone
      py += 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('EMAIL:', col1X, py);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textDark);
      doc.text(emailStr, col1X + 22, py);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('PHONE:', col2X, py);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textDark);
      doc.text(phoneStr, col2X + 22, py);

      // Row 3: Organization | Sector
      py += 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('ORGANIZATION:', col1X, py);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textDark);
      doc.text(orgStr, col1X + 27, py);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('SECTOR/CAT:', col2X, py);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textDark);
      doc.text(sectorCatStr, col2X + 25, py);

      // Row 4: Payment Reference | Ticket Option
      py += 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('PAYMENT REF:', col1X, py);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textDark);
      doc.text(payRefStr, col1X + 27, py);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('TICKET OPTION:', col2X, py);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.yellow);
      doc.text(ticketOptionStr, col2X + 27, py);

      // Row 5: Physical Address (Wrapped)
      py += 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text('ADDRESS:', col1X, py);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textDark);
      doc.text(wrappedAddress, col1X + 22, py);

      py += (wrappedAddress.length - 1) * 3.8 + 2;

      // Exhibitor Extra Box
      if (isExhibitor) {
        py += 3;
        const boxHeight = 16 + (doc.splitTextToSize(reg.productsExhibited || 'N/A', fullSpanWidth - 25).length - 1) * 3.5;
        doc.setFillColor(...colors.bgLight);
        doc.setDrawColor(...colors.borderLight);
        doc.roundedRect(cardX + 4, py, contentWidth - 8, boxHeight, 1, 1, 'FD');

        let exY = py + 4.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...colors.purple);
        doc.text('EXHIBITOR PROFILE DETAILS:', cardX + 7, exY);

        exY += 4.2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.textMuted);
        doc.text('Website:', cardX + 7, exY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textDark);
        doc.text(reg.website || 'N/A', cardX + 22, exY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.textMuted);
        doc.text('Category:', col2X, exY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textDark);
        doc.text(reg.exhibitorCategory || 'N/A', col2X + 20, exY);

        exY += 4.2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.textMuted);
        doc.text('Products:', cardX + 7, exY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textDark);
        const prodWrapped = doc.splitTextToSize(reg.productsExhibited || 'N/A', fullSpanWidth - 25);
        doc.text(prodWrapped, cardX + 22, exY);

        py += boxHeight + 2;
      }

      // Partner Extra Box
      if (isPartner) {
        py += 3;
        const boxHeight = 14 + (doc.splitTextToSize(reg.partnershipInterest || 'N/A', fullSpanWidth - 25).length - 1) * 3.5;
        doc.setFillColor(...colors.bgLight);
        doc.setDrawColor(...colors.borderLight);
        doc.roundedRect(cardX + 4, py, contentWidth - 8, boxHeight, 1, 1, 'FD');

        let ptY = py + 4.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...colors.accent);
        doc.text('PARTNERSHIP PROPOSAL DETAILS:', cardX + 7, ptY);

        ptY += 4.2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.textMuted);
        doc.text('Category:', cardX + 7, ptY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textDark);
        doc.text(reg.partnershipCategory || 'N/A', cardX + 22, ptY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.textMuted);
        doc.text('Objectives:', col2X, ptY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textDark);
        const objWrapped = doc.splitTextToSize(reg.partnershipInterest || 'N/A', colWidth - 22);
        doc.text(objWrapped, col2X + 20, ptY);

        py += boxHeight + 2;
      }

      // Speaker Extra Box
      if (isSpeaker) {
        py += 3;
        const boxHeight = 14 + (doc.splitTextToSize((reg as any).bio || 'Guest Speaker', fullSpanWidth - 25).length - 1) * 3.5;
        doc.setFillColor(...colors.bgLight);
        doc.setDrawColor(...colors.borderLight);
        doc.roundedRect(cardX + 4, py, contentWidth - 8, boxHeight, 1, 1, 'FD');

        let spY = py + 4.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...colors.yellow);
        doc.text('GUEST SPEAKER PROFILE:', cardX + 7, spY);

        spY += 4.2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.textMuted);
        doc.text('Bio/Topic:', cardX + 7, spY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textDark);
        const bioWrapped = doc.splitTextToSize((reg as any).bio || 'Guest Speaker at Startup Summit 2026', fullSpanWidth - 25);
        doc.text(bioWrapped, cardX + 23, spY);

        py += boxHeight + 2;
      }

      // Special Requirements
      if (reg.specialRequirements) {
        py += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...colors.textMuted);
        doc.text('SPECIAL REQS:', col1X, py);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.accent);
        const reqsWrapped = doc.splitTextToSize(reg.specialRequirements, fullSpanWidth - 30);
        doc.text(reqsWrapped, col1X + 25, py);
      }

      currentY += totalCardHeight + 5;
    });

    // Add Page Numbers Footer across all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...colors.textMuted);
      doc.text(
        `Startup Summit Botswana 2026 Official Registration Report | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }
  }

  // Save PDF File
  const filename = `startup_summit_botswana_registrations_${mode}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
