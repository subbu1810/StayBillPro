import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';
import { branchesAPI } from '../services/api';
import { useService } from '../hooks/useService';
import Dashboard from './Dashboard';
import JobsList from './JobsList';
import NewJob from './NewJob';
import JobDetail from './JobDetail';
import CustomersScreen from './CustomersScreen';
import SuppliersScreen from './SuppliersScreen';
import TechniciansScreen from './TechniciansScreen';
import StaffScreen from './StaffScreen';
import AccountingScreen from './AccountingScreen';
import PurchaseScreen from './PurchaseScreen';
import GSTScreen from './GSTScreen';
import SettingsScreen from './SettingsScreen';
import ReportsScreen from './ReportsScreen';
import InventoryScreen from './InventoryScreen';
import CalendarScreen from './CalendarScreen';
import InvoicingScreen from './InvoicingScreen';
import POSManager from './pos/POSManager';
import BranchScreen from './BranchScreen';
import InvoiceHistory from './InvoiceHistory';
import SupportScreen from './SupportScreen';
import QuotationScreen from './QuotationScreen';
import SubscriptionScreen from './SubscriptionScreen';
import { usePopup } from './ui/PopupProvider';
import '../styles/StaffScreen.css';
import '../styles/AccountingScreen.css';
import '../styles/PurchaseScreen.css';
import '../styles/GSTScreen.css';
import '../styles/InvoiceHistory.css';
import { X, Menu } from 'lucide-react';
import RechargeModal from './RechargeModal';
import WalletHistoryModal from './WalletHistoryModal';

export default function AdminPanel({ onLogout }) {
	const popup = usePopup();
	const [currentScreen, setCurrentScreen] = useState('dashboard');
	const [selectedJobId, setSelectedJobId] = useState(null);
	const [showRechargeModal, setShowRechargeModal] = useState(false);
	const [showWalletHistoryModal, setShowWalletHistoryModal] = useState(false);
	const [userProfile, setUserProfile] = useState(() => {
		const saved = localStorage.getItem('adminUser');
		if (saved) {
			try {
				const user = JSON.parse(saved);
				return { 
                    name: user.business || user.name || 'Admin', 
                    avatar: '👤',
                    scan_wallet_balance: user.scan_wallet_balance !== undefined ? parseFloat(user.scan_wallet_balance).toFixed(2) : '0.00'
                };
			} catch (e) {
				return { name: 'Admin User', avatar: '👤', scan_wallet_balance: '0.00' };
			}
		}
		return { name: 'Admin User', avatar: '👤', scan_wallet_balance: '0.00' };
	});

	useEffect(() => {
		const handleWalletUpdate = () => {
			const saved = localStorage.getItem('adminUser');
			if (saved) {
				try {
					const user = JSON.parse(saved);
					setUserProfile(prev => ({
						...prev,
						scan_wallet_balance: user.scan_wallet_balance !== undefined ? parseFloat(user.scan_wallet_balance).toFixed(2) : prev.scan_wallet_balance
					}));
				} catch (e) {}
			}
		};
		window.addEventListener('walletUpdated', handleWalletUpdate);
		return () => window.removeEventListener('walletUpdated', handleWalletUpdate);
	}, []);

	const { jobs, setSelectedBranchId } = useService();
	const [screenHistory, setScreenHistory] = useState(['dashboard']);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [confirmAction, setConfirmAction] = useState(null);
	const [tabToClose, setTabToClose] = useState(null);
	const [historyInitialized, setHistoryInitialized] = useState(false);
	const [posSubScreen, setPosSubScreen] = useState('billing');
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [expandedGroups, setExpandedGroups] = useState({
		inventorySales: false,
		inventoryService: false,
		reports: false,
		customers: false,
		suppliers: false,
		purchase: false,
		staff: false,
		accounting: false,
		jobs: false,
		pos: false,
		branch: false,
		settings: false
	});

	// Role & Branch State
	const [userRole, setUserRole] = useState('USER');
	const [userBranchId, setUserBranchId] = useState(null);
	const [branches, setBranches] = useState([]);
	const [activeBranch, setActiveBranch] = useState('Loading...');
	const [activeBranchId, setActiveBranchId] = useState(null);
	const [permissions, setPermissions] = useState([]);

	const hasPermission = (screenId) => {
		// If it's SUPERADMIN and they have no permissions configured, show everything
		if ((userRole === 'SUPERADMIN' || userRole === 'superadmin') && permissions.length === 0) return true;
		// Guard: SUPERADMIN should always access dashboard and settings to avoid lock-out
		if (userRole === 'SUPERADMIN' || userRole === 'superadmin') {
			if (screenId === 'dashboard' || screenId.startsWith('settings-') || screenId === 'pos-settings') {
				return true;
			}
		}
		return permissions.includes(screenId);
	};

	const toggleGroup = (group) => {
		setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
	};

	// Tab Management
	const [tabs, setTabs] = useState([
		{ id: 'dashboard', title: 'Dashboard', screen: 'dashboard', subScreen: null, jobId: null }
	]);
	const [activeTabId, setActiveTabId] = useState('dashboard');

	// Function to load user permissions dynamically
	const loadUserPermissions = () => {
		const storedUser = localStorage.getItem('adminUser');
		if (storedUser) {
			const user = JSON.parse(storedUser);
			console.log('Current User Context (Loaded/Updated):', user);
			setUserRole(user.role);
			setUserBranchId(user.branchId);

			// Parse permissions
			try {
				const userPerms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || []);
				console.log('Parsed Permissions:', userPerms);
				setPermissions(Array.isArray(userPerms) ? userPerms : []);
			} catch (e) {
				console.error("Error parsing permissions", e);
				setPermissions([]);
			}

			if (user.role === 'SUPERADMIN' || user.role === 'superadmin') {
				fetchBranches(user.branchId);
			} else {
				setActiveBranchId(user.branchId);
				fetchBranches(user.branchId);
				localStorage.setItem('selectedBranchId', user.branchId);
			}
		}
	};

	// Initialize user and branches on component mount
	useEffect(() => {
		loadUserPermissions();

		const handleProfileUpdate = () => {
			loadUserPermissions();
		};

		window.addEventListener('user-profile-updated', handleProfileUpdate);

		if (!historyInitialized) {
			window.history.pushState({ screen: 'dashboard', isAdmin: true }, '', window.location.pathname);
			setHistoryInitialized(true);
		}

		return () => {
			window.removeEventListener('user-profile-updated', handleProfileUpdate);
		};
	}, [historyInitialized]);

	const fetchBranches = async (currentBranchId) => {
		try {
			const data = await branchesAPI.getAll();
			console.log('Branches API Result:', data);
			setBranches(data);

			if (data.length > 0) {
				const branchToSet = currentBranchId
					? data.find(b => b.id == currentBranchId) || data[0]
					: data.find(b => b.is_main) || data[0];

				console.log('Setting Active Branch:', branchToSet);
				setActiveBranch(branchToSet.name);
				setActiveBranchId(branchToSet.id);
				setSelectedBranchId(branchToSet.id);
				localStorage.setItem('selectedBranchId', branchToSet.id);
			}
		} catch (error) {
			console.error("Error fetching branches:", error);
		}
	};

	const handleBranchChange = (e) => {
		const branchName = e.target.value;
		const branch = branches.find(b => b.name === branchName);
		if (branch) {
			setActiveBranch(branchName);
			setActiveBranchId(branch.id);
			setSelectedBranchId(branch.id);
			localStorage.setItem('selectedBranchId', branch.id);
			// Refresh data for the new branch is handled by context useEffect
		}
	};

	// Browser back button functionality for internal navigation
	useEffect(() => {
		if (!historyInitialized) return;

		const handlePopState = (event) => {
			// Show confirmation if trying to leave dashboard
			if (currentScreen === 'dashboard') {
				setShowConfirmDialog(true);
				setConfirmAction('back');
				// Push state back to prevent navigation
				window.history.pushState({ screen: 'dashboard', isAdmin: true }, '', window.location.pathname);
				return;
			}

			// Handle browser back button for other screens
			if (screenHistory.length > 1) {
				const newHistory = [...screenHistory];
				newHistory.pop();
				const previousScreen = newHistory[newHistory.length - 1];
				setScreenHistory(newHistory);
				setCurrentScreen(previousScreen);

				if (previousScreen !== 'jobDetail') {
					setSelectedJobId(null);
				}
			}
		};

		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, [currentScreen, screenHistory, historyInitialized]);

	const updateScreenHistory = (screen, jobId = null) => {
		const newHistory = [...screenHistory];

		// Remove current screen if it's the same (avoid duplicates)
		if (newHistory[newHistory.length - 1] === screen) {
			newHistory.pop();
		}

		newHistory.push(screen);
		setScreenHistory(newHistory);

		// Update browser history
		window.history.pushState(
			{ screen, isAdmin: true, timestamp: Date.now() },
			'',
			window.location.pathname
		);
	};

	const handleViewJob = (jobId) => {
		setSelectedJobId(jobId);
		setCurrentScreen('jobDetail');
		updateScreenHistory('jobDetail', jobId);
	};

	const handleBackFromJobDetail = () => {
		setSelectedJobId(null);
		setCurrentScreen('jobs');
		updateScreenHistory('jobs');
	};

	const handleNewJobCreated = () => {
		setCurrentScreen('jobs');
		updateScreenHistory('jobs');
	};

	const handleScreenChange = (screen, subScreen = null, jobId = null) => {
		// Use default subScreen for POS if null
		const finalSubScreen = (screen === 'pos' && !subScreen) ? 'billing' : subScreen;

		// Prepare tab title
		let title = screen.charAt(0).toUpperCase() + screen.slice(1);
		if (screen === 'pos') title = `POS: ${finalSubScreen}`;
		if (screen === 'newJob') title = 'New Job';
		if (screen === 'jobDetail') title = `Job #${jobId}`;
		if (screen === 'calendar') title = 'Schedule';
		if (screen === 'invoicing') title = 'Invoices';
		if (screen === 'inventory-sales') {
			if (finalSubScreen === 'categories') title = 'Showroom: Categories';
			else if (finalSubScreen === 'ledger') title = 'Showroom: Stock Log';
			else if (finalSubScreen === 'expiry') title = 'Store Stock: Expiry Monitor';
			else title = 'Store Stock';
		}
		if (screen === 'inventory-service') {
			if (finalSubScreen === 'categories') title = 'Service: Categories';
			else if (finalSubScreen === 'ledger') title = 'Service: Stock Log';
			else title = 'Service Parts';
		}
		if (screen === 'reports') {
			if (finalSubScreen === 'topCustomers') title = 'Report: Top Customers';
			else title = `Report: ${finalSubScreen || 'Sales'}`;
		}
		if (screen === 'pos') {
			if (finalSubScreen === 'billing') title = 'POS: Quick Sale';
			if (finalSubScreen === 'wholesale') title = 'Wholesale Billing';
			if (finalSubScreen === 'returns') title = 'POS: Returns & Refunds';
			else title = `POS: ${finalSubScreen || 'Sale'}`;
		}
		if (screen === 'customers') title = `CRM: ${finalSubScreen || 'Manage'}`;
		if (screen === 'suppliers') title = `Vendor: ${finalSubScreen || 'Manage'}`;
		if (screen === 'purchase') {
			if (finalSubScreen === 'po') title = 'PUR: Purchase Order';
			else if (finalSubScreen === 'grn') title = 'PUR: Goods Receipt';
			else if (finalSubScreen === 'due') title = 'PUR: Due Tracking';
			else title = `PUR: ${finalSubScreen || 'Management'}`;
		}
		if (screen === 'staff') {
			if (finalSubScreen === 'roles') title = 'Staff: Permissions';
			else if (finalSubScreen === 'attendance') title = 'Staff: Attendance';
			else if (finalSubScreen === 'salary') title = 'Staff: Payroll';
			else if (finalSubScreen === 'history') title = 'Staff: Payment History';
			else title = 'Staff Management';
		}
		if (screen === 'accounting') {
			if (finalSubScreen === 'pnl') title = 'A/C: Profit & Loss';
			else if (finalSubScreen === 'balance') title = 'A/C: Balance Sheet';
			else if (finalSubScreen === 'gst') title = 'A/C: GST Compliance';
			else if (finalSubScreen === 'journal') title = 'A/C: Journal';
			else title = `A/C: ${finalSubScreen || 'Ledger'}`;
		}
		if (screen === 'branch') {
			if (finalSubScreen === 'manage') title = 'Branch Hub';
			else if (finalSubScreen === 'transfer') title = 'Stock Transfer';
			else if (finalSubScreen === 'consolidated') title = 'Group Audit';
			else title = `Branch: ${finalSubScreen || 'Management'}`;
		}
		if (screen === 'settings') {
			if (finalSubScreen === 'profile') title = 'Config: Admin Profile';
			else if (finalSubScreen === 'corporate') title = 'Config: Corporate';
			else if (finalSubScreen === 'users') title = 'Config: Access Control';
			else if (finalSubScreen === 'security') title = 'Config: Security';
			else title = `Config: ${finalSubScreen || 'Platform'}`;
		}

		// 1. Check if this screen is already open
		// Singleton tabs list (none currently, everything opens per subScreen)
		const existingTab = tabs.find(t => {
			return t.screen === screen && (t.subScreen === finalSubScreen || (!finalSubScreen && !t.subScreen)) && t.jobId === jobId;
		});

		if (existingTab) {
			setActiveTabId(existingTab.id);
			setCurrentScreen(screen);
			if (jobId) setSelectedJobId(jobId);
			return;
		}

		// 2. Add new tab if within limit
		if (tabs.length < 10) {
			const newTabId = `${screen}-${Date.now()}`;
			const newTab = { id: newTabId, title, screen, subScreen: finalSubScreen, jobId };
			setTabs([...tabs, newTab]);
			setActiveTabId(newTabId);
		} else {
			// Limit reached - block opening new tabs
			popup.showError('Maximum 10 tabs allowed. Please close some tabs.');
			return;
		}

		setCurrentScreen(screen);
		updateScreenHistory(screen);

		if (screen === 'pos') {
			setExpandedGroups(prev => ({ ...prev, pos: true }));
			setPosSubScreen(finalSubScreen);
		}

		if (screen === 'inventory-sales') {
			setExpandedGroups(prev => ({ ...prev, inventorySales: true }));
		}
		if (screen === 'inventory-service') {
			setExpandedGroups(prev => ({ ...prev, inventoryService: true }));
		}

		if (screen === 'reports') {
			setExpandedGroups(prev => ({ ...prev, reports: true }));
		}

		if (screen === 'customers') {
			setExpandedGroups(prev => ({ ...prev, customers: true }));
		}

		if (screen === 'suppliers') {
			setExpandedGroups(prev => ({ ...prev, suppliers: true }));
		}

		if (screen === 'staff') {
			setExpandedGroups(prev => ({ ...prev, staff: true }));
		}

		if (screen === 'accounting') {
			setExpandedGroups(prev => ({ ...prev, accounting: true }));
		}

		if (screen === 'purchase') {
			setExpandedGroups(prev => ({ ...prev, purchase: true }));
		}

		if (screen === 'branch') {
			setExpandedGroups(prev => ({ ...prev, branch: true }));
		}
		if (screen === 'settings') {
			setExpandedGroups(prev => ({ ...prev, settings: true }));
		}

		if (jobId) setSelectedJobId(jobId);
	};

	const closeTab = (e, tabId) => {
		e.stopPropagation();
		if (tabId === 'dashboard') return;

		setTabToClose(tabId);
		setConfirmAction('closeTab');
		setShowConfirmDialog(true);
	};

	const switchTab = (tabId) => {
		const tab = tabs.find(t => t.id === tabId);
		if (tab) {
			setActiveTabId(tabId);
			setCurrentScreen(tab.screen);
			if (tab.jobId) setSelectedJobId(tab.jobId);
		}
	};

	const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
	const currentSubScreen = activeTab?.subScreen;

	const handleLogoutClick = () => {
		setShowConfirmDialog(true);
		setConfirmAction('logout');
	};

	const handleConfirmAction = () => {
		if (confirmAction === 'logout') {
			setShowConfirmDialog(false);
			setConfirmAction(null);
			onLogout();
		} else if (confirmAction === 'back') {
			setShowConfirmDialog(false);
			setConfirmAction(null);
			// Allow back navigation
			window.history.back();
		} else if (confirmAction === 'closeTab' && tabToClose) {
			setShowConfirmDialog(false);
			setConfirmAction(null);

			const tabIndex = tabs.findIndex(t => t.id === tabToClose);
			const newTabs = tabs.filter(t => t.id !== tabToClose);
			setTabs(newTabs);

			if (activeTabId === tabToClose) {
				const nextTab = newTabs[tabIndex - 1] || newTabs[0];
				setActiveTabId(nextTab.id);
				setCurrentScreen(nextTab.screen);
				if (nextTab.screen === 'pos') setPosSubScreen(nextTab.subScreen || 'billing');
				if (nextTab.jobId) setSelectedJobId(nextTab.jobId);
			}
			setTabToClose(null);
		}
	};

	const handleCancelAction = () => {
		setShowConfirmDialog(false);
		setConfirmAction(null);
		setTabToClose(null);
	};

	const handleToggleSidebar = () => {
		if (window.innerWidth <= 1024) {
			setSidebarOpen(!sidebarOpen);
		} else {
			setSidebarCollapsed(!sidebarCollapsed);
		}
	};

	return (
		<div className="admin-panel orange-theme">
			<div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>
			<aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
				<div className="sidebar-brand" onClick={() => { handleScreenChange('dashboard'); setSidebarOpen(false); }} style={{ cursor: 'pointer' }}>
					<img src="/logo.png" alt="Logo" style={{ maxWidth: '52px', maxHeight: '52px', objectFit: 'contain' }} />
					<h2>StayBill pro</h2>
				</div>

				<nav className="sidebar-nav">
					{(hasPermission('pos-billing') || hasPermission('pos-quotation') || hasPermission('pos-wholesale') || hasPermission('pos-returns') || hasPermission('invoice-history') || hasPermission('wholesale-history')) && (
						<button
							className={currentScreen === 'pos' || currentScreen === 'invoice-history' || currentScreen === 'wholesale-history' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('pos')}
						>
							<span className="nav-icon">⚡</span>
							<span className="nav-text">Quick Sale (POS)</span>
							<span className={`nav-expand-icon ${expandedGroups.pos ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.pos && (
						<div className="sub-nav-group">
							{hasPermission('pos-billing') && (
								<button
									className={`sub-nav-item ${currentScreen === 'pos' && currentSubScreen === 'billing' ? 'active' : ''}`}
									onClick={() => handleScreenChange('pos', 'billing')}
								>
									<span>💳</span> POS
								</button>
							)}
							{hasPermission('pos-quotation') && (
								<button
									className={`sub-nav-item ${currentScreen === 'quotation' ? 'active' : ''}`}
									onClick={() => handleScreenChange('quotation')}
								>
									<span>📄</span> Quotation
								</button>
							)}
							{hasPermission('pos-wholesale') && (
								<button
									className={`sub-nav-item ${currentScreen === 'pos' && currentSubScreen === 'wholesale' ? 'active' : ''}`}
									onClick={() => handleScreenChange('pos', 'wholesale')}
								>
									<span>📦</span> Wholesale Bill
								</button>
							)}
							{hasPermission('pos-returns') && (
								<button
									className={`sub-nav-item ${currentScreen === 'pos' && currentSubScreen === 'returns' ? 'active' : ''}`}
									onClick={() => handleScreenChange('pos', 'returns')}
								>
									<span>↩️</span> Returns & Refunds
								</button>
							)}
							{hasPermission('invoice-history') && (
								<button
									className={`sub-nav-item ${currentScreen === 'invoice-history' ? 'active' : ''}`}
									onClick={() => handleScreenChange('invoice-history')}
								>
									<span>📋</span> POS History
								</button>
							)}
							{hasPermission('wholesale-history') && (
								<button
									className={`sub-nav-item ${currentScreen === 'wholesale-history' ? 'active' : ''}`}
									onClick={() => handleScreenChange('wholesale-history')}
								>
									<span>📦</span> Wholesale History
								</button>
							)}
						</div>
					)}
					{(hasPermission('jobs') || hasPermission('jobs-new') || hasPermission('jobs-calendar') || hasPermission('jobs-invoicing')) && (
						<button
							className={['jobs', 'newJob', 'jobDetail', 'calendar', 'invoicing'].includes(currentScreen) ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('jobs')}
						>
							<span className="nav-icon">📋</span>
							<span className="nav-text">Service Jobs</span>
							<span className={`nav-expand-icon ${expandedGroups.jobs ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.jobs && (
						<div className="sub-nav-group">
							{hasPermission('jobs') && (
								<button className={`sub-nav-item ${currentScreen === 'jobs' ? 'active' : ''}`} onClick={() => handleScreenChange('jobs')}><span>📋</span> Active Jobs</button>
							)}
							{hasPermission('jobs-new') && (
								<button className={`sub-nav-item ${currentScreen === 'newJob' ? 'active' : ''}`} onClick={() => handleScreenChange('newJob')}><span>➕</span> New Job Entry</button>
							)}
							{hasPermission('jobs-calendar') && (
								<button className={`sub-nav-item ${currentScreen === 'calendar' ? 'active' : ''}`} onClick={() => handleScreenChange('calendar')}><span>📅</span> Service Calendar</button>
							)}
							{hasPermission('jobs-invoicing') && (
								<button className={`sub-nav-item ${currentScreen === 'invoicing' ? 'active' : ''}`} onClick={() => handleScreenChange('invoicing')}><span>🧾</span> Invoicing Hub</button>
							)}
						</div>
					)}

					{(hasPermission('inventory-sales-stock') || hasPermission('inventory-sales-categories') || hasPermission('inventory-sales-ledger') || hasPermission('inventory-sales-expiry')) && (
						<button
							className={currentScreen === 'inventory-sales' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('inventorySales')}
						>
							<span className="nav-icon">🏬</span>
							<span className="nav-text">Store Stock</span>
							<span className={`nav-expand-icon ${expandedGroups.inventorySales ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.inventorySales && (
						<div className="sub-nav-group">
							{hasPermission('inventory-sales-stock') && (
								<button className={`sub-nav-item ${currentScreen === 'inventory-sales' && (currentSubScreen === 'stock' || !currentSubScreen) ? 'active' : ''}`} onClick={() => handleScreenChange('inventory-sales', 'stock')}><span>📦</span> Current Stock</button>
							)}
							{hasPermission('inventory-sales-expiry') && (
								<button className={`sub-nav-item ${currentScreen === 'inventory-sales' && currentSubScreen === 'expiry' ? 'active' : ''}`} onClick={() => handleScreenChange('inventory-sales', 'expiry')}><span>⏳</span> Expiry Monitor</button>
							)}
							{hasPermission('inventory-sales-categories') && (
								<button className={`sub-nav-item ${currentScreen === 'inventory-sales' && currentSubScreen === 'categories' ? 'active' : ''}`} onClick={() => handleScreenChange('inventory-sales', 'categories')}><span>🏷️</span> Categories</button>
							)}
							{hasPermission('inventory-sales-ledger') && (
								<button className={`sub-nav-item ${currentScreen === 'inventory-sales' && currentSubScreen === 'ledger' ? 'active' : ''}`} onClick={() => handleScreenChange('inventory-sales', 'ledger')}><span>📜</span> Stock Log</button>
							)}
						</div>
					)}

					{(hasPermission('inventory-service') || hasPermission('inventory-service-log')) && (
						<button
							className={currentScreen === 'inventory-service' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('inventoryService')}
						>
							<span className="nav-icon">🔧</span>
							<span className="nav-text">Service Inventory</span>
							<span className={`nav-expand-icon ${expandedGroups.inventoryService ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.inventoryService && (
						<div className="sub-nav-group">
							{hasPermission('inventory-service') && (
								<button className={`sub-nav-item ${currentScreen === 'inventory-service' && currentSubScreen === 'stock' ? 'active' : ''}`} onClick={() => handleScreenChange('inventory-service', 'stock')}><span>🔧</span> Spare Parts List</button>
							)}
							{hasPermission('inventory-service-log') && (
								<button className={`sub-nav-item ${currentScreen === 'inventory-service' && currentSubScreen === 'ledger' ? 'active' : ''}`} onClick={() => handleScreenChange('inventory-service', 'ledger')}><span>📜</span> Stock Log</button>
							)}
						</div>
					)}
					{(hasPermission('customers-manage') || hasPermission('customers-ledger') || hasPermission('customers-dues') || hasPermission('customers-payments') || hasPermission('customers-orders') || hasPermission('customers-returns')) && (
						<button
							className={currentScreen === 'customers' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('customers')}
						>
							<span className="nav-icon">👥</span>
							<span className="nav-text">Customer CRM</span>
							<span className={`nav-expand-icon ${expandedGroups.customers ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.customers && (
						<div className="sub-nav-group">
							{hasPermission('customers-manage') && (
								<button
									className={`sub-nav-item ${currentScreen === 'customers' && currentSubScreen === 'manage' ? 'active' : ''}`}
									onClick={() => handleScreenChange('customers', 'manage')}
								>
									<span>📑</span> Manage Customers
								</button>
							)}
							{hasPermission('customers-ledger') && (
								<button
									className={`sub-nav-item ${currentScreen === 'customers' && currentSubScreen === 'ledger' ? 'active' : ''}`}
									onClick={() => handleScreenChange('customers', 'ledger')}
								>
									<span>⚖️</span> Customer Ledger
								</button>
							)}
							{hasPermission('customers-dues') && (
								<button
									className={`sub-nav-item ${currentScreen === 'customers' && currentSubScreen === 'dues' ? 'active' : ''}`}
									onClick={() => handleScreenChange('customers', 'dues')}
								>
									<span>💸</span> Outstanding Dues
								</button>
							)}
							{hasPermission('customers-payments') && (
								<button
									className={`sub-nav-item ${currentScreen === 'customers' && currentSubScreen === 'payments' ? 'active' : ''}`}
									onClick={() => handleScreenChange('customers', 'payments')}
								>
									<span>💳</span> Payment History
								</button>
							)}
							{hasPermission('customers-orders') && (
								<button
									className={`sub-nav-item ${currentScreen === 'customers' && currentSubScreen === 'orders' ? 'active' : ''}`}
									onClick={() => handleScreenChange('customers', 'orders')}
								>
									<span>🛒</span> Order History
								</button>
							)}
							{hasPermission('customers-returns') && (
								<button
									className={`sub-nav-item ${currentScreen === 'customers' && currentSubScreen === 'returns' ? 'active' : ''}`}
									onClick={() => handleScreenChange('customers', 'returns')}
								>
									<span>🔄</span> Return History
								</button>
							)}
						</div>
					)}

					{(hasPermission('staff-manage') || hasPermission('staff-roles') || hasPermission('staff-attendance') || hasPermission('staff-salary') || hasPermission('staff-history')) && (
						<button
							className={currentScreen === 'staff' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('staff')}
						>
							<span className="nav-icon">👮</span>
							<span className="nav-text">Staff Management</span>
							<span className={`nav-expand-icon ${expandedGroups.staff ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.staff && (
						<div className="sub-nav-group">
							{hasPermission('staff-manage') && (
								<button className={`sub-nav-item ${currentScreen === 'staff' && currentSubScreen === 'manage' ? 'active' : ''}`} onClick={() => handleScreenChange('staff', 'manage')}><span>👤</span> Staff Directory</button>
							)}
							{hasPermission('staff-roles') && (
								<button className={`sub-nav-item ${currentScreen === 'staff' && currentSubScreen === 'roles' ? 'active' : ''}`} onClick={() => handleScreenChange('staff', 'roles')}><span>🛡️</span> Roles & Permissions</button>
							)}
							{hasPermission('staff-attendance') && (
								<button className={`sub-nav-item ${currentScreen === 'staff' && currentSubScreen === 'attendance' ? 'active' : ''}`} onClick={() => handleScreenChange('staff', 'attendance')}><span>🕒</span> Attendance Tracking</button>
							)}
							{hasPermission('staff-salary') && (
								<button className={`sub-nav-item ${currentScreen === 'staff' && currentSubScreen === 'salary' ? 'active' : ''}`} onClick={() => handleScreenChange('staff', 'salary')}><span>💰</span> Payroll & Salary</button>
							)}
							{hasPermission('staff-history') && (
								<button className={`sub-nav-item ${currentScreen === 'staff' && currentSubScreen === 'history' ? 'active' : ''}`} onClick={() => handleScreenChange('staff', 'history')}><span>📜</span> Payment History</button>
							)}
						</div>
					)}

					{(hasPermission('suppliers-manage') || hasPermission('suppliers-ledger') || hasPermission('suppliers-payables') || hasPermission('suppliers-payments') || hasPermission('suppliers-purchases')) && (
						<button
							className={currentScreen === 'suppliers' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('suppliers')}
						>
							<span className="nav-icon">🏭</span>
							<span className="nav-text">Suppliers</span>
							<span className={`nav-expand-icon ${expandedGroups.suppliers ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.suppliers && (
						<div className="sub-nav-group">
							{hasPermission('suppliers-manage') && (
								<button className={`sub-nav-item ${currentScreen === 'suppliers' && currentSubScreen === 'manage' ? 'active' : ''}`} onClick={() => handleScreenChange('suppliers', 'manage')}><span>📑</span> Manage Supplier</button>
							)}
							{hasPermission('suppliers-ledger') && (
								<button className={`sub-nav-item ${currentScreen === 'suppliers' && currentSubScreen === 'ledger' ? 'active' : ''}`} onClick={() => handleScreenChange('suppliers', 'ledger')}><span>⚖️</span> Ledger</button>
							)}
							{hasPermission('suppliers-payables') && (
								<button className={`sub-nav-item ${currentScreen === 'suppliers' && currentSubScreen === 'payables' ? 'active' : ''}`} onClick={() => handleScreenChange('suppliers', 'payables')}><span>💸</span> Payables</button>
							)}
							{hasPermission('suppliers-payments') && (
								<button className={`sub-nav-item ${currentScreen === 'suppliers' && currentSubScreen === 'payments' ? 'active' : ''}`} onClick={() => handleScreenChange('suppliers', 'payments')}><span>💳</span> Payments</button>
							)}
							{hasPermission('suppliers-purchases') && (
								<button className={`sub-nav-item ${currentScreen === 'suppliers' && currentSubScreen === 'purchases' ? 'active' : ''}`} onClick={() => handleScreenChange('suppliers', 'purchases')}><span>📦</span> Purchase Hist.</button>
							)}
						</div>
					)}

					{(hasPermission('purchase-po') || hasPermission('purchase-grn') || hasPermission('purchase-due') || hasPermission('purchase-returns')) && (
						<button
							className={currentScreen === 'purchase' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('purchase')}
						>
							<span className="nav-icon">📦</span>
							<span className="nav-text">Purchase Management</span>
							<span className={`nav-expand-icon ${expandedGroups.purchase ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.purchase && (
						<div className="sub-nav-group">
							{hasPermission('purchase-po') && (
								<button className={`sub-nav-item ${currentScreen === 'purchase' && currentSubScreen === 'po' ? 'active' : ''}`} onClick={() => handleScreenChange('purchase', 'po')}><span>📜</span> Purchase Orders</button>
							)}
							{hasPermission('purchase-grn') && (
								<button className={`sub-nav-item ${currentScreen === 'purchase' && currentSubScreen === 'grn' ? 'active' : ''}`} onClick={() => handleScreenChange('purchase', 'grn')}><span>📥</span> GRN / Receiving</button>
							)}
							{hasPermission('purchase-due') && (
								<button className={`sub-nav-item ${currentScreen === 'purchase' && currentSubScreen === 'due' ? 'active' : ''}`} onClick={() => handleScreenChange('purchase', 'due')}><span>💸</span> Due Tracking</button>
							)}
							{hasPermission('purchase-returns') && (
								<button className={`sub-nav-item ${currentScreen === 'purchase' && currentSubScreen === 'returns' ? 'active' : ''}`} onClick={() => handleScreenChange('purchase', 'returns')}><span>↩️</span> Damaged / Returns</button>
							)}
						</div>
					)}
					{hasPermission('technicians') && (
						<button
							className={currentScreen === 'technicians' ? 'nav-item active' : 'nav-item'}
							onClick={() => handleScreenChange('technicians')}
						>
							<span className="nav-icon">👨‍🔧</span>
							<span className="nav-text">Technicians</span>
						</button>
					)}
					{(hasPermission('reports-sales') || hasPermission('reports-expenses') || hasPermission('reports-profit') || hasPermission('reports-stock') || hasPermission('reports-topCustomers') || hasPermission('customers-returns')) && (
						<button
							className={currentScreen === 'reports' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('reports')}
						>
							<span className="nav-icon">📈</span>
							<span className="nav-text">Insight Reports</span>
							<span className={`nav-expand-icon ${expandedGroups.reports ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.reports && (
						<div className="sub-nav-group">
							{hasPermission('reports-sales') && (
								<button
									className={`sub-nav-item ${currentScreen === 'reports' && currentSubScreen === 'sales' ? 'active' : ''}`}
									onClick={() => handleScreenChange('reports', 'sales')}
								>
									<span>📊</span> Sales Report
								</button>
							)}
							{hasPermission('reports-expenses') && (
								<button
									className={`sub-nav-item ${currentScreen === 'reports' && currentSubScreen === 'expenses' ? 'active' : ''}`}
									onClick={() => handleScreenChange('reports', 'expenses')}
								>
									<span>💸</span> Expense Report
								</button>
							)}
							{hasPermission('reports-profit') && (
								<button
									className={`sub-nav-item ${currentScreen === 'reports' && currentSubScreen === 'profit' ? 'active' : ''}`}
									onClick={() => handleScreenChange('reports', 'profit')}
								>
									<span>💰</span> Profit Report
								</button>
							)}
							{hasPermission('reports-stock') && (
								<button
									className={`sub-nav-item ${currentScreen === 'reports' && currentSubScreen === 'stock' ? 'active' : ''}`}
									onClick={() => handleScreenChange('reports', 'stock')}
								>
									<span>📦</span> Stock Report
								</button>
							)}
							{hasPermission('reports-topCustomers') && (
								<button
									className={`sub-nav-item ${currentScreen === 'reports' && currentSubScreen === 'topCustomers' ? 'active' : ''}`}
									onClick={() => handleScreenChange('reports', 'topCustomers')}
								>
									<span>⭐</span> Top Customers
								</button>
							)}
							{hasPermission('customers-returns') && (
								<button
									className={`sub-nav-item ${currentScreen === 'customers' && currentSubScreen === 'returns' ? 'active' : ''}`}
									onClick={() => handleScreenChange('customers', 'returns')}
								>
									<span>🔄</span> Return History
								</button>
							)}
						</div>
					)}
					{(hasPermission('accounting-ledger') || hasPermission('accounting-gst') || hasPermission('accounting-expenses') || hasPermission('accounting-pl')) && (
						<button
							className={currentScreen === 'accounting' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('accounting')}
						>
							<span className="nav-icon">⚖️</span>
							<span className="nav-text">Accounting Hub</span>
							<span className={`nav-expand-icon ${expandedGroups.accounting ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.accounting && (
						<div className="sub-nav-group">
							{hasPermission('accounting-ledger') && (
								<button className={`sub-nav-item ${currentScreen === 'accounting' && currentSubScreen === 'ledger' ? 'active' : ''}`} onClick={() => handleScreenChange('accounting', 'ledger')}><span>⚖️</span> Ledger & Cashbook</button>
							)}
							{hasPermission('accounting-gst') && (
								<button className={`sub-nav-item ${currentScreen === 'accounting' && currentSubScreen === 'gst' ? 'active' : ''}`} onClick={() => handleScreenChange('accounting', 'gst')}><span>📜</span> GST Filling Report</button>
							)}
							{hasPermission('accounting-expenses') && (
								<button className={`sub-nav-item ${currentScreen === 'accounting' && currentSubScreen === 'expenses' ? 'active' : ''}`} onClick={() => handleScreenChange('accounting', 'expenses')}><span>💸</span> Business Expenses</button>
							)}
							{hasPermission('accounting-pl') && (
								<button className={`sub-nav-item ${currentScreen === 'accounting' && currentSubScreen === 'pl' ? 'active' : ''}`} onClick={() => handleScreenChange('accounting', 'pl')}><span>📈</span> Profit & Loss</button>
							)}
						</div>
					)}

					{(hasPermission('branch-manage') || hasPermission('branch-transfer') || hasPermission('branch-consolidated')) && (
						<button
							className={currentScreen === 'branch' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('branch')}
						>
							<span className="nav-icon">🏢</span>
							<span className="nav-text">Multi-Branch Hub</span>
							<span className={`nav-expand-icon ${expandedGroups.branch ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.branch && (
						<div className="sub-nav-group">
							{hasPermission('branch-manage') && (
								<button className={`sub-nav-item ${currentScreen === 'branch' && currentSubScreen === 'manage' ? 'active' : ''}`} onClick={() => handleScreenChange('branch', 'manage')}><span>🏘️</span> Manage Branches</button>
							)}
							{hasPermission('branch-transfer') && (
								<button className={`sub-nav-item ${currentScreen === 'branch' && currentSubScreen === 'transfer' ? 'active' : ''}`} onClick={() => handleScreenChange('branch', 'transfer')}><span>🚚</span> Stock Transfer</button>
							)}
							{hasPermission('branch-consolidated') && (
								<button className={`sub-nav-item ${currentScreen === 'branch' && currentSubScreen === 'consolidated' ? 'active' : ''}`} onClick={() => handleScreenChange('branch', 'consolidated')}><span>📊</span> Group Reports</button>
							)}
						</div>
					)}
					{(hasPermission('settings-profile') || hasPermission('settings-corporate') || hasPermission('settings-users') || hasPermission('settings-security') || hasPermission('pos-settings') || hasPermission('settings-barcode') || hasPermission('settings-subscription')) && (
						<button
							className={currentScreen === 'settings' ? 'nav-item active' : 'nav-item'}
							onClick={() => toggleGroup('settings')}
						>
							<span className="nav-icon">⚙️</span>
							<span className="nav-text">Settings & Config</span>
							<span className={`nav-expand-icon ${expandedGroups.settings ? 'expanded' : ''}`}>▼</span>
						</button>
					)}

					{expandedGroups.settings && (
						<div className="sub-nav-group">
							{hasPermission('settings-profile') && (
								<button className={`sub-nav-item ${currentScreen === 'settings' && currentSubScreen === 'profile' ? 'active' : ''}`} onClick={() => handleScreenChange('settings', 'profile')}><span>👤</span> Admin Profile</button>
							)}
							{hasPermission('settings-corporate') && (
								<button className={`sub-nav-item ${currentScreen === 'settings' && currentSubScreen === 'corporate' ? 'active' : ''}`} onClick={() => handleScreenChange('settings', 'corporate')}><span>🏢</span> Corporate Profile</button>
							)}
							{hasPermission('settings-users') && (
								<button className={`sub-nav-item ${currentScreen === 'settings' && currentSubScreen === 'users' ? 'active' : ''}`} onClick={() => handleScreenChange('settings', 'users')}><span>👥</span> Users & Access</button>
							)}
							{hasPermission('settings-security') && (
								<button className={`sub-nav-item ${currentScreen === 'settings' && currentSubScreen === 'security' ? 'active' : ''}`} onClick={() => handleScreenChange('settings', 'security')}><span>🛡️</span> Security Config</button>
							)}
							{hasPermission('settings-barcode') && (
								<button className={`sub-nav-item ${currentScreen === 'settings' && currentSubScreen === 'barcode' ? 'active' : ''}`} onClick={() => handleScreenChange('settings', 'barcode')}><span>🖨️</span> Barcode Printer</button>
							)}
							{hasPermission('pos-settings') && (
								<button className={`sub-nav-item ${currentScreen === 'pos' && currentSubScreen === 'settings' ? 'active' : ''}`} onClick={() => handleScreenChange('pos', 'settings')}><span>⚙️</span> POS Config</button>
							)}
							{hasPermission('settings-subscription') && (
								<button className={`sub-nav-item ${currentScreen === 'settings' && currentSubScreen === 'subscription' ? 'active' : ''}`} onClick={() => handleScreenChange('settings', 'subscription')}><span>💳</span> Subscription</button>
							)}
						</div>
					)}

					{/* Support Menu Item */}
					<button
						className={currentScreen === 'support' ? 'nav-item active' : 'nav-item'}
						onClick={() => handleScreenChange('support')}
						style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', borderRadius: '0' }}
					>
						<span className="nav-icon">🎧</span>
						<span className="nav-text">Customer Support</span>
					</button>
				</nav>

			</aside>

			<div className="main-wrapper">
				<header className="admin-topbar">
					<div className="topbar-left">
						<button className="menu-toggle" onClick={handleToggleSidebar}>☰</button>
						<div className="branch-selector-wrapper">
							<span className="location-icon">📍</span>
							<select
								className="topbar-branch-switcher"
								value={activeBranch}
								onChange={handleBranchChange}
								disabled={userRole?.toUpperCase() !== 'SUPERADMIN' || branches.length <= 1}
							>
								{branches.length > 0 ? (
									branches.map(b => (
										<option key={b.id} value={b.name}>{b.name}</option>
									))
								) : (
									<option>{activeBranch}</option>
								)}
							</select>

							{branches.length > 0 && activeBranchId && (
								<div className="active-branch-details-mini">
									{(() => {
										const b = branches.find(curr => curr.id === activeBranchId);
										return b ? (
											<span title={`${b.address}, ${b.city}`}>
												📞 {b.phone || 'No Phone'} | 🏙️ {b.city || 'No City'}
											</span>
										) : null;
									})()}
								</div>
							)}
						</div>
					</div>
					<div className="topbar-right">
						<div className="global-search">
							<input type="text" placeholder="Global Search (Ctrl+K)..." />
						</div>
						<div className="notification-bell">🔔<span className="badge">3</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px' }}>
                            <div style={{ background: '#f8fafc', padding: '4px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }} title="AI Scan Wallet Balance">
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Wallet:</span>
                                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>₹{userProfile.scan_wallet_balance}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={() => setShowWalletHistoryModal(true)}
                                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                                    title="View Wallet Ledger"
                                >
                                    History
                                </button>
                                <button 
                                    onClick={() => setShowRechargeModal(true)}
                                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    + Recharge
                                </button>
                            </div>
                        </div>
						<div className="top-user-info">
							<div className="top-user-text">
								<span className="top-user-name">{userProfile.name}</span>
								<span className="top-user-role">{userRole === 'SUPERADMIN' ? 'Superadmin' : 'Staff'}</span>
							</div>
							<div className="user-avatar-small">{userProfile.avatar}</div>
						</div>
						<button className="topbar-logout-btn" onClick={handleLogoutClick} title="Logout">
							<span className="logout-icon">🚪</span>
							<span className="logout-text">Logout</span>
						</button>
					</div>
				</header>

				<div className="admin-tab-bar">
					{tabs.map(tab => (
						<div
							key={tab.id}
							className={`tab-item ${activeTabId === tab.id ? 'active' : ''}`}
							onClick={() => switchTab(tab.id)}
						>
							<span className="tab-icon">
								{tab.screen === 'dashboard' ? '🏠' :
									tab.screen === 'pos' ? '⚡' :
										tab.screen === 'jobs' ? '📋' :
											tab.screen === 'inventory-sales' ? '🏬' :
												tab.screen === 'inventory-service' ? '🔧' : '📄'}
							</span>
							<span className="tab-title">{tab.title}</span>
							{tab.id !== 'dashboard' && (
								<button className="tab-close" onClick={(e) => closeTab(e, tab.id)}>×</button>
							)}
						</div>
					))}
				</div>

				<main className="admin-content">
					{!hasPermission(
						currentScreen === 'inventory-service' ? (currentSubScreen === 'ledger' ? 'inventory-service-log' : 'inventory-service') :
							currentScreen === 'inventory-sales' ? (`inventory-sales-${currentSubScreen || 'stock'}`) :
								currentScreen === 'customers' ? (`customers-${currentSubScreen || 'manage'}`) :
									currentScreen === 'suppliers' ? (`suppliers-${currentSubScreen || 'manage'}`) :
										currentScreen === 'staff' ? (`staff-${currentSubScreen}`) :
											currentScreen === 'accounting' ? (`accounting-${currentSubScreen}`) :
												currentScreen === 'branch' ? (`branch-${currentSubScreen}`) :
													currentScreen === 'settings' ? (`settings-${currentSubScreen}`) :
														currentScreen === 'quotation' ? 'pos-quotation' :
														currentScreen === 'pos' ? (currentSubScreen === 'settings' ? 'pos-settings' : `pos-${currentSubScreen}`) :
															currentScreen === 'purchase' ? (`purchase-${currentSubScreen === 'grn-new' ? 'grn' : currentSubScreen}`) :
																currentScreen === 'reports' ? (`reports-${currentSubScreen}`) :
																	currentScreen === 'newJob' ? 'jobs-new' :
																		currentScreen === 'calendar' ? 'jobs-calendar' :
																			currentScreen === 'invoicing' ? 'jobs-invoicing' :
																				currentScreen === 'jobDetail' ? 'jobs' :
																					currentScreen === 'invoice-history' ? 'invoice-history' :
																						currentScreen === 'wholesale-history' ? 'wholesale-history' :
																							currentScreen
					) && currentScreen !== 'dashboard' && currentScreen !== 'support' ? (
						<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
							<span style={{ fontSize: '4rem' }}>🚫</span>
							<h2>Access Denied</h2>
							<p>You do not have permission to view this screen. Please contact your administrator.</p>
							<button className="btn-primary" onClick={() => handleScreenChange('dashboard')} style={{ marginTop: '20px' }}>
								Go to Dashboard
							</button>
						</div>
					) : (
						<>
							{currentScreen === 'dashboard' && (
								<Dashboard
									onCreateJob={() => handleScreenChange('newJob')}
									onOpenJobs={() => handleScreenChange('jobs')}
									onOpenCustomers={() => handleScreenChange('customers')}
									onOpenTechnicians={() => handleScreenChange('technicians')}
									onViewJob={handleViewJob}
									onOpenInventory={() => handleScreenChange('inventory')}
									onOpenPOS={() => handleScreenChange('pos')}
									onOpenGRN={() => handleScreenChange('purchase', 'grn-new')}
									onLogout={onLogout}
								/>
							)}
							{currentScreen === 'jobs' && <JobsList key={activeTabId} onViewJob={handleViewJob} onCreateJob={() => handleScreenChange('newJob')} />}
							{currentScreen === 'newJob' && <NewJob key={activeTabId} onBack={() => handleScreenChange('jobs')} onSuccess={handleNewJobCreated} />}
							{currentScreen === 'jobDetail' && selectedJobId && <JobDetail key={activeTabId} jobId={selectedJobId} onBack={handleBackFromJobDetail} />}
							{currentScreen === 'quotation' && <QuotationScreen key={activeTabId} />}
							{currentScreen === 'reports' && <ReportsScreen key={activeTabId} defaultTab={currentSubScreen} />}
							{currentScreen === 'pos' && <POSManager key={activeTabId} activeTab={currentSubScreen} onTabChange={(s) => {/* Tab system handles this */ }} />}
							{currentScreen === 'invoice-history' && <InvoiceHistory key={activeTabId} invoiceType="pos" />}
							{currentScreen === 'wholesale-history' && <InvoiceHistory key={activeTabId} invoiceType="wholesale" />}
							{currentScreen === 'inventory-sales' && <InventoryScreen key={activeTabId} initialSection="sales" defaultTab={currentSubScreen} />}
							{currentScreen === 'inventory-service' && <InventoryScreen key={activeTabId} initialSection="service" defaultTab={currentSubScreen} />}
							{currentScreen === 'customers' && <CustomersScreen key={activeTabId} defaultTab={currentSubScreen} />}
							{currentScreen === 'suppliers' && <SuppliersScreen key={activeTabId} defaultTab={currentSubScreen} />}
							{currentScreen === 'purchase' && <PurchaseScreen key={activeTabId} defaultTab={currentSubScreen === 'grn-new' ? 'grn' : currentSubScreen} autoOpenModal={currentSubScreen === 'grn-new'} />}
							{currentScreen === 'staff' && <StaffScreen key={activeTabId} defaultTab={currentSubScreen} />}
							{currentScreen === 'accounting' && currentSubScreen === 'gst' && <GSTScreen key={activeTabId} defaultTab={currentSubScreen} branchId={activeBranchId} />}
							{currentScreen === 'accounting' && currentSubScreen !== 'gst' && <AccountingScreen key={activeTabId} defaultTab={currentSubScreen} branchId={activeBranchId} />}
							{currentScreen === 'branch' && <BranchScreen key={activeTabId} defaultTab={currentSubScreen} branchId={activeBranchId} />}
							{currentScreen === 'calendar' && <CalendarScreen key={activeTabId} />}
							{currentScreen === 'invoicing' && <InvoicingScreen key={activeTabId} />}
							{currentScreen === 'support' && <SupportScreen key={activeTabId} />}
							{currentScreen === 'technicians' && <TechniciansScreen key={activeTabId} />}
							{currentScreen === 'settings' && currentSubScreen === 'subscription' && <SubscriptionScreen key={activeTabId} />}
							{currentScreen === 'settings' && currentSubScreen !== 'subscription' && <SettingsScreen key={activeTabId} defaultTab={currentSubScreen} />}
						</>
					)}

					{/* Global Footer */}
					<div style={{ textAlign: 'center', padding: '20px 0 10px 0', marginTop: 'auto', color: '#94a3b8', fontSize: '0.85rem' }}>
						&copy; 2026 All rights reserved for SSquareG Tech Solutions Pvt Ltd.
					</div>
				</main>
			</div>

			{/* Confirmation Dialog */}
			{showConfirmDialog && (
				<div className="confirm-dialog-overlay">
					<div className="confirm-dialog">
						<div className="confirm-dialog-header">
							<h2>⚠️ Confirm Action</h2>
						</div>
						<div className="confirm-dialog-body">
							{confirmAction === 'logout' ? (
								<p>Are you sure you want to logout? You will need to login again to access the dashboard.</p>
							) : confirmAction === 'closeTab' ? (
								<p>Are you sure you want to close this tab? Any unsaved changes might be lost.</p>
							) : (
								<p>Are you sure you want to leave the dashboard? You can always come back by navigating to it again.</p>
							)}
						</div>
						<div className="confirm-dialog-footer">
							<button className="btn-cancel" onClick={handleCancelAction}>
								Cancel
							</button>
							<button className="btn-confirm" onClick={handleConfirmAction}>
								{confirmAction === 'logout' ? 'Yes, Logout' : confirmAction === 'closeTab' ? 'Yes, Close Tab' : 'Yes, Go Back'}
							</button>
						</div>
					</div>
				</div>
			)}

            {showRechargeModal && (
                <RechargeModal 
                    onClose={() => setShowRechargeModal(false)}
                    onSuccess={(newBalance) => {
                        setShowRechargeModal(false);
                        setUserProfile(prev => ({
                            ...prev,
                            scan_wallet_balance: parseFloat(newBalance).toFixed(2)
                        }));
                        const saved = localStorage.getItem('adminUser');
                        if (saved) {
                            const user = JSON.parse(saved);
                            user.scan_wallet_balance = newBalance;
                            localStorage.setItem('adminUser', JSON.stringify(user));
                        }
                        popup.showSuccess(`Wallet successfully recharged! New Balance: ₹${newBalance}`);
                    }}
                />
            )}
            
            {showWalletHistoryModal && (
                <WalletHistoryModal onClose={() => setShowWalletHistoryModal(false)} />
            )}
		</div>
	);
}
