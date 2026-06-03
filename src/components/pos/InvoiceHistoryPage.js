import React, { useEffect, useState } from 'react';

export default function InvoiceHistoryPage() {

  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async (search = '') => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/billing/search/advanced?searchTerm=${search}&page=1&limit=50`
      );

      const data = await res.json();

      console.log("API RESPONSE:", data);

      if (data.success) {
        setInvoices(data.invoices || []);
      } else {
        setInvoices([]);
      }

    } catch (err) {
      console.log("ERROR:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchInvoices(searchTerm);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  return (
    <div className="pos-history-container">

      <div className="history-header">
        <h2>Invoice History</h2>

        <input
          type="text"
          placeholder="Search invoice or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p>Loading...</p>}

      <div className="invoice-table-wrapper">
        <table className="pos-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="6">No invoices found</td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.id}</td>
                  <td>{inv.customer_name}</td>
                  <td>{inv.created_at?.split('T')[0]}</td>
                  <td>₹{inv.total_amount}</td>
                  <td>{inv.payment_method}</td>
                  <td>{inv.status}</td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
}