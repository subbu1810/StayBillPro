import { useState, useEffect } from "react";
import "../styles/CustomersForm.css";

import API_BASE from '../config/serverConfig';

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  category: "Retail",
  customerType: "Consumer",
  gstin: "",
  state: "",
  billingAddress: "",
  shippingAddress: "",
  sameAsBilling: true,
  openingBalance: 0,
  balanceType: "receivable",
  asOfDate: "",
  creditLimit: "",
};

function CustomerFormModal({ onClose, onSuccess, editData }) {
  const isEdit = Boolean(editData);
  const [customer, setCustomer] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setCustomer({
        firstName: editData.firstName || editData.first_name || "",
        lastName: editData.lastName || editData.last_name || "",
        email: editData.email || "",
        mobile: editData.mobile || "",
        category: editData.category || "Retail",
        customerType: editData.customerType || "Consumer",
        gstin: editData.gstin || "",
        state: editData.state || "",
        billingAddress: editData.billingAddress || "",
        shippingAddress: editData.shippingAddress || "",
        sameAsBilling: editData.sameAsBilling !== undefined ? editData.sameAsBilling : true,
        openingBalance: editData.openingBalance || 0,
        balanceType: editData.balanceType || "receivable",
        asOfDate: editData.asOfDate || "",
        creditLimit: editData.creditLimit || "",
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomer((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || null,
        mobile: customer.mobile,
        category: customer.category || "Retail",
        customerType: customer.customerType || "Consumer",
        gstin: customer.gstin || null,
        state: customer.state || null,
        billingAddress: customer.billingAddress || null,
        shippingAddress: customer.shippingAddress || null,
        sameAsBilling: customer.sameAsBilling,
        openingBalance: customer.openingBalance || 0,
        balanceType: customer.balanceType || "receivable",
        asOfDate: customer.asOfDate || null,
        creditLimit: customer.creditLimit || null,
      };

      const url = isEdit
        ? `${API_BASE}/customers/${editData.id}`
        : `${API_BASE}/customers`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to save customer");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = ["Retail", "Wholesale", "Corporate", "Individual"];
  const customerTypeOptions = ["Consumer", "Business", "Distributor"];
  const balanceTypeOptions = ["receivable", "payable"];

  return (
    <div className="cf-backdrop">

      {/* ── Top Bar ── */}
      <div className="cf-header">
        <div className="cf-header-left">
          <div className="cf-header-icon">{isEdit ? "✏️" : "👤"}</div>
          <div>
            <h2 className="cf-title">{isEdit ? "Edit Customer" : "Add New Customer"}</h2>
            <p className="cf-subtitle">
              {isEdit ? `Editing: ${editData.name || "Customer"}` : "Fill in customer details"}
            </p>
          </div>
        </div>
        <button className="cf-close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="cf-modal">

        {error && (
          <div className="cf-error">⚠ {error}</div>
        )}

        <form onSubmit={handleSubmit} className="cf-form">

          {/* Two-panel grid */}
          <div className="cf-panels">

            {/* ── LEFT PANEL ── */}
            <div className="cf-panel">

              {/* Basic Information */}
              <div className="cf-section">
                <p className="cf-section-label">Basic Information</p>

                <div className="cf-row">
                  <div className="cf-field">
                    <label className="cf-label">First Name <span className="cf-req">*</span></label>
                    <input
                      className="cf-input"
                      type="text"
                      name="firstName"
                      placeholder="e.g. Rajesh"
                      value={customer.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Last Name</label>
                    <input
                      className="cf-input"
                      type="text"
                      name="lastName"
                      placeholder="e.g. Kumar"
                      value={customer.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="cf-row">
                  <div className="cf-field">
                    <label className="cf-label">Mobile <span className="cf-req">*</span></label>
                    <input
                      className="cf-input"
                      type="tel"
                      maxLength="10"
                      name="mobile"
                      placeholder="e.g. 9876543210"
                      value={customer.mobile}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Email</label>
                    <input
                      className="cf-input"
                      type="email"
                      name="email"
                      placeholder="e.g. rajesh@email.com"
                      value={customer.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="cf-row">
                  <div className="cf-field">
                    <label className="cf-label">Category</label>
                    <select className="cf-select" name="category" value={customer.category} onChange={handleChange}>
                      {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Customer Type</label>
                    <select className="cf-select" name="customerType" value={customer.customerType} onChange={handleChange}>
                      {customerTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="cf-row">
                  <div className="cf-field">
                    <label className="cf-label">GSTIN</label>
                    <input
                      className="cf-input"
                      type="text"
                      name="gstin"
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      value={customer.gstin}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">State</label>
                    <input
                      className="cf-input"
                      type="text"
                      name="state"
                      placeholder="e.g. Karnataka"
                      value={customer.state}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="cf-panel">

              {/* Billing & Shipping */}
              <div className="cf-section">
                <p className="cf-section-label">Billing & Shipping</p>

                <div className="cf-row">
                  <div className="cf-field">
                    <label className="cf-label">Billing Address</label>
                    <textarea
                      className="cf-textarea short"
                      name="billingAddress"
                      placeholder="House / Street / Area"
                      value={customer.billingAddress}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Shipping Address</label>
                    <textarea
                      className="cf-textarea short"
                      name="shippingAddress"
                      placeholder="House / Street / Area"
                      value={customer.shippingAddress}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="cf-checkbox-row">
                  <input
                    type="checkbox"
                    id="sameAsBilling"
                    name="sameAsBilling"
                    checked={customer.sameAsBilling}
                    onChange={handleChange}
                  />
                  <label htmlFor="sameAsBilling">Shipping same as billing</label>
                </div>
              </div>

              {/* Financial Information */}
              <div className="cf-section">
                <p className="cf-section-label">Financial Information</p>

                <div className="cf-row-3">
                  <div className="cf-field">
                    <label className="cf-label">Opening Balance</label>
                    <input
                      className="cf-input"
                      type="number"
                      name="openingBalance"
                      placeholder="0.00"
                      step="0.01"
                      value={customer.openingBalance}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Balance Type</label>
                    <select className="cf-select" name="balanceType" value={customer.balanceType} onChange={handleChange}>
                      {balanceTypeOptions.map((t) => (
                        <option key={t} value={t}>{t === "receivable" ? "Receivable" : "Payable"}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Credit Limit</label>
                    <input
                      className="cf-input"
                      type="number"
                      name="creditLimit"
                      placeholder="0.00"
                      step="0.01"
                      value={customer.creditLimit}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="cf-row">
                  <div className="cf-field">
                    <label className="cf-label">As of Date</label>
                    <input
                      className="cf-input"
                      type="date"
                      name="asOfDate"
                      value={customer.asOfDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Footer ── */}
          <div className="cf-footer">
            <button type="button" className="cf-cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="cf-submit-btn" disabled={loading}>
              {loading ? (
                <><span className="cf-spinner" /> Saving...</>
              ) : (
                <>{isEdit ? "Update Customer" : "Save Customer"}</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CustomerFormModal;
