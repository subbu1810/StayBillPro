const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');

function generatePdf() {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    // Color Palette
    const primaryDark = [15, 23, 42];     // #0F172A (Deep Slate)
    const brandBlue = [37, 99, 235];      // #2563EB (Royal Blue)
    const lightSlate = [248, 250, 252];   // #F8FAFC
    const borderGray = [226, 232, 240];   // #E2E8F0
    const textDark = [30, 41, 59];        // #1E293B
    const textMuted = [100, 116, 139];    // #64748B

    // Helper: Draw Section Title
    function drawSectionTitle(title, y) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...brandBlue);
        doc.text(title.toUpperCase(), margin, y);

        doc.setDrawColor(...brandBlue);
        doc.setLineWidth(1.5);
        doc.line(margin, y + 4, margin + 40, y + 4);

        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.5);
        doc.line(margin + 45, y + 4, margin + contentWidth, y + 4);

        return y + 20;
    }

    // ==========================================
    // PAGE 1: TITLE, PROJECT SUMMARY & OBJECTIVES
    // ==========================================

    // Top Header Banner
    doc.setFillColor(...primaryDark);
    doc.rect(0, 0, pageWidth, 90, 'F');

    // Accent line below banner
    doc.setFillColor(...brandBlue);
    doc.rect(0, 90, pageWidth, 4, 'F');

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('StayBillPro – Internship Project Dossier', margin, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(203, 213, 225); // Light slate text
    doc.text('Electronics Service Management & POS ERP System | S Square G Tech Solutions', margin, 56);
    doc.text('Official Documentation of Intern Involvement, Project Scope & Technical Objectives', margin, 72);

    let currentY = 118;

    // Project Executive Overview Box
    doc.setFillColor(...lightSlate);
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(1);
    doc.roundedRect(margin, currentY, contentWidth, 75, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...textDark);
    doc.text('Project Overview:', margin + 12, currentY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const overviewText = 
        'StayBillPro is a specialized, production-ready ERP and billing platform built for electronics service ' +
        'centers, repair workshops, and multi-branch appliance service enterprises. The system centralizes ' +
        'the complete service lifecycle—from customer job-sheet registration and diagnosis tracking to automated ' +
        'GST-compliant POS invoicing, spare-parts inventory, technician allocation, and real-time business analytics.';
    
    const splitOverview = doc.splitTextToSize(overviewText, contentWidth - 24);
    doc.text(splitOverview, margin + 12, currentY + 34);

    currentY += 92;

    // Section 1: Internship Objectives
    currentY = drawSectionTitle('1. Internship Project Objectives', currentY);

    const objectives = [
        {
            label: 'Primary Project Objective:',
            desc: 'To design, develop, and integrate user-centric frontend modules for StayBillPro that automate manual repair shop workflows, reduce administrative turnaround time by 60%, and deliver real-time service visibility.'
        },
        {
            label: 'Technical Architecture Objective:',
            desc: 'Master component-driven development using React 19, modern state synchronization, dynamic client-side PDF document generation (jsPDF), barcode automation, and resilient RESTful API integration patterns.'
        },
        {
            label: 'ERP & Business Domain Objective:',
            desc: 'Gain deep practical experience in building enterprise-grade operational systems, including tax-compliant billing (GST), inventory reordering workflows (PO & GRN), and role-based multi-tier access control.'
        },
        {
            label: 'Quality & Scalability Objective:',
            desc: 'Implement responsive, accessible UI standards across mobile, tablet, and desktop devices, while enforcing clean code modularity, strict form validation, and edge-case testing.'
        }
    ];

    objectives.forEach(obj => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...textDark);
        doc.text('•  ' + obj.label, margin + 8, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const splitDesc = doc.splitTextToSize(obj.desc, contentWidth - 25);
        doc.text(splitDesc, margin + 20, currentY + 13);

        currentY += 16 + (splitDesc.length * 10);
    });

    currentY += 10;

    // Section 2: Technology Stack & Architectural Matrix
    currentY = drawSectionTitle('2. Technology Stack & Implementation Scope', currentY);

    autoTable.default(doc, {
        startY: currentY,
        margin: { left: margin, right: margin + 1 },
        tableWidth: 514,
        head: [['Technology / Library', 'Role in StayBillPro', 'Practical Skills Demonstrated']],
        body: [
            ['React 19 & JavaScript (ES6+)', 'Core UI architecture, SPA routing & dynamic components', 'Hooks, Component Lifecycle, Reusable UI Patterns'],
            ['jsPDF & jsPDF-AutoTable', 'Client-side PDF generator for invoices, estimates & job sheets', 'Dynamic layouting, table calculations, printable exports'],
            ['React Barcode & Scanner Overlay', 'Appliance tracking & item serial labeling', 'Hardware scanner integration, barcode encoding & decoding'],
            ['Lucide React & CSS3 Modular', 'Consistent iconography, responsive layouts (Flex/Grid)', 'Modern UI design, responsive dashboards, dark/light styles'],
            ['Razorpay API / Payment Modals', 'Online billing, subscription recharges & wallet management', 'Payment gateway webhooks, transaction status tracking'],
            ['Branch & Role Security Architecture', 'Hierarchical permissions (Admin, Technician, Staff)', 'RBAC principles, route gating, sensitive data isolation']
        ],
        theme: 'grid',
        headStyles: {
            fillColor: primaryDark,
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'left'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: textDark,
            cellPadding: 5
        },
        alternateRowStyles: {
            fillColor: lightSlate
        },
        columnStyles: {
            0: { cellWidth: 140, fontStyle: 'bold' },
            1: { cellWidth: 204 },
            2: { cellWidth: 170 }
        }
    });

    // ==========================================
    // PAGE 2: MODULES & INTERN CONTRIBUTIONS
    // ==========================================
    doc.addPage();

    // Compact Top Banner for subsequent pages
    doc.setFillColor(...primaryDark);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFillColor(...brandBlue);
    doc.rect(0, 40, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('StayBillPro – Core Modules & Intern Involvement', margin, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('S Square G Tech Solutions', pageWidth - margin - 120, 25);

    currentY = 65;

    currentY = drawSectionTitle('3. Core System Modules Developed & Maintained', currentY);

    autoTable.default(doc, {
        startY: currentY,
        margin: { left: margin, right: margin + 1 },
        tableWidth: 514,
        head: [['Module Name', 'Functional Scope', 'Intern Involvement / Deliverables']],
        body: [
            [
                'Job Sheet & Service Ticketing',
                'Comprehensive lifecycle tracking of faulty electronics, diagnosis reports, and technician assignments.',
                'Designed New Job intake modal, status filters (Pending, In Progress, Delivered), and technician assignment dropdown.'
            ],
            [
                'POS & Wholesale Invoicing',
                'Fast billing counter for service charges, spare parts, tax breakdowns (CGST/SGST), and discount rules.',
                'Engineered POS cart interface, automatic total/tax calculations, and instant thermal & A4 invoice printing.'
            ],
            [
                'Inventory & Procurement (PO/GRN)',
                'Stock level tracking, low-inventory alerts, purchase order creation, and goods received note processing.',
                'Created CreatePOModal, GRN entry views, and real-time inventory deduction logic upon job completion.'
            ],
            [
                'Barcode Generation & Labeling',
                'Instant barcode label generation for intake appliances to prevent unit mix-ups during multi-day repair.',
                'Integrated react-barcode modal, formatted printable sticker sheets, and built camera-based scan overlays.'
            ],
            [
                'Financial Accounting & Cashbook',
                'Daily service cashbook, technician payouts, expense logs, and GST compliance auditing tables.',
                'Implemented ServiceCashbookScreen, ledger filter tabs, payment reconciliation screens, and data tables.'
            ],
            [
                'Customer & Multi-Branch Hub',
                'Centralized CRM storing customer appliance histories, SMS/WhatsApp alerts, and branch-level filters.',
                'Constructed customer profile view, service history timeline, and branch switching security guards.'
            ]
        ],
        theme: 'grid',
        headStyles: {
            fillColor: primaryDark,
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: textDark,
            cellPadding: 6
        },
        alternateRowStyles: {
            fillColor: lightSlate
        },
        columnStyles: {
            0: { cellWidth: 124, fontStyle: 'bold' },
            1: { cellWidth: 195 },
            2: { cellWidth: 195 }
        }
    });

    currentY = doc.lastAutoTable.finalY + 25;

    // Section 4: Intern Work Profiles & Scope
    currentY = drawSectionTitle('4. Key Intern Work Profiles & Responsibilities', currentY);

    const roles = [
        {
            role: 'Profile A: Frontend & React Developer Intern',
            bullets: [
                'Engineered modular React components adhering to clean architecture and reusable design patterns.',
                'Integrated jsPDF and canvas libraries for dynamic invoice generation and barcode label rendering.',
                'Optimized client-side rendering performance, state management, and modal interaction speeds.'
            ]
        },
        {
            role: 'Profile B: UI/UX & Responsive Web Development Intern',
            bullets: [
                'Designed responsive UI layouts tested on mobile service technician views and high-res cashier monitors.',
                'Built intuitive forms with real-time field validation, error handling, and toast feedback notifications.',
                'Standardized color schemes, modern card components, typography, and accessibility features.'
            ]
        },
        {
            role: 'Profile C: Quality Assurance & Integration Intern',
            bullets: [
                'Formulated end-to-end user test cases spanning job creation, part allocation, and billing checkout.',
                'Conducted rigorous cross-browser testing (Chrome, Edge, Firefox) and responsive viewport stress testing.',
                'Documented edge-case bugs, API payload mismatches, and assisted in production patch deployments.'
            ]
        }
    ];

    roles.forEach(r => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...brandBlue);
        doc.text(r.role, margin + 4, currentY);
        currentY += 12;

        r.bullets.forEach(b => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);
            const splitBullet = doc.splitTextToSize('•  ' + b, contentWidth - 16);
            doc.text(splitBullet, margin + 14, currentY);
            currentY += (splitBullet.length * 10) + 2;
        });
        currentY += 6;
    });

    // ==========================================
    // PAGE 3: RESUME BULLETS, CERTIFICATION & SIGN-OFF
    // ==========================================
    doc.addPage();

    doc.setFillColor(...primaryDark);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFillColor(...brandBlue);
    doc.rect(0, 40, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('StayBillPro – Resume Showcase & Verification', margin, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('S Square G Tech Solutions', pageWidth - margin - 120, 25);

    currentY = 65;

    currentY = drawSectionTitle('5. Resume Ready Bullet Points (For Intern Portfolios)', currentY);

    const resumeBoxes = [
        {
            title: 'Action & Impact Bullet Points (Copy & Paste for Resume / LinkedIn):',
            items: [
                'Contributed to the frontend engineering of "StayBillPro", a multi-tenant ERP platform powering 1000+ service centers and 50k+ managed appliances.',
                'Architected 15+ reusable React 19 UI components for service request tickets, inventory stock logs, and technician dashboards.',
                'Integrated automated, client-side PDF invoice and job-sheet rendering using jsPDF and AutoTable, saving ~35 hours of manual billing per month.',
                'Built instant barcode sticker generation and camera-assisted scanning features, reducing device mix-ups and turnaround time by 40%.',
                'Collaborated in an agile team environment, conducting Git code reviews, bug fixes, and cross-browser quality assurance.'
            ]
        }
    ];

    resumeBoxes.forEach(rb => {
        doc.setFillColor(...lightSlate);
        doc.setDrawColor(...borderGray);
        doc.roundedRect(margin, currentY, contentWidth, 125, 4, 4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...textDark);
        doc.text(rb.title, margin + 12, currentY + 16);

        let itemY = currentY + 30;
        rb.items.forEach(item => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
            const splitItem = doc.splitTextToSize('•  ' + item, contentWidth - 24);
            doc.text(splitItem, margin + 12, itemY);
            itemY += (splitItem.length * 9.5) + 3;
        });

        currentY += 140;
    });

    currentY = drawSectionTitle('6. Official Internship Sign-Off & Verification Details', currentY);

    // Form fields table for mentor/intern verification
    autoTable.default(doc, {
        startY: currentY,
        margin: { left: margin, right: margin + 1 },
        tableWidth: 514,
        head: [['Field', 'Details / Intern Record']],
        body: [
            ['Intern Name:', '________________________________________________'],
            ['College / Institution:', '________________________________________________'],
            ['Project Assigned:', 'StayBillPro – Service ERP & POS Platform'],
            ['Organization / Company:', 'S Square G Tech Solutions (www.ssquareg.com)'],
            ['Internship Duration:', '_____ / _____ / 20___   to   _____ / _____ / 20___'],
            ['Assigned Role:', '[ ] React Frontend Dev   [ ] Full-Stack   [ ] QA & Testing'],
            ['Mentor / Supervisor:', 'Technical Lead, StayBillPro Project Team'],
            ['Overall Performance:', '[ ] Outstanding    [ ] Excellent    [ ] Commendable']
        ],
        theme: 'plain',
        bodyStyles: {
            fontSize: 8.5,
            textColor: textDark,
            cellPadding: 4.5
        },
        columnStyles: {
            0: { cellWidth: 140, fontStyle: 'bold', textColor: [51, 65, 85] },
            1: { cellWidth: 374 }
        }
    });

    currentY = doc.lastAutoTable.finalY + 35;

    // Signature Blocks
    const sigBoxWidth = (contentWidth - 40) / 2;

    // Intern Signature Block
    doc.setDrawColor(...borderGray);
    doc.line(margin + 10, currentY + 45, margin + 10 + sigBoxWidth - 20, currentY + 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text('Intern Signature', margin + 10, currentY + 58);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('Date: ________________________', margin + 10, currentY + 70);

    // Mentor / Authorizing Officer Block
    const rightSigX = margin + sigBoxWidth + 40;
    doc.line(rightSigX, currentY + 45, rightSigX + sigBoxWidth - 20, currentY + 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text('Authorized Signatory / Project Lead', rightSigX, currentY + 58);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('S Square G Tech Solutions (Official Seal)', rightSigX, currentY + 70);

    // ==========================================
    // FOOTER (ALL PAGES)
    // ==========================================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer divider
        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...textMuted);
        doc.text('StayBillPro ERP © S Square G Tech Solutions | Confidential & Internal Academic Document', margin, pageHeight - 18);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 18);
    }

    // Save PDF in root and in public directory
    const outputFilename = 'StayBillPro_Internship_Project_Details_and_Objectives.pdf';
    const rootPath = path.resolve(__dirname, '..', outputFilename);
    const publicPath = path.resolve(__dirname, '..', 'public', outputFilename);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(rootPath, pdfBuffer);
    console.log(`Saved PDF to: ${rootPath}`);

    // If public directory exists, write there as well
    if (fs.existsSync(path.resolve(__dirname, '..', 'public'))) {
        fs.writeFileSync(publicPath, pdfBuffer);
        console.log(`Saved copy to: ${publicPath}`);
    }

    return { rootPath, publicPath };
}

try {
    generatePdf();
    console.log('PDF generation complete!');
} catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
}
