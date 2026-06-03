# POS Billing Payment Flow - Complete Fix Guide

## Summary of Issues Fixed

### 1. **Backend API Issues**
- **Problem**: The billing controller was using `db.getConnection()` which doesn't exist in the mysql2/promise library
- **Solution**: Changed all database calls from `db.query()` to `db.execute()` to use the correct mysql2/promise API
- **Files Modified**: `backend/controllers/billingController.js`

### 2. **Missing Branch ID**
- **Problem**: The invoices table requires a `branch_id` which was not being inserted
- **Solution**: Added logic to fetch the admin's first branch and include it in the INSERT query
- **Files Modified**: `backend/controllers/billingController.js`

### 3. **Payment Method Casing Mismatch**
- **Problem**: Frontend was sending `'Cash'`, `'UPI'`, `'Card'` but database enum expects lowercase: `'cash'`, `'upi'`, `'card'`
- **Solution**: Changed all payment mode states to lowercase and updated button click handlers
- **Files Modified**: `src/components/pos/POSBillingPage.js`

---

## Step-by-Step Testing Guide

### Prerequisites
- Backend server running: `npm run dev` (from backend folder)
- Frontend running on localhost:3000
- Database properly configured with all tables

### Test Flow

#### Step 1: Add Items to Cart
1. Open the POS Billing page
2. Click on any product card to add to cart
3. Verify item appears in the right panel cart
4. Add at least 2-3 items

#### Step 2: Verify Cart Summary
1. Check that Subtotal, CGST, SGST, and Total are calculated correctly
2. Optional: Add a discount amount
3. Verify total updates correctly

#### Step 3: Payment Method Selection
1. Click the **"Pay (F9)"** button to open the payment modal
2. Try clicking each payment method button:
   - **Cash** button
   - **UPI** button
   - **Card** button
3. Verify the selected button shows with "active" styling
4. Payment mode should be selectable and clickable

#### Step 4: Complete Payment
1. With a payment method selected, click **"Complete Payment"** button
2. **Expected Behavior**:
   - Loading state shows "Processing..."
   - Toast notification appears: "Invoice created successfully!"
   - Cart clears automatically
   - Payment modal closes
   - All fields reset (discount, notes, payment mode back to 'cash')

#### Step 5: Verify Database Entry
Open your MySQL client and run:
```sql
SELECT * FROM invoices ORDER BY id DESC LIMIT 1;
SELECT * FROM invoice_items WHERE invoice_id = (SELECT MAX(id) FROM invoices);
```

**Expected Results**:
- Invoice row with correct data:
  - `admin_id`: Your logged-in admin ID
  - `branch_id`: Auto-populated from admin's first branch
  - `customer_name`: "Walk-in Customer"
  - `total_amount`: Correct total from cart
  - `gst_amount`: Correct GST calculation
  - `discount_amount`: Applied discount (if any)
  - `payment_method`: Either 'cash', 'upi', or 'card' (lowercase)
  - `status`: 'paid'
  
- Invoice items rows:
  - Each row corresponds to a cart item
  - `item_name`: Product name
  - `quantity`: Item quantity
  - `unit_price`: Product price
  - `total_price`: unit_price × quantity

---

## API Endpoint Details

### POST /api/billing (Create Invoice)

**Request Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "customerName": "Walk-in Customer",
  "customerPhone": "",
  "items": [
    {
      "id": 1,
      "name": "Samsung Smart TV",
      "qty": 2,
      "price": 45000
    }
  ],
  "totalAmount": 106200,
  "gstAmount": 16200,
  "discountAmount": 0,
  "paymentMethod": "cash",
  "notes": ""
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "invoiceId": 42,
  "invoice": {
    "id": 42,
    "customerName": "Walk-in Customer",
    "customerPhone": "",
    "totalAmount": 106200,
    "gstAmount": 16200,
    "discountAmount": 0,
    "paymentMethod": "cash",
    "status": "paid",
    "createdAt": "2026-05-28T..."
  }
}
```

**Error Responses**:
- `400`: No items in invoice / Invalid total amount / No branch found
- `500`: Database error (check backend logs)

---

## Common Issues & Solutions

### Issue 1: "No branch found for this admin"
**Cause**: Admin doesn't have an assigned branch
**Solution**: 
- Go to Admin Panel
- Ensure your admin account has at least one branch assigned
- Run: `SELECT * FROM branches WHERE admin_id = <your_admin_id>;`

### Issue 2: "Error creating invoice" with no specific message
**Cause**: Check backend console for detailed error
**Solution**:
- Check backend terminal for error logs
- Ensure database tables exist: `invoices` and `invoice_items`
- Verify `sales_inventory` table exists (for stock updates)

### Issue 3: Payment buttons not responding to clicks
**Cause**: Should now be fixed with the lowercase payment mode fix
**Solution**: 
- Clear browser cache (Ctrl+F5)
- Restart frontend dev server

### Issue 4: Invoice saved but with wrong payment_method
**Cause**: Database enum didn't match the value sent
**Solution**: Already fixed - frontend now sends lowercase values

---

## Database Schema Reference

### invoices table
```sql
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  branch_id INT NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  total_amount DECIMAL(15, 2),
  gst_amount DECIMAL(15, 2),
  discount_amount DECIMAL(15, 2),
  payment_method ENUM('cash', 'card', 'upi', 'credit'),
  status ENUM('paid', 'pending', 'cancelled'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### invoice_items table
```sql
CREATE TABLE invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_id INT,
  item_name VARCHAR(255),
  quantity INT,
  unit_price DECIMAL(15, 2),
  total_price DECIMAL(15, 2),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

---

## Files Modified

1. **`backend/controllers/billingController.js`**
   - Fixed: `db.query()` → `db.execute()`
   - Fixed: Added branch_id fetching and insertion
   - Added: Proper error logging

2. **`src/components/pos/POSBillingPage.js`**
   - Fixed: `setPaymentMode('Cash')` → `setPaymentMode('cash')`
   - Fixed: All payment method button comparisons to lowercase
   - Fixed: Reset payment mode to 'cash' after successful payment

3. **No changes to routes** - `backend/routes/billingRoutes.js` is correct

---

## Next Steps (Optional Enhancements)

1. **Invoice Number Generation**: Currently uses database auto-increment
   - Could add formatted prefix like "INV-2026-00001"

2. **Receipt Printing**: After successful payment
   - Show a printable invoice receipt modal
   - Include items breakdown, GST calculation, payment method

3. **Payment Cancellation**: Implement the `cancelInvoice` endpoint
   - Reverse stock updates
   - Change status to 'cancelled'

4. **Customer Selection**: Currently hardcoded to "Walk-in"
   - Add customer lookup/creation modal
   - Update customer balance tracking

5. **Inventory Sync**: Currently updates `sales_inventory` table
   - Verify this table structure matches your product schema
   - Consider linking to the correct product table
