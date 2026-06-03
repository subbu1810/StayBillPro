import React, { useState, useEffect } from 'react';
import '../../styles/pos/POSBillingPage.css';
import {
  Search,
  ShoppingCart,
  User,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Receipt,
  PauseCircle,
  ScanLine
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function POSBillingPage() {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Samsung Smart TV',
      category: 'TV',
      price: 45000,
      stock: 12,
      gst: 18,
      image: 'https://via.placeholder.com/300x200'
    },
    {
      id: 2,
      name: 'Sony LED TV',
      category: 'TV',
      price: 52000,
      stock: 5,
      gst: 18,
      image: 'https://via.placeholder.com/300x200'
    },
    {
      id: 3,
      name: 'LG Refrigerator',
      category: 'Appliances',
      price: 30000,
      stock: 7,
      gst: 18,
      image: 'https://via.placeholder.com/300x200'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(
    p =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = product => {
    const exists = cart.find(i => i.id === product.id);

    if (exists) {
      setCart(
        cart.map(i =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, type) => {
    setCart(
      cart.map(item => {
        if (item.id === id) {
          const qty =
            type === 'inc' ? item.qty + 1 : Math.max(1, item.qty - 1);
          return { ...item, qty };
        }
        return item;
      })
    );
  };

  const removeItem = id => {
    setCart(cart.filter(i => i.id !== id));
  };

  const subtotal = cart.reduce(
    (a, b) => a + b.price * b.qty,
    0
  );

  const gstTotal = cart.reduce((acc, item) => {
    const gst = Number(item.gst || 0);
    return acc + item.price * item.qty * (gst / 100);
  }, 0);

  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;

  const total = subtotal + gstTotal - discount;

  const handleCompletePayment = async () => {
    if (!paymentMode) {
      showToast('Please select a payment method', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const payload = {
        customerName: 'Walk-in Customer',
        customerPhone: '',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        totalAmount: parseFloat(total.toFixed(2)),
        gstAmount: parseFloat(gstTotal.toFixed(2)),
        discountAmount: parseFloat(discount.toFixed(2)),
        paymentMethod: paymentMode,
        notes: notes
      };

      const response = await fetch(`${API_BASE}/billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to save invoice', 'error');
        return;
      }

      showToast('Invoice created successfully!', 'success');
      
      // Reset cart
      setCart([]);
      setDiscount(0);
      setNotes('');
      setPaymentMode('cash');
      setPaymentModal(false);
    } catch (error) {
      console.error('Error:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'F9') {
        e.preventDefault();
        setPaymentModal(true);
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div className="pos-wrapper">

      {/* HEADER */}

      <div className="top-header">
        <div>
          <h2>Subbu Electronics Store</h2>
          <p>Invoice #INV-10021</p>
        </div>

        <div className="header-right">
          <div>Cashier: Admin</div>
          <div>{new Date().toLocaleString()}</div>
        </div>
      </div>

      <div className="pos-layout">

        {/* LEFT */}

        <div className="left-panel">

          {/* SEARCH */}

          <div className="search-section">

            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products, barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="scanner-box">
              <ScanLine size={18} />
              Scanner Active
            </div>

          </div>

          {/* CATEGORIES */}

          <div className="categories">

            {categories.map(cat => (
              <button
                key={cat}
                className={activeCategory === cat ? 'active' : ''}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}

          </div>

          {/* PRODUCTS */}

          <div className="products-grid">

            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => addToCart(product)}
              >

                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>

                <div className="product-info">

                  <span className="category-tag">
                    {product.category}
                  </span>

                  <h4>{product.name}</h4>

                  <div className="price-row">
                    <span className="price">
                      ₹{product.price.toLocaleString()}
                    </span>

                    <span className="stock">
                      Stock: {product.stock}
                    </span>
                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="right-panel">

          {/* CUSTOMER */}

          <div className="customer-card">

            <div className="customer-left">
              <div className="avatar">
                <User size={20} />
              </div>

              <div>
                <span className="small-text">Customer</span>
                <h4>Walk-in Customer</h4>
              </div>
            </div>

            <button>Change</button>

          </div>

          {/* CART */}

          <div className="cart-section">

            <div className="cart-header">
              <ShoppingCart size={18} />
              Cart Items ({cart.length})
            </div>

            <div className="cart-table-head">
              <span>Item</span>
              <span>Qty</span>
              <span>Total</span>
            </div>

            <div className="cart-items">

              {cart.length === 0 ? (
                <div className="empty-cart">
                  <Receipt size={60} />
                  <p>No items added</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-row">

                    <div className="cart-product">

                      <img src={item.image} alt="" />

                      <div>
                        <h5>{item.name}</h5>
                        <span>₹{item.price}</span>
                      </div>

                    </div>

                    <div className="qty-box">

                      <button
                        onClick={() =>
                          updateQty(item.id, 'dec')
                        }
                      >
                        <Minus size={14} />
                      </button>

                      <span>{item.qty}</span>

                      <button
                        onClick={() =>
                          updateQty(item.id, 'inc')
                        }
                      >
                        <Plus size={14} />
                      </button>

                    </div>

                    <div className="row-total">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>
                ))
              )}

            </div>

            {/* NOTES */}

            <textarea
              placeholder="Add Notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            {/* DISCOUNT */}

            <input
              type="number"
              placeholder="Discount"
              value={discount}
              onChange={e => setDiscount(Number(e.target.value))}
              className="discount-input"
            />

            {/* TOTALS */}

            <div className="summary">

              <div>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              <div>
                <span>CGST</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>

              <div>
                <span>SGST</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>

              <div>
                <span>Discount</span>
                <span>₹{discount}</span>
              </div>

              <div className="grand-total">
                <span>TOTAL</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

            </div>

            {/* BUTTONS */}

            <div className="actions">

              <button className="hold-btn">
                <PauseCircle size={18} />
                Hold
              </button>

              <button
                className="pay-btn"
                onClick={() => setPaymentModal(true)}
                disabled={cart.length === 0 || loading}
              >
                <CreditCard size={18} />
                Pay (F9)
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* PAYMENT MODAL */}

      {paymentModal && (
        <div className="modal-overlay">

          <div className="payment-modal">

            <div className="modal-header">

              <h2>Payment</h2>

              <button onClick={() => setPaymentModal(false)}>
                ×
              </button>

            </div>

            <div className="payment-amount">
              ₹{total.toLocaleString()}
            </div>

            <div className="payment-methods">

              <button
                className={paymentMode === 'cash' ? 'active' : ''}
                onClick={() => setPaymentMode('cash')}
              >
                Cash
              </button>
              <button
                className={paymentMode === 'upi' ? 'active' : ''}
                onClick={() => setPaymentMode('upi')}
              >
                UPI
              </button>
              <button
                className={paymentMode === 'card' ? 'active' : ''}
                onClick={() => setPaymentMode('card')}
              >
                Card
              </button>

            </div>

            <div className="payment-actions">

              <button
                className="cancel"
                onClick={() => setPaymentModal(false)}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                className="confirm"
                onClick={handleCompletePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Complete Payment'}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="pos-toast" style={{
          background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.type === 'error' ? '#dc2626' : '#16a34a'
        }}>
          {toast.message}
        </div>
      )}

    </div>
  );
}