import React, { useEffect, useMemo, useState } from 'react';
import '../styles/JobDetail.css';
import { jobsAPI } from '../services/api';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export default function JobDetail({ jobId, onBack }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    jobsAPI
      .get(jobId)
      .then((response) => {
        if (cancelled) return;
        setJob(response);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load job details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const timeline = useMemo(() => {
    if (!job) return [];
    const events = [
      { label: 'Job created', time: job.created_at },
      { label: 'Service scheduled', time: job.scheduled_date },
    ];

    if (job.updated_at && job.updated_at !== job.created_at) {
      events.push({ label: 'Last updated', time: job.updated_at });
    }

    return events;
  }, [job]);

  const billingItems = useMemo(() => {
    if (!job) return [];
    return [
      { label: 'Service Charge', amount: job.service_request?.cost },
      { label: 'Labor', amount: job.labor_cost },
      { label: 'Parts', amount: job.parts_cost },
      { label: 'Total', amount: job.total_cost, isTotal: true },
    ];
  }, [job]);

  const notes = job?.notes
    ? [{ text: job.notes, time: job.updated_at || job.created_at, visible: true }]
    : [];

  if (loading) {
    return (
      <div className="job-detail loading">
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail error">
        <p>{error}</p>
        <button className="btn-primary" onClick={onBack}>Back</button>
      </div>
    );
  }

  const customer = job?.service_request?.appliance;
  const product = customer
    ? {
        category: customer.category,
        brand: customer.brand,
        model: customer.model,
        serial: customer.serial_number,
        warranty: customer.warranty_status,
      }
    : null;
  const serviceInfo = job?.service_request;

  return (
    <div className="job-detail">
      <div className="job-detail-header">
        <div>
          <h1>Ticket #{job?.job_number || job?.ticketNo}</h1>
          <span className={`status-badge ${job?.status?.toLowerCase().replace(' ', '-')}`}>
            {job?.status}
          </span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onBack}>Back</button>
        </div>
      </div>

      <div className="job-detail-content">
        <div className="job-summary">
          <section className="summary-section">
            <h3>Customer</h3>
            <div className="summary-row">
              <span className="label">Name:</span>
              <span>{customer?.customer_name || '-'}</span>
            </div>
            <div className="summary-row">
              <span className="label">Mobile:</span>
              <span>{customer?.phone || '-'}</span>
            </div>
            <div className="summary-row">
              <span className="label">Address:</span>
              <span>{customer?.location || customer?.address || '-'}</span>
            </div>
          </section>

          <section className="summary-section">
            <h3>Product</h3>
            <div className="summary-row"><span className="label">Category:</span><span>{product?.category || '-'}</span></div>
            <div className="summary-row"><span className="label">Brand:</span><span>{product?.brand || '-'}</span></div>
            <div className="summary-row"><span className="label">Model:</span><span>{product?.model || '-'}</span></div>
            <div className="summary-row"><span className="label">Serial:</span><span>{product?.serial || '-'}</span></div>
            <div className="summary-row"><span className="label">Warranty:</span><span>{product?.warranty?.toUpperCase() || '-'}</span></div>
            <div className="summary-row"><span className="label">Purchase Date:</span><span>{formatDate(customer?.purchase_date)}</span></div>
          </section>

          <section className="summary-section">
            <h3>Service Info</h3>
            <div className="summary-row"><span className="label">Type:</span><span>{serviceInfo?.service_type?.replace('_', ' ') || '-'}</span></div>
            <div className="summary-row"><span className="label">Created:</span><span>{formatDateTime(job?.created_at)}</span></div>
            <div className="summary-row"><span className="label">Scheduled:</span><span>{formatDate(job?.scheduled_date)}</span></div>
            <div className="summary-row"><span className="label">Priority:</span><span>{job?.priority || '-'}</span></div>
            <div className="summary-row"><span className="label">Technician:</span><span>{job?.technician?.name || serviceInfo?.technician_name || 'Unassigned'}</span></div>
          </section>
        </div>

        <div className="job-timeline">
          <section className="timeline-section">
            <h3>Timeline</h3>
            <div className="timeline">
              {timeline.map((entry, idx) => (
                <div key={idx} className="timeline-entry">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-event">{entry.label}</div>
                    <div className="timeline-time">{formatDateTime(entry.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="timeline-section">
            <h3>Notes & Logs</h3>
            <div className="notes-list">
              {notes.length ? (
                notes.map((note, idx) => (
                  <div key={idx} className="note-item">
                    <div className="note-time">{formatDateTime(note.time)}</div>
                    <div className="note-text">{note.text}</div>
                    <div className="note-visibility">{note.visible ? 'Visible to customer' : 'Internal only'}</div>
                  </div>
                ))
              ) : (
                <p>No notes yet.</p>
              )}
            </div>
          </section>

          <section className="timeline-section">
            <h3>Attachments</h3>
            <button className="btn-secondary">Upload Image</button>
          </section>
        </div>
      </div>

      <section className="job-billing">
        <h3>Billing & Charges</h3>
        <table className="billing-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {billingItems.map((item, idx) => (
              <tr key={idx} className={item.isTotal ? 'billing-total' : ''}>
                <td>{item.label}</td>
                <td>Rs {item.amount !== undefined && item.amount !== null ? item.amount : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="billing-actions">
          <button className="btn-primary">Mark Payment Received</button>
          <button className="btn-secondary">Send Invoice by SMS/Email</button>
        </div>
      </section>
    </div>
  );
}
