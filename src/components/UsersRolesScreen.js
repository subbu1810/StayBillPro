import React, { useState, useEffect } from 'react';
import { adminUsersAPI, branchesAPI } from '../services/api';
import '../styles/SettingsScreen.css';

export default function UsersRolesScreen() {
	const [users, setUsers] = useState([]);
	const [branches, setBranches] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [newUser, setNewUser] = useState({ 
		name: '', email: '', password: '', phone: '', status: 'active', 
		branch_id: '', permissions: [] 
	});
	const [editingUser, setEditingUser] = useState(null);
	const [showUserModal, setShowUserModal] = useState(false);
	const [showEditUserModal, setShowEditUserModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteItem, setDeleteItem] = useState({ type: null, id: null });

	const AVAILABLE_SCREENS = [
		{ id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Main' },

		// Sales (POS)
		{ id: 'pos-billing', label: 'POS', icon: '💳', group: 'Sales (POS)' },
		{ id: 'pos-quotation', label: 'Quotation', icon: '📄', group: 'Sales (POS)' },
		{ id: 'pos-wholesale', label: 'Wholesale Bill', icon: '📦', group: 'Sales (POS)' },
		{ id: 'pos-returns', label: 'Returns & Refunds', icon: '↩️', group: 'Sales (POS)' },
		{ id: 'invoice-history', label: 'POS History', icon: '📋', group: 'Sales (POS)' },
		{ id: 'wholesale-history', label: 'Wholesale History', icon: '📦', group: 'Sales (POS)' },
		
		// Jobs
		{ id: 'jobs', label: 'Active Jobs List', icon: '📋', group: 'Service Jobs' },
		{ id: 'jobs-new', label: 'Create New Job', icon: '➕', group: 'Service Jobs' },
		{ id: 'jobs-calendar', label: 'Service Calendar', icon: '📅', group: 'Service Jobs' },
		{ id: 'jobs-invoicing', label: 'Invoicing Hub', icon: '🧾', group: 'Service Jobs' },
		{ id: 'jobs-payments', label: 'Payments', icon: '💰', group: 'Service Jobs' },
		
		// Store Stock
		{ id: 'inventory-sales-stock', label: 'Current Stock', icon: '📦', group: 'Store Stock' },
		{ id: 'inventory-sales-expiry', label: 'Expiry Monitor', icon: '⏳', group: 'Store Stock' },
		{ id: 'inventory-sales-categories', label: 'Categories', icon: '🏷️', group: 'Store Stock' },
		{ id: 'inventory-sales-ledger', label: 'Stock Log', icon: '📜', group: 'Store Stock' },

		// Service Stock
		{ id: 'inventory-service', label: 'Spare Parts List', icon: '🔧', group: 'Service Stock' },
		{ id: 'inventory-service-expiry', label: 'Expiry Monitor', icon: '⏳', group: 'Service Stock' },
		{ id: 'inventory-service-categories', label: 'Categories', icon: '🏷️', group: 'Service Stock' },
		{ id: 'inventory-service-log', label: 'Service Stock Log', icon: '📜', group: 'Service Stock' },
		
		// Customer CRM
		{ id: 'customers-manage', label: 'Manage Customers', icon: '📑', group: 'Customer CRM' },
		{ id: 'customers-ledger', label: 'Customer Ledger', icon: '⚖️', group: 'Customer CRM' },
		{ id: 'customers-dues', label: 'Outstanding Dues', icon: '💸', group: 'Customer CRM' },
		{ id: 'customers-payments', label: 'Payment History', icon: '💳', group: 'Customer CRM' },
		{ id: 'customers-orders', label: 'Order History', icon: '🛒', group: 'Customer CRM' },
		{ id: 'customers-returns', label: 'Return History', icon: '🔄', group: 'Customer CRM' },

		// Suppliers
		{ id: 'suppliers-manage', label: 'Manage Supplier', icon: '📑', group: 'Suppliers' },
		{ id: 'suppliers-ledger', label: 'Ledger', icon: '⚖️', group: 'Suppliers' },
		{ id: 'suppliers-payables', label: 'Payables', icon: '💸', group: 'Suppliers' },
		{ id: 'suppliers-payments', label: 'Payments', icon: '💳', group: 'Suppliers' },
		{ id: 'suppliers-purchases', label: 'Purchase History', icon: '📦', group: 'Suppliers' },

		// Technicians
		{ id: 'technicians', label: 'Technicians List', icon: '👨‍🔧', group: 'Technicians' },
		
		// Staff
		{ id: 'staff-manage', label: 'Staff Directory', icon: '👮', group: 'Staff Management' },
		{ id: 'staff-roles', label: 'Roles & Access', icon: '🛡️', group: 'Staff Management' },
		{ id: 'staff-attendance', label: 'Attendance Tracking', icon: '🕒', group: 'Staff Management' },
		{ id: 'staff-salary', label: 'Payroll & Salary', icon: '💰', group: 'Staff Management' },
		{ id: 'staff-history', label: 'Payment History', icon: '📜', group: 'Staff Management' },
		
		// Purchase
		{ id: 'purchase-po', label: 'Purchase Orders', icon: '📜', group: 'Purchase Management' },
		{ id: 'purchase-grn', label: 'GRN / Receiving', icon: '📥', group: 'Purchase Management' },
		{ id: 'purchase-due', label: 'Due Tracking', icon: '💸', group: 'Purchase Management' },
		{ id: 'purchase-returns', label: 'Damaged / Returns', icon: '↩️', group: 'Purchase Management' },

		// Reports
		{ id: 'reports-sales', label: 'Sales Report', icon: '📊', group: 'Insight Reports' },
		{ id: 'reports-expenses', label: 'Expense Report', icon: '💸', group: 'Insight Reports' },
		{ id: 'reports-profit', label: 'Profit Report', icon: '💰', group: 'Insight Reports' },
		{ id: 'reports-stock', label: 'Stock Report', icon: '📦', group: 'Insight Reports' },
		{ id: 'reports-topCustomers', label: 'Top Customers', icon: '⭐', group: 'Insight Reports' },

		// Branch
		{ id: 'branch-manage', label: 'Manage Branches', icon: '🏘️', group: 'Multi-Branch Hub' },
		{ id: 'branch-transfer', label: 'Stock Transfer', icon: '🚚', group: 'Multi-Branch Hub' },
		{ id: 'branch-consolidated', label: 'Group Reports', icon: '📊', group: 'Multi-Branch Hub' },
		
		// Accounting
		{ id: 'accounting-ledger', label: 'Ledger & Cashbook', icon: '⚖️', group: 'Accounting Hub' },
		{ id: 'accounting-service-ledger', label: 'Service Cashbook', icon: '🛠️', group: 'Accounting Hub' },
		{ id: 'accounting-gst', label: 'GST Filling Report', icon: '📜', group: 'Accounting Hub' },
		{ id: 'accounting-expenses', label: 'Business Expenses', icon: '💸', group: 'Accounting Hub' },
		{ id: 'accounting-pl', label: 'Profit & Loss', icon: '📈', group: 'Accounting Hub' },
		
		// Settings
		{ id: 'settings-profile', label: 'Admin Profile', icon: '👤', group: 'Settings & Config' },
		{ id: 'settings-corporate', label: 'Corporate Profile', icon: '🏢', group: 'Settings & Config' },
		{ id: 'settings-users', label: 'Users & Access', icon: '👥', group: 'Settings & Config' },
		{ id: 'settings-security', label: 'Security Config', icon: '🛡️', group: 'Settings & Config' },
		{ id: 'settings-barcode', label: 'Barcode Printer', icon: '🖨️', group: 'Settings & Config' },
		{ id: 'pos-settings', label: 'POS Config', icon: '⚙️', group: 'Settings & Config' }
	];

	// Fetch users on mount
	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		setError(null);
		
		// Fetch Users (including SUPERADMIN)
		try {
			const usersData = await adminUsersAPI.getBusinessUsers();
			setUsers(Array.isArray(usersData) ? usersData : []);
		} catch (err) {
			setError(prev => prev ? prev + ' | ' + err.message : 'Error fetching users: ' + err.message);
		}

		// Fetch Branches
		try {
			const branchesData = await branchesAPI.getAll();
			setBranches(Array.isArray(branchesData) ? branchesData : []);
		} catch (err) {
			setError(prev => prev ? prev + ' | ' + err.message : 'Error fetching branches: ' + err.message);
		}

		setLoading(false);
	};

	const handleOpenAddUser = () => {
		setNewUser({ 
			name: '', email: '', password: '', phone: '', status: 'active', 
			branch_id: branches.length > 0 ? branches[0].id : '', 
			permissions: ['dashboard'] 
		});
		setShowUserModal(true);
	};

	const handleAddUser = async (e) => {
		e.preventDefault();
		if (!newUser.name || !newUser.email || !newUser.password) {
			setError('Please fill in all required fields');
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const payload = {
				...newUser,
				admin_name: newUser.name, // backend expects admin_name
			};
			await adminUsersAPI.createUser(payload);
			setShowUserModal(false);
			setSuccess('User account created successfully!');
			setTimeout(() => setSuccess(null), 4000);
			await fetchData();
		} catch (err) {
			setError('Failed to create user: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenEditUser = (user) => {
		let permissions = [];
		try {
			permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || []);
		} catch (e) {
			console.error("Error parsing permissions", e);
		}

		setEditingUser({ 
			...user, 
			name: user.admin_name,
			permissions: Array.isArray(permissions) ? permissions : []
		});
		setShowEditUserModal(true);
	};

	const handleEditUser = async (e) => {
		e.preventDefault();
		if (!editingUser.name || !editingUser.email) {
			setError('Please fill in all required fields');
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const userData = {
				admin_name: editingUser.name,
				email: editingUser.email,
				phone: editingUser.phone,
				status: editingUser.status,
				branch_id: editingUser.branch_id,
				permissions: editingUser.permissions
			};
			if (editingUser.password) {
				userData.password = editingUser.password;
			}
			await adminUsersAPI.updateUser(editingUser.id, userData);

			// Update local storage and notify components if modifying own permissions
			try {
				const storedUserStr = localStorage.getItem('adminUser');
				if (storedUserStr) {
					const storedUser = JSON.parse(storedUserStr);
					if (Number(storedUser.id) === Number(editingUser.id)) {
						storedUser.permissions = editingUser.permissions;
						localStorage.setItem('adminUser', JSON.stringify(storedUser));
						window.dispatchEvent(new Event('user-profile-updated'));
					}
				}
			} catch (e) {
				console.error("Error updating local user profile after permission change:", e);
			}

			setShowEditUserModal(false);
			setEditingUser(null);
			setSuccess('User permissions and details updated successfully!');
			setTimeout(() => setSuccess(null), 4000);
			await fetchData();
		} catch (err) {
			setError('Failed to update user: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteUser = (user) => {
		setDeleteItem({ type: 'user', id: user.id });
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (deleteItem.type === 'user') {
			setLoading(true);
			setError(null);
			try {
				await adminUsersAPI.deleteUser(deleteItem.id);
				setShowDeleteModal(false);
				setDeleteItem({ type: null, id: null });
				setSuccess('User account deleted successfully!');
				setTimeout(() => setSuccess(null), 4000);
				await fetchData();
			} catch (err) {
				setError('Failed to delete user: ' + err.message);
			} finally {
				setLoading(false);
			}
		}
	};

	const closeModals = () => {
		setShowUserModal(false);
		setShowEditUserModal(false);
		setShowDeleteModal(false);
		setEditingUser(null);
		setDeleteItem({ type: null, id: null });
		setError(null);
	};

	const togglePermission = (userType, screenId) => {
		if (userType === 'new') {
			const current = [...newUser.permissions];
			if (current.includes(screenId)) {
				setNewUser({ ...newUser, permissions: current.filter(id => id !== screenId) });
			} else {
				setNewUser({ ...newUser, permissions: [...current, screenId] });
			}
		} else {
			const current = [...editingUser.permissions];
			if (current.includes(screenId)) {
				setEditingUser({ ...editingUser, permissions: current.filter(id => id !== screenId) });
			} else {
				setEditingUser({ ...editingUser, permissions: [...current, screenId] });
			}
		}
	};

	const toggleGroupPermissions = (userType, screens, isAllChecked) => {
		const screenIds = screens.map(s => s.id);
		if (userType === 'new') {
			let current = [...newUser.permissions];
			if (isAllChecked) {
				current = current.filter(id => !screenIds.includes(id));
			} else {
				current = Array.from(new Set([...current, ...screenIds]));
			}
			setNewUser({ ...newUser, permissions: current });
		} else {
			let current = [...editingUser.permissions];
			if (isAllChecked) {
				current = current.filter(id => !screenIds.includes(id));
			} else {
				current = Array.from(new Set([...current, ...screenIds]));
			}
			setEditingUser({ ...editingUser, permissions: current });
		}
	};

	return (
		<div className="users-management-pane">
			{success && (
				<div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', animation: 'slideIn 0.3s ease' }}>
					<span>✅</span> {success}
				</div>
			)}

			{error && (
				<div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', marginBottom: '16px' }}>
					{error}
				</div>
			)}

			<div className="settings-content">
				<section>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
						<h2>Users</h2>
						<button className="btn-primary" onClick={handleOpenAddUser} disabled={loading}>
							+ Add User
						</button>
					</div>

					{loading && <p>Loading...</p>}

					{!loading && users.length === 0 && (
						<p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No users found. Add your first user above.</p>
					)}

					{!loading && users.length > 0 && (
						<table className="charges-table">
							<thead>
								<tr>
									<th>ID</th>
									<th>Name</th>
									<th>Email</th>
									<th>Branch</th>
									<th>Status</th>
									<th style={{ width: '160px' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((user) => (
									<tr key={user.id}>
										<td>{user.id}</td>
										<td>{user.admin_name}</td>
										<td>{user.email}</td>
										<td>{user.branch_name || '-'}</td>
										<td>
											<span style={{
												display: 'inline-block',
												padding: '4px 10px',
												borderRadius: '12px',
												fontSize: '0.8rem',
												fontWeight: '500',
												background: user.status === 'active' ? '#dcfce7' : '#fee2e2',
												color: user.status === 'active' ? '#166534' : '#991b1b'
											}}>
												{user.status}
											</span>
										</td>
										<td>
											<button className="btn-small" onClick={() => handleOpenEditUser(user)} disabled={loading}>
												Edit
											</button>
											<button className="btn-small btn-danger" onClick={() => handleDeleteUser(user)} disabled={loading}>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</section>
			</div>

			{showUserModal && (
				<div className="premium-modal-overlay">
					<div className="premium-full-modal">
						<h3>Add New Business User</h3>
						<form onSubmit={handleAddUser}>
							<div className="premium-form-grid">
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Full Name *</label>
									<input 
										type="text" 
										className="premium-input"
										required 
										placeholder="e.g., John Doe"
										value={newUser.name} 
										onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
										autoFocus
									/>
								</div>
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Email Address *</label>
									<input 
										type="email" 
										className="premium-input"
										required 
										placeholder="e.g., john@example.com"
										value={newUser.email} 
										onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
									/>
								</div>
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Login Password *</label>
									<input 
										type="password" 
										className="premium-input"
										required 
										placeholder="Minimum 8 characters"
										value={newUser.password} 
										onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
									/>
								</div>
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Phone Number</label>
									<input 
										type="tel" 
										maxLength="10"
										className="premium-input"
										placeholder="9876543210"
										value={newUser.phone} 
										onChange={(e) => setNewUser({...newUser, phone: e.target.value})} 
									/>
								</div>
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Assign to Branch *</label>
									<select 
										className="premium-input"
										required 
										value={newUser.branch_id} 
										onChange={(e) => setNewUser({...newUser, branch_id: e.target.value})}
									>
										<option value="">{branches.length > 0 ? 'Select Branch' : '⚠️ No branches found'}</option>
										{branches.map(b => (
											<option key={b.id} value={b.id}>{b.name}</option>
										))}
									</select>
								</div>

								<div className="full-span">
									<label className="premium-input-label">Screen Assignment (Permissions)</label>
									<div className="permissions-container">
										{Object.entries(
											AVAILABLE_SCREENS.reduce((acc, screen) => {
												const group = screen.group || 'Other';
												if (!acc[group]) acc[group] = [];
												acc[group].push(screen);
												return acc;
											}, {})
										).map(([group, screens]) => {
											const groupScreenIds = screens.map(s => s.id);
											const isAllChecked = groupScreenIds.every(id => newUser.permissions.includes(id));
											const isSomeChecked = !isAllChecked && groupScreenIds.some(id => newUser.permissions.includes(id));
											return (
												<div key={group} className="permission-group-card">
													<div className="permission-group-header">
														<input 
															type="checkbox" 
															checked={isAllChecked}
															ref={el => {
																if (el) el.indeterminate = isSomeChecked;
															}}
															onChange={() => toggleGroupPermissions('new', screens, isAllChecked)}
															style={{ marginRight: '8px', cursor: 'pointer', width: '15px', height: '15px' }}
														/>
														<span>{group}</span>
													</div>
													<div className="permission-grid">
														{screens.map(screen => (
															<label 
																key={screen.id} 
																className={`permission-item ${newUser.permissions.includes(screen.id) ? 'selected' : ''}`}
															>
																<input 
																	type="checkbox" 
																	checked={newUser.permissions.includes(screen.id)} 
																	onChange={() => togglePermission('new', screen.id)} 
																/>
																<span>{screen.icon} {screen.label}</span>
															</label>
														))}
													</div>
												</div>
											);
										})}
									</div>
								</div>

								<div className="premium-input-wrapper">
									<label className="premium-input-label">Account Status</label>
									<select 
										className="premium-input"
										value={newUser.status} 
										onChange={(e) => setNewUser({...newUser, status: e.target.value})}
									>
										<option value="active">🟢 Active</option>
										<option value="inactive">🔴 Inactive</option>
										<option value="suspended">🟡 Suspended</option>
									</select>
								</div>
							</div>

							<div className="modal-footer">
								<button type="button" className="btn-premium-cancel" onClick={closeModals}>Cancel</button>
								<button type="submit" className="btn-premium-save" disabled={loading}>
									{loading ? 'Creating...' : 'Create User Account'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showEditUserModal && editingUser && (
				<div className="premium-modal-overlay">
					<div className="premium-full-modal">
						<h3>Update User Account</h3>
						<form onSubmit={handleEditUser}>
							<div className="premium-form-grid">
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Full Name *</label>
									<input 
										type="text" 
										className="premium-input"
										required 
										placeholder="e.g., John Doe"
										value={editingUser.name} 
										onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} 
									/>
								</div>
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Email Address *</label>
									<input 
										type="email" 
										className="premium-input"
										required 
										placeholder="e.g., john@example.com"
										value={editingUser.email} 
										onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
									/>
								</div>
								<div className="premium-input-wrapper">
									<label className="premium-input-label">New Password (optional)</label>
									<input 
										type="password" 
										className="premium-input"
										placeholder="Leave blank to keep current"
										value={editingUser.password || ''} 
										onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} 
									/>
								</div>
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Phone Number</label>
									<input 
										type="tel" 
										maxLength="10"
										className="premium-input"
										placeholder="9876543210"
										value={editingUser.phone} 
										onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})} 
									/>
								</div>
								<div className="premium-input-wrapper">
									<label className="premium-input-label">Assigned Branch *</label>
									<select 
										className="premium-input"
										required 
										value={editingUser.branch_id} 
										onChange={(e) => setEditingUser({...editingUser, branch_id: e.target.value})}
									>
										<option value="">{branches.length > 0 ? 'Select Branch' : '⚠️ No branches found'}</option>
										{branches.map(b => (
											<option key={b.id} value={b.id}>{b.name}</option>
										))}
									</select>
								</div>

								<div className="full-span">
									<label className="premium-input-label">Update Screen Permissions</label>
									<div className="permissions-container">
										{Object.entries(
											AVAILABLE_SCREENS.reduce((acc, screen) => {
												const group = screen.group || 'Other';
												if (!acc[group]) acc[group] = [];
												acc[group].push(screen);
												return acc;
											}, {})
										).map(([group, screens]) => {
											const groupScreenIds = screens.map(s => s.id);
											const isAllChecked = groupScreenIds.every(id => editingUser.permissions.includes(id));
											const isSomeChecked = !isAllChecked && groupScreenIds.some(id => editingUser.permissions.includes(id));
											return (
												<div key={group} className="permission-group-card">
													<div className="permission-group-header">
														<input 
															type="checkbox" 
															checked={isAllChecked}
															ref={el => {
																if (el) el.indeterminate = isSomeChecked;
															}}
															onChange={() => toggleGroupPermissions('edit', screens, isAllChecked)}
															style={{ marginRight: '8px', cursor: 'pointer', width: '15px', height: '15px' }}
														/>
														<span>{group}</span>
													</div>
													<div className="permission-grid">
														{screens.map(screen => (
															<label 
																key={screen.id} 
																className={`permission-item ${editingUser.permissions.includes(screen.id) ? 'selected' : ''}`}
															>
																<input 
																	type="checkbox" 
																	checked={editingUser.permissions.includes(screen.id)} 
																	onChange={() => togglePermission('edit', screen.id)} 
																/>
																<span>{screen.icon} {screen.label}</span>
															</label>
														))}
													</div>
												</div>
											);
										})}
									</div>
								</div>

								<div className="premium-input-wrapper">
									<label className="premium-input-label">Account Status</label>
									<select 
										className="premium-input"
										value={editingUser.status} 
										onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
									>
										<option value="active">🟢 Active</option>
										<option value="inactive">🔴 Inactive</option>
										<option value="suspended">🟡 Suspended</option>
									</select>
								</div>
							</div>

							<div className="modal-footer">
								<button type="button" className="btn-premium-cancel" onClick={closeModals}>Cancel</button>
								<button type="submit" className="btn-premium-save" disabled={loading}>
									{loading ? 'Saving...' : 'Save Changes'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showDeleteModal && (
				<div className="modal-overlay" onClick={closeModals}>
					<div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>Confirm Delete</h3>
							<button className="modal-close" onClick={closeModals}>×</button>
						</div>
						<div className="modal-body">
							<p>Are you sure you want to delete this user? This action cannot be undone.</p>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn-small btn-ghost" onClick={closeModals}>
								Cancel
							</button>
							<button type="button" className="btn-small btn-danger" onClick={confirmDelete} disabled={loading}>
								{loading ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
