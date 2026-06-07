-- Add scan_wallet_balance and last_wallet_recharge_date to admins table
ALTER TABLE admins 
ADD COLUMN scan_wallet_balance DECIMAL(10,2) DEFAULT 0.00 AFTER current_plan,
ADD COLUMN last_wallet_recharge_date DATE DEFAULT NULL AFTER scan_wallet_balance;
