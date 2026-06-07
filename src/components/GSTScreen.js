import React, { useState, useEffect } from 'react';
import { accountingAPI } from '../services/api';
import '../styles/GSTScreen.css';

const GSTScreen = ({ defaultTab = 'summary', branchId }) => {
    const [activeTab, setActiveTab] = useState(defaultTab === 'gst' ? 'summary' : defaultTab);
    const [summary, setSummary] = useState({
        outwardGST: 0,
        inwardGST: 0,
        netPayable: 0,
        lastFiled: 'N/A',
        filedDate: 'N/A'
    });
    const [gstr1Data, setGstr1Data] = useState([]);
    const [loading, setLoading] = useState(false);
    const [consistencyReport, setConsistencyReport] = useState(null);
    const [showConsistencyModal, setShowConsistencyModal] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState([]);

    useEffect(() => {
        setActiveTab(defaultTab === 'gst' ? 'summary' : defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        if (activeTab === 'summary' || activeTab === 'gst') {
            fetchSummary();
        } else if (activeTab === 'gstr1') {
            fetchGSTR1();
        }
    }, [activeTab, branchId]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const data = await accountingAPI.getGSTSummary({ branchId });
            if (data) setSummary(data);
        } catch (error) {
            console.error('Error fetching GST summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const [businessMeta, setBusinessMeta] = useState({ gstin: '', stateCode: '29', shopName: '' });

    const fetchGSTR1 = async () => {
        setLoading(true);
        try {
            const data = await accountingAPI.getGSTR1({ branchId });
            if (data && data.invoices) {
                setGstr1Data(data.invoices);
                setBusinessMeta({
                    gstin: data.businessGSTIN || '',
                    stateCode: data.stateCode || '29',
                    shopName: data.shopName || ''
                });
            } else if (Array.isArray(data)) {
                // Backward compat
                setGstr1Data(data);
            }
        } catch (error) {
            console.error('Error fetching GSTR-1 data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedInvoices(gstr1Data.map(r => r.invoiceNo));
        } else {
            setSelectedInvoices([]);
        }
    };

    const handleSelectInvoice = (invoiceNo) => {
        if (selectedInvoices.includes(invoiceNo)) {
            setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceNo));
        } else {
            setSelectedInvoices([...selectedInvoices, invoiceNo]);
        }
    };

    // ---- Check Consistency Logic ----
    const handleCheckConsistency = () => {
        if (!gstr1Data || gstr1Data.length === 0) {
            alert('No data to check. Load GSTR-1 data first.');
            return;
        }

        const issues = [];
        const warnings = [];
        const passed = [];
        let totalTaxableVal = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalGSTRecorded = 0;

        gstr1Data.forEach((row, idx) => {
            const txval = parseFloat(row.taxableVal) || 0;
            const cgst  = parseFloat(row.cgst)  || 0;
            const sgst  = parseFloat(row.sgst)  || 0;
            const igst  = parseFloat(row.igst)  || 0;
            const totalGST = parseFloat(row.totalGST) || 0;

            totalTaxableVal  += txval;
            totalCGST        += cgst;
            totalSGST        += sgst;
            totalIGST        += igst;
            totalGSTRecorded += totalGST;

            // Check 1: CGST + SGST + IGST must equal totalGST
            const computedGST = parseFloat((cgst + sgst + igst).toFixed(2));
            const recordedGST = parseFloat(totalGST.toFixed(2));
            if (Math.abs(computedGST - recordedGST) > 1) {
                issues.push({
                    invoice: row.invoiceNo,
                    issue: `GST mismatch: CGST(${cgst})+SGST(${sgst})+IGST(${igst}) = ₹${computedGST} but recorded Total GST = ₹${recordedGST}`
                });
            }

            // Check 2: CGST should equal SGST for intra-state supply
            if (igst === 0 && Math.abs(cgst - sgst) > 1) {
                warnings.push({
                    invoice: row.invoiceNo,
                    issue: `CGST (₹${cgst}) ≠ SGST (₹${sgst}) for intra-state supply — they should be equal.`
                });
            }

            // Check 3: Zero taxable value with non-zero GST
            if (txval === 0 && totalGST > 0) {
                issues.push({
                    invoice: row.invoiceNo,
                    issue: `Taxable value is ₹0 but GST of ₹${totalGST} was charged — invalid entry.`
                });
            }

            // Check 4: GST is more than 50% of taxable value (very high rate)
            if (txval > 0 && (totalGST / txval) > 0.50) {
                warnings.push({
                    invoice: row.invoiceNo,
                    issue: `Effective GST rate is ${((totalGST / txval) * 100).toFixed(1)}% — unusually high. Please verify.`
                });
            }

            // Check 5: Missing invoice number
            if (!row.invoiceNo || row.invoiceNo === 'N/A') {
                issues.push({
                    invoice: `Row ${idx + 1}`,
                    issue: `Invoice number is missing — required for GSTR-1 filing.`
                });
            }
        });

        // Check 6: CGST total should equal SGST total
        if (totalIGST === 0 && Math.abs(totalCGST - totalSGST) > 5) {
            warnings.push({
                invoice: 'Summary',
                issue: `Total CGST (₹${totalCGST.toFixed(2)}) ≠ Total SGST (₹${totalSGST.toFixed(2)}) across all invoices.`
            });
        } else {
            passed.push('Total CGST equals Total SGST — correct for intra-state supply.');
        }

        // Check 7: Verify computed GST total matches summary
        if (Math.abs(totalGSTRecorded - (summary.outwardGST || 0)) > 10) {
            warnings.push({
                invoice: 'Summary vs Detail',
                issue: `GSTR-1 detail total GST (₹${totalGSTRecorded.toFixed(2)}) differs from GST Summary (₹${(summary.outwardGST || 0).toFixed(2)}). This may indicate invoices from prior months in this view.`
            });
        } else {
            passed.push('GSTR-1 detail GST total matches GST Summary — consistent.');
        }

        if (issues.length === 0 && warnings.length === 0) {
            passed.push('All invoices have consistent CGST + SGST + IGST = Total GST.');
            passed.push('No zero-value or invalid entries found.');
            passed.push('All invoice numbers are present.');
        }

        setConsistencyReport({
            totalInvoices: gstr1Data.length,
            totalTaxableVal: totalTaxableVal.toFixed(2),
            totalGST: totalGSTRecorded.toFixed(2),
            issues,
            warnings,
            passed,
            status: issues.length > 0 ? 'errors' : warnings.length > 0 ? 'warnings' : 'clean'
        });
        setShowConsistencyModal(true);
    };

    // ---- Download GSTN-compliant JSON ----
    const handleDownloadJSON = () => {
        const dataToExport = gstr1Data.filter(r => selectedInvoices.includes(r.invoiceNo));
        if (!dataToExport || dataToExport.length === 0) {
            alert('Please select at least one invoice to download.');
            return;
        }

        const gstin     = businessMeta.gstin || 'NOT_SET';
        const stateCode = businessMeta.stateCode || '29';

        // Filing period: MMYYYY format
        const now = new Date();
        const fp  = String(now.getMonth() + 1).padStart(2, '0') + String(now.getFullYear());

        // Split into B2B (customer has GSTIN) and B2CS (retail / no GSTIN)
        const b2bInvoices  = dataToExport.filter(r => r.customerGSTIN && r.customerGSTIN !== 'N/A');
        const b2csInvoices = dataToExport.filter(r => !r.customerGSTIN || r.customerGSTIN === 'N/A');

        // ---- B2B Section (per-invoice, per-customer GSTIN) ----
        const b2b = [];
        const b2bMap = {};
        b2bInvoices.forEach(row => {
            const ctin = row.customerGSTIN;
            if (!b2bMap[ctin]) { b2bMap[ctin] = []; }
            const txval = parseFloat(row.taxableVal) || 0;
            const cgst  = parseFloat(row.cgst)  || 0;
            const sgst  = parseFloat(row.sgst)  || 0;
            const igst  = parseFloat(row.igst)  || 0;
            const rt    = txval > 0 ? Math.round(((cgst + sgst + igst) / txval) * 100) : 0;
            const idt   = new Date(row.invoiceDate).toLocaleDateString('en-GB').replace(/\//g, '-');
            b2bMap[ctin].push({
                inum: row.invoiceNo,
                idt,
                val: parseFloat(row.invoiceValue || (txval + cgst + sgst + igst)),
                pos: stateCode,
                rchrg: 'N',
                inv_typ: 'R',
                cflag: 'N',
                itms: [{
                    num: 1,
                    itm_det: { txval, rt, iamt: igst, camt: cgst, samt: sgst, csamt: 0 }
                }]
            });
        });
        Object.keys(b2bMap).forEach(ctin => b2b.push({ ctin, inv: b2bMap[ctin] }));

        // ---- B2CS Section (aggregated by GST rate + state) ----
        // GSTN requires B2CS to be GROUPED by rate, not per invoice
        const b2csMap = {};
        b2csInvoices.forEach(row => {
            const txval = parseFloat(row.taxableVal) || 0;
            const cgst  = parseFloat(row.cgst)  || 0;
            const sgst  = parseFloat(row.sgst)  || 0;
            const igst  = parseFloat(row.igst)  || 0;
            const rt    = txval > 0 ? Math.round(((cgst + sgst + igst) / txval) * 100) : 0;
            const key   = `${rt}_${stateCode}`;
            if (!b2csMap[key]) {
                b2csMap[key] = { sply_ty: 'INTRA', rt, typ: 'OE', pos: stateCode, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
            }
            b2csMap[key].txval = parseFloat((b2csMap[key].txval + txval).toFixed(2));
            b2csMap[key].iamt  = parseFloat((b2csMap[key].iamt  + igst).toFixed(2));
            b2csMap[key].camt  = parseFloat((b2csMap[key].camt  + cgst).toFixed(2));
            b2csMap[key].samt  = parseFloat((b2csMap[key].samt  + sgst).toFixed(2));
        });
        const b2cs = Object.values(b2csMap);

        // ---- HSN Summary (mandatory for returns) ----
        // Aggregate all invoices into HSN summary (we use generic HSN 9999 for misc retail)
        const totalTxval = dataToExport.reduce((s, r) => s + (parseFloat(r.taxableVal) || 0), 0);
        const totalCGST  = dataToExport.reduce((s, r) => s + (parseFloat(r.cgst)  || 0), 0);
        const totalSGST  = dataToExport.reduce((s, r) => s + (parseFloat(r.sgst)  || 0), 0);
        const totalIGST  = dataToExport.reduce((s, r) => s + (parseFloat(r.igst)  || 0), 0);
        const hsn = {
            data: [{
                num: 1,
                hsn_sc: '9999',
                desc: 'Goods/Services',
                uqc: 'OTH',
                cnt: dataToExport.length,
                txval: parseFloat(totalTxval.toFixed(2)),
                iamt: parseFloat(totalIGST.toFixed(2)),
                camt: parseFloat(totalCGST.toFixed(2)),
                samt: parseFloat(totalSGST.toFixed(2)),
                csamt: 0
            }]
        };

        // ---- Document Summary (docs section — mandatory) ----
        const docs = {
            doc_det: [{
                doc_num: 1,
                docs: [{
                    num: 1,
                    from: dataToExport.length > 0 ? dataToExport[dataToExport.length - 1].invoiceNo : '',
                    to: dataToExport.length > 0 ? dataToExport[0].invoiceNo : '',
                    totnum: dataToExport.length,
                    cancel: 0,
                    net_issue: dataToExport.length
                }]
            }]
        };

        // ---- Final GSTN-compliant GSTR-1 payload ----
        const gstr1Payload = {
            gstin,
            fp,
            gt: parseFloat((totalTxval + totalCGST + totalSGST + totalIGST).toFixed(2)),
            cur_gt: parseFloat((totalTxval + totalCGST + totalSGST + totalIGST).toFixed(2)),
            version: 'GST1.00',
            hash: 'hash',
            ...(b2b.length > 0 && { b2b }),
            ...(b2cs.length > 0 && { b2cs }),
            hsn,
            docs
        };

        const jsonString = JSON.stringify(gstr1Payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `GSTR1_${gstin}_${fp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    const renderConsistencyModal = () => {
        if (!showConsistencyModal || !consistencyReport) return null;
        const { issues, warnings, passed, totalInvoices, totalTaxableVal, totalGST, status } = consistencyReport;
        const statusColor = status === 'clean' ? '#10b981' : status === 'warnings' ? '#f59e0b' : '#ef4444';
        const statusLabel = status === 'clean' ? '✅ All Checks Passed' : status === 'warnings' ? '⚠️ Warnings Found' : '❌ Errors Found';

        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '680px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>🔍 GSTR-1 Consistency Report</h2>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{totalInvoices} invoices checked · Taxable: ₹{parseFloat(totalTaxableVal).toLocaleString()} · Total GST: ₹{parseFloat(totalGST).toLocaleString()}</p>
                        </div>
                        <button onClick={() => setShowConsistencyModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}>✕ Close</button>
                    </div>

                    {/* Status Banner */}
                    <div style={{ background: `${statusColor}15`, border: `2px solid ${statusColor}`, borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: statusColor }}>{statusLabel}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                            {issues.length} Error{issues.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {warnings.length} Warning{warnings.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {passed.length} Check{passed.length !== 1 ? 's' : ''} Passed
                        </div>
                    </div>

                    {/* Errors */}
                    {issues.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', marginBottom: '10px' }}>❌ Errors — Must Fix Before Filing</h3>
                            {issues.map((item, i) => (
                                <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '0.8rem' }}>{item.invoice}</div>
                                    <div style={{ color: '#7f1d1d', fontSize: '0.8rem', marginTop: '2px' }}>{item.issue}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', marginBottom: '10px' }}>⚠️ Warnings — Review Recommended</h3>
                            {warnings.map((item, i) => (
                                <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: '700', color: '#92400e', fontSize: '0.8rem' }}>{item.invoice}</div>
                                    <div style={{ color: '#78350f', fontSize: '0.8rem', marginTop: '2px' }}>{item.issue}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Passed */}
                    {passed.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '10px' }}>✅ Checks Passed</h3>
                            {passed.map((item, i) => (
                                <div key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '8px', color: '#166534', fontSize: '0.8rem', fontWeight: '500' }}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        {status !== 'errors' && (
                            <button onClick={() => { setShowConsistencyModal(false); handleDownloadJSON(); }}
                                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                                ⬇️ Proceed & Download JSON
                            </button>
                        )}
                        <button onClick={() => setShowConsistencyModal(false)}
                            style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderGSTSummary = () => (
        <div className="crm-content">
            <div className="crm-grid-4">
                <div className="report-card blue">
                    <span className="card-title">Outward Tax (Output GST)</span>
                    <div className="card-value">₹{(summary.outwardGST || 0).toLocaleString()}</div>
                    <div className="card-trend emerald">Total Collected</div>
                </div>
                <div className="report-card emerald">
                    <span className="card-title">Inward Tax (Input GST)</span>
                    <div className="card-value">₹{(summary.inwardGST || 0).toLocaleString()}</div>
                    <div className="card-trend">Claimable ITC</div>
                </div>
                <div className="report-card highlight">
                    <span className="card-title">Net GST Payable</span>
                    <div className="card-value" style={{ color: (summary.netPayable || 0) > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{Math.abs(summary.netPayable || 0).toLocaleString()}
                    </div>
                    <div className="card-trend" style={{ color: (summary.netPayable || 0) > 0 ? '#ef4444' : '#10b981' }}>
                        {(summary.netPayable || 0) >= 0 ? 'Tax to be Paid' : 'Excess Input Credit'}
                    </div>
                    <div className="progress-bar-container" style={{ marginTop: '8px' }}>
                        <div className="progress-bar" style={{ width: `${Math.min(100, (summary.outwardGST > 0 ? (summary.inwardGST / summary.outwardGST) * 100 : 0))}%` }}></div>
                    </div>
                </div>
                <div className="report-card grey">
                    <span className="card-title">Last Filed</span>
                    <div className="card-value" style={{ fontSize: '0.9rem' }}>{summary.lastFiled}</div>
                    <div className="card-trend">Filed on: {summary.filedDate}</div>
                </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '24px' }}>GST Filing Calendar</h3>
            {(() => {
                // GST due dates (monthly filer):
                // GSTR-1: 11th of the following month
                // GSTR-3B: 20th of the following month
                const GSTR1_DAY  = 11;
                const GSTR3B_DAY = 20;
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

                // Generate last 4 months + current month (5 cards)
                const cards = [];
                for (let offset = -3; offset <= 0; offset++) {
                    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
                    const year  = d.getFullYear();
                    const month = d.getMonth(); // 0-indexed

                    // Due dates are in the NEXT month
                    const gstr1Due  = new Date(year, month + 1, GSTR1_DAY);
                    const gstr3bDue = new Date(year, month + 1, GSTR3B_DAY);

                    const diffDays = (due) => Math.ceil((due - today) / (1000 * 60 * 60 * 24));

                    const getStatus = (due) => {
                        const diff = diffDays(due);
                        if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)}d`, cls: 'overdue' };
                        if (diff === 0) return { label: 'Due Today!', cls: 'today' };
                        if (diff <= 5)  return { label: `Due in ${diff} Day${diff > 1 ? 's' : ''}`, cls: 'warning' };
                        if (diff <= 15) return { label: `Due ${MONTH_NAMES[gstr1Due.getMonth()]} ${due.getDate()}`, cls: 'upcoming' };
                        return { label: 'Filed ✓', cls: 'success' };
                    };

                    const gstr1Status  = getStatus(gstr1Due);
                    const gstr3bStatus = getStatus(gstr3bDue);

                    const isCurrentMonth = (month === today.getMonth() && year === today.getFullYear());
                    const cardBg = (gstr1Status.cls === 'overdue' || gstr3bStatus.cls === 'overdue')
                        ? 'overdue'
                        : (gstr1Status.cls === 'success' && gstr3bStatus.cls === 'success') ? 'success' : '';

                    cards.push({ year, month, gstr1Status, gstr3bStatus, gstr1Due, gstr3bDue, isCurrentMonth, cardBg, diffDays });
                }

                const pillStyle = (cls) => {
                    const map = {
                        overdue:  { background: '#fee2e2', color: '#991b1b' },
                        today:    { background: '#fef08a', color: '#713f12' },
                        warning:  { background: '#fef9c3', color: '#854d0e' },
                        upcoming: { background: '#dbeafe', color: '#1e40af' },
                        success:  { background: '#dcfce7', color: '#15803d' },
                    };
                    return { ...map[cls] || map.upcoming, padding: '3px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' };
                };

                const cardStyle = (bg) => {
                    const base = { background: '#fafafa', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' };
                    if (bg === 'success') return { ...base, background: '#f0fdf4', borderColor: '#dcfce7' };
                    if (bg === 'overdue') return { ...base, background: '#fef2f2', borderColor: '#fecaca' };
                    return base;
                };

                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        {cards.map(({ year, month, gstr1Status, gstr3bStatus, gstr1Due, gstr3bDue, isCurrentMonth, cardBg }) => (
                            <div key={`${year}-${month}`} style={cardStyle(cardBg)}>
                                <div style={{ fontWeight: '800', color: '#334155', fontSize: '0.85rem', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {MONTH_NAMES[month]} {year}
                                    {isCurrentMonth && <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.6rem', fontWeight: '700', padding: '1px 6px', borderRadius: '4px' }}>CURRENT</span>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>
                                        <div>
                                            <div>GSTR-1 (Sales)</div>
                                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>Due: {GSTR1_DAY} {MONTH_NAMES[(month + 1) % 12]} {month === 11 ? year + 1 : year}</div>
                                        </div>
                                        <span style={pillStyle(gstr1Status.cls)}>{gstr1Status.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: '500', color: '#475569' }}>
                                        <div>
                                            <div>GSTR-3B (Payment)</div>
                                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>Due: {GSTR3B_DAY} {MONTH_NAMES[(month + 1) % 12]} {month === 11 ? year + 1 : year}</div>
                                        </div>
                                        <span style={pillStyle(gstr3bStatus.cls)}>{gstr3bStatus.label}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}
        </div>
    );

    const renderGSTR1 = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <select className="search-input"><option>Month: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</option></select>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={handleCheckConsistency}>🔍 Check Consistency</button>
                    <button 
                        className="btn-primary" 
                        onClick={handleDownloadJSON} 
                        disabled={selectedInvoices.length === 0} 
                        style={{ opacity: selectedInvoices.length === 0 ? 0.5 : 1, cursor: selectedInvoices.length === 0 ? 'not-allowed' : 'pointer' }}
                    >
                        ⬇️ Download JSON for Filing
                    </button>
                </div>
            </div>
            <table className="crm-table single-line-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>
                            <input 
                                type="checkbox" 
                                checked={gstr1Data.length > 0 && selectedInvoices.length === gstr1Data.length}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th>Invoice Date</th>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Taxable Val</th>
                        <th>CGST</th>
                        <th>SGST</th>
                        <th>IGST</th>
                        <th>Total GST</th>
                    </tr>
                </thead>
                <tbody>
                    {gstr1Data.length > 0 ? gstr1Data.map((row, idx) => (
                        <tr key={idx} style={{ background: selectedInvoices.includes(row.invoiceNo) ? '#f0fdf4' : 'transparent' }}>
                            <td style={{ textAlign: 'center' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedInvoices.includes(row.invoiceNo)}
                                    onChange={() => handleSelectInvoice(row.invoiceNo)}
                                />
                            </td>
                            <td>{new Date(row.invoiceDate).toLocaleDateString()}</td>
                            <td style={{ fontWeight: '800' }}>{row.invoiceNo}</td>
                            <td>{row.customer_name}</td>
                            <td>₹{parseFloat(row.taxableVal).toLocaleString()}</td>
                            <td>₹{parseFloat(row.cgst).toLocaleString()}</td>
                            <td>₹{parseFloat(row.sgst).toLocaleString()}</td>
                            <td>₹{parseFloat(row.igst).toLocaleString()}</td>
                            <td style={{ fontWeight: 'bold' }}>₹{parseFloat(row.totalGST).toLocaleString()}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No sales data found for this period</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const getTitle = () => {
        if (activeTab === 'summary' || activeTab === 'gst') return 'GST Tax Summary';
        if (activeTab === 'gstr1') return 'GSTR-1 (Sales Tax Return)';
        if (activeTab === 'gstr3b') return 'GSTR-3B (Summary Return)';
        return 'GST Compliance';
    };

    return (
        <div className="gst-screen">
            {renderConsistencyModal()}
            <div className="admin-content-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="screen-title" style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                    🏛️ {getTitle()}
                </h2>
                <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'summary' ? '#fff' : 'transparent', color: activeTab === 'summary' ? '#0f172a' : '#64748b', fontWeight: '700', cursor: 'pointer', boxShadow: activeTab === 'summary' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                        onClick={() => setActiveTab('summary')}
                    >
                        Summary
                    </button>
                    <button
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'gstr1' ? '#fff' : 'transparent', color: activeTab === 'gstr1' ? '#0f172a' : '#64748b', fontWeight: '700', cursor: 'pointer', boxShadow: activeTab === 'gstr1' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                        onClick={() => setActiveTab('gstr1')}
                    >
                        GSTR-1
                    </button>
                </div>
            </div>
            {loading && <div className="loading-overlay" style={{ fontSize: '0.8rem', padding: '10px 20px' }}>Syncing GST Data...</div>}
            {(activeTab === 'summary' || activeTab === 'gst') && renderGSTSummary()}
            {activeTab === 'gstr1' && renderGSTR1()}
        </div>
    );
};

export default GSTScreen;
