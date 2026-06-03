import React, { useState, useEffect } from 'react';
import { usersAPI, branchesAPI } from '../services/api';
import '../styles/SettingsScreen.css';

export default function UsersRolesScreen() {
	const [users, setUsers] = useState([]);
	const [branches, setBranches] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
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
		{ id: 'pos', label: 'Quick Sale (POS)', icon: '⚡', group: 'Sales' },
		
		// Jobs
		{ id: 'jobs', label: 'Service Jobs List', icon: '📋', group: 'Jobs' },
		{ id: 'jobs-new', label: 'Create New Job', icon: '➕', group: 'Jobs' },
		{ id: 'jobs-calendar', label: 'Jobs Calendar', icon: '📅', group: 'Jobs' },
		{ id: 'jobs-invoicing', label: 'Job Invoicing', icon: '🧾', group: 'Jobs' },
		
		// Inventory
		{ id: 'inventory-sales', label: 'Showroom Stock', icon: '🏬', group: 'Inventory' },
		{ id: 'inventory-service', label: 'Service Stock List', icon: '🔧', group: 'Inventory' },
		{ id: 'inventory-service-log', label: 'Service Stock Log', icon: '📜', group: 'Inventory' },
		
		// CRM & Suppliers
		{ id: 'customers', label: 'Customer CRM', icon: '👥', group: 'Contacts' },
		{ id: 'suppliers', label: 'Suppliers List', icon: '🏭', group: 'Contacts' },
		{ id: 'technicians', label: 'Technicians List', icon: '👨‍🔧', group: 'Contacts' },
		
		// Staff
		{ id: 'staff-manage', label: 'Staff Directory', icon: '👮', group: 'Staff' },
		{ id: 'staff-roles', label: 'Roles & Access', icon: '🛡️', group: 'Staff' },
		{ id: 'staff-attendance', label: 'Attendance', icon: '🕒', group: 'Staff' },
		{ id: 'staff-salary', label: 'Payroll & Salary', icon: '💰', group: 'Staff' },
		
		// Branch
		{ id: 'branch-manage', label: 'Manage Branches', icon: '🏢', group: 'Branch' },
		{ id: 'branch-transfer', label: 'Stock Transfer', icon: '🚚', group: 'Branch' },
		{ id: 'branch-consolidated', label: 'Group Reports', icon: '📊', group: 'Branch' },
		
		// Accounting
		{ id: 'accounting-ledger', label: 'Ledger', icon: '⚖️', group: 'Accounting' },
		{ id: 'accounting-gst', label: 'GST Reports', icon: '📜', group: 'Accounting' },
		{ id: 'accounting-expenses', label: 'Expenses', icon: '💸', group: 'Accounting' },
		{ id: 'accounting-pl', label: 'Profit & Loss', icon: '📈', group: 'Accounting' },
		
		// Settings
		{ id: 'settings-profile', label: 'Admin Profile', icon: '👤', group: 'Settings' },
		{ id: 'settings-corporate', label: 'Corporate Profile', icon: '🏢', group: 'Settings' },
		{ id: 'settings-users', label: 'Users & Access', icon: '👥', group: 'Settings' },
		{ id: 'settings-security', label: 'Security Config', icon: '⚙️', group: 'Settings' }
	];

	// Fetch users on mount
	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		setError(null);
		
		// Fetch Users
		try {
			const usersData = await usersAPI.getAll();
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
			await usersAPI.create(payload);
			setShowUserModal(false);
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
			await usersAPI.update(editingUser.id, userData);
			setShowEditUserModal(false);
			setEditingUser(null);
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
				await usersAPI.delete(deleteItem.id);
				setShowDeleteModal(false);
				setDeleteItem({ type: null, id: null });
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

	return (
		<div className="users-management-pane">
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
										).map(([group, screens]) => (
											<div key={group} style={{ marginBottom: '16px' }}>
												<div className="permission-group-header">{group}</div>
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
										))}
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
										).map(([group, screens]) => (
											<div key={group} style={{ marginBottom: '16px' }}>
												<div className="permission-group-header">{group}</div>
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
										))}
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
