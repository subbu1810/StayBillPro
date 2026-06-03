# Quick Payment Flow Test Checklist

## ✅ Pre-Test Verification

- [ ] Backend running: `npm run dev` (in backend folder)
- [ ] Frontend running: `npm start` (in root folder)
- [ ] Logged in as admin user
- [ ] Database is accessible and all tables exist

---

## ✅ Phase 1: UI Interaction Test

### Cart & Items
- [ ] Can add products to cart by clicking them
- [ ] Can increase/decrease quantity with +/- buttons
- [ ] Can remove items with trash icon
- [ ] Cart shows correct count of items
- [ ] Subtotal, CGST, SGST, Total calculations are correct

### Discount & Notes
- [ ] Can enter discount amount
- [ ] Total recalculates with discount applied
- [ ] Can add notes to invoice

---

## ✅ Phase 2: Payment Method Selection

### Opening Payment Modal
- [ ] Can click **"Pay (F9)"** button (disabled only when cart is empty)
- [ ] Payment modal opens with total amount displayed
- [ ] Three payment method buttons visible: Cash, UPI, Card

### Selecting Payment Methods
- [ ] **Cash** button clickable and shows "active" state when clicked
- [ ] **UPI** button clickable and shows "active" state when clicked
- [ ] **Card** button clickable and shows "active" state when clicked
- [ ] Only one button can be active at a time
- [ ] Default selection is Cash

---

## ✅ Phase 3: Payment Submission

### Complete Payment Button
- [ ] Button is enabled when payment method is selected
- [ ] Shows "Processing..." text while submitting
- [ ] Cannot click multiple times (disabled during processing)

### Success Response
- [ ] Toast notification appears: "Invoice created successfully!"
- [ ] Toast appears for ~3 seconds then disappears
- [ ] Modal closes automatically
- [ ] Cart clears (no items shown)
- [ ] Payment mode resets to 'cash'
- [ ] Discount resets to 0
- [ ] Notes field clears

---

## ✅ Phase 4: Database Verification

Run these SQL queries:

```sql
-- Check latest invoice
SELECT * FROM invoices ORDER BY id DESC LIMIT 1;

-- Check invoice items
SELECT * FROM invoice_items WHERE invoice_id = (SELECT MAX(id) FROM invoices);
```

### Verify Invoice Row
- [ ] `admin_id` matches logged-in admin
- [ ] `branch_id` is populated (not NULL)
- [ ] `customer_name` = "Walk-in Customer"
- [ ] `total_amount` matches cart total
- [ ] `gst_amount` matches cart GST
- [ ] `discount_amount` matches applied discount
- [ ] `payment_method` = 'cash' (or 'upi' or 'card' as selected - all lowercase)
- [ ] `status` = 'paid'
- [ ] `created_at` shows current timestamp

### Verify Invoice Items
- [ ] Row count = number of items in cart
- [ ] Each row has correct `item_name`
- [ ] Each row has correct `quantity`
- [ ] Each row has correct `unit_price`
- [ ] Each row has correct `total_price` (unit_price × quantity)
- [ ] `invoice_id` links to the invoice row

---

## ✅ Phase 5: Error Cases (Optional)

### Error: No Payment Method Selected
- [ ] Try clicking "Complete Payment" without selecting a method
- [ ] Toast should show: "Please select a payment method"
- [ ] Modal remains open

### Error: Empty Cart
- [ ] Clear all items from cart
- [ ] "Pay (F9)" button should be disabled
- [ ] If somehow modal opens, toast shows: "Cart is empty"

### Error: Proceed With Payment Then Retry
- [ ] After successful payment, immediately add new items
- [ ] Complete another payment with different method
- [ ] Second invoice should save with different payment_method

---

## 🔍 Quick Debug Tips

**If payment button doesn't work:**
1. Check browser console (F12) for JavaScript errors
2. Check Network tab to see if API request is being sent
3. Reload page with Ctrl+F5 (hard refresh)

**If API returns error:**
1. Check backend terminal for error logs
2. Verify admin has a branch assigned
3. Verify database tables exist

**If data doesn't save to database:**
1. Verify database connection in `.env` file
2. Run: `SELECT COUNT(*) FROM invoices;` to see if any invoices exist
3. Check if the payment API endpoint is being called (Network tab in F12)

**If payment method is wrong in database:**
1. Clear browser cache
2. Restart frontend: `npm start`
3. Verify payment method values are lowercase in code

---

## 📋 Success Criteria

All of the following must be true:

1. ✅ Can add items to cart
2. ✅ Can select payment method (Cash/UPI/Card)
3. ✅ Payment button works when method is selected
4. ✅ Success toast appears after clicking Complete Payment
5. ✅ Cart clears and modal closes
6. ✅ Invoice appears in database with correct data
7. ✅ Invoice items appear in database with correct data
8. ✅ Payment method in database is lowercase (cash/upi/card)

**Status**: 🚀 Ready to test!
