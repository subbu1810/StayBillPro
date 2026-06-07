import React, { useState, useEffect, useMemo } from 'react';
import { sparesAPI, productsAPI, categoriesAPI, stockLogAPI } from '../services/api';
import { useService } from '../hooks/useService';
import '../styles/Tables.css';
import '../styles/Forms.css';
import '../styles/InventoryScreen.css';
import AddItemModal from './AddItemModal';
import '../styles/AddItemModal.css';

export default function InventoryScreen({ initialSection = 'sales', defaultTab = 'stock' }) {
	const { selectedBranchId } = useService();
	const [items, setItems] = useState([]);
	const [allCategories, setAllCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showForm, setShowForm] = useState(false);
	const [isEdit, setIsEdit] = useState(false);
	const [currentId, setCurrentId] = useState(null);
	const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
	
	const [formData, setFormData] = useState({
		name: '',
		company: '',
		category: '',
		price: 0,
		quantity: 0,
		part_number: '',
		status: 'available',
		section: 'sales' // sales or service
	});

	const [activeSection, setActiveSection] = useState(initialSection);
	const [selectedCategory, setSelectedCategory] = useState('All');
	const [searchQuery, setSearchQuery] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [viewMode, setViewMode] = useState('stock'); // stock, categories, ledger
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showAdjustModal, setShowAdjustModal] = useState(false);
	const [adjustType, setAdjustType] = useState('in'); // 'in' or 'out'
	const [adjustItem, setAdjustItem] = useState(null);
	const [adjustQty, setAdjustQty] = useState(1);
	const [adjustRetailPrice, setAdjustRetailPrice] = useState('');
	const [adjustWholesalePrice, setAdjustWholesalePrice] = useState('');
	const [stockHistory, setStockHistory] = useState([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [categoryToDelete, setCategoryToDelete] = useState('');
	const [itemToDelete, setItemToDelete] = useState(null);
	const [categoryModalMode, setCategoryModalMode] = useState('add'); // add or edit
	const [editOriginalName, setEditOriginalName] = useState('');
	const [newCategoryName, setNewCategoryName] = useState('');
	const [showAddItemModal, setShowAddItemModal] = useState(false);
	const [bulkItems, setBulkItems] = useState([
		{ 
			name: '', 
			part_number: '', 
			company: '', 
			price: 0, 
			quantity: 0,
			hsn_code: '',
			gst_rate: 18,
			serial_number: '',
			dimensions: '',
			purchase_price: 0,
			isExpanded: false 
		}
	]);
	const [managedCategories, setManagedCategories] = useState([]);

	const [isScanning, setIsScanning] = useState(false);
	const [scanMessageIndex, setScanMessageIndex] = useState(0);
	const [showScanModal, setShowScanModal] = useState(false);
	const [scanResults, setScanResults] = useState([]);
	const [advancedEditIndex, setAdvancedEditIndex] = useState(null);
	const fileInputRef = React.useRef(null);
	const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

	const funnyMessages = [
		"Waking up the AI...",
		"Teaching it how to read...",
		"Decoding the handwriting...",
		"Crunching the numbers...",
		"Counting the pixels...",
		"Almost there..."
	];

	useEffect(() => {
		let interval;
		if (isScanning) {
			setScanMessageIndex(0);
			interval = setInterval(() => {
				setScanMessageIndex((prev) => (prev + 1) % funnyMessages.length);
			}, 3000);
		}
		return () => clearInterval(interval);
	}, [isScanning]);

	useEffect(() => {
		fetchCategories();
	}, [activeSection]);

	const showMessage = (message, type = 'success') => {
		setNotification({ show: true, message, type });
		setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
	};

	const fetchCategories = async () => {
		try {
			const type = activeSection === 'sales' ? 'sales' : 'service';
			const response = await categoriesAPI.getAll(type, { branch_id: selectedBranchId });
			setAllCategories(response || []);
		} catch (error) {
			console.error('Error fetching categories:', error);
		}
	};

	// Extract unique categories
	const categories = useMemo(() => {
		const fromDB = allCategories.map(c => c.name);
		return ['All', ...new Set(fromDB)];
	}, [allCategories]);

	const filteredItems = useMemo(() => {
		let results = [...items];
		
		// Category Filter
		if (selectedCategory !== 'All') {
			results = results.filter(s => (s.category_name || s.category || 'General') === selectedCategory);
		}
		
		// Search Filter (Name, SKU, Serial)
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			results = results.filter(s => 
				(s.name || '').toLowerCase().includes(query) || 
				(s.part_number || '').toLowerCase().includes(query) || 
				(s.serial_number || '').toLowerCase().includes(query)
			);
		}
		
		// Date Filter
		if (startDate) {
			results = results.filter(s => new Date(s.created_at) >= new Date(startDate));
		}
		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			results = results.filter(s => new Date(s.created_at) <= end);
		}
		
		return results;
	}, [items, selectedCategory, searchQuery, startDate, endDate]);

	const filteredStockHistory = useMemo(() => {
		let results = [...stockHistory];
		if (startDate) {
			results = results.filter(entry => new Date(entry.created_at) >= new Date(startDate));
		}
		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			results = results.filter(entry => new Date(entry.created_at) <= end);
		}
		return results;
	}, [stockHistory, startDate, endDate]);

	useEffect(() => {
		setActiveSection(initialSection);
		setFormData(prev => ({ ...prev, section: initialSection }));
	}, [initialSection]);

	useEffect(() => {
		if (defaultTab) {
			// Map sidebar names to internal viewModes
			if (defaultTab === 'stock') setViewMode('stock');
			else if (defaultTab === 'categories') setViewMode('categories');
			else if (defaultTab === 'ledger') setViewMode('ledger');
			else if (defaultTab === 'expiry') setViewMode('expiry');
			else setViewMode('stock');
		}
	}, [defaultTab]);

	useEffect(() => {
		fetchItems();
		fetchLogs();
	}, [activeSection]);

	const fetchLogs = async () => {
		try {
			const type = activeSection === 'sales' ? 'sales' : 'service';
			const logs = await stockLogAPI.getAll(type, { branch_id: selectedBranchId });
			setStockHistory(logs || []);
		} catch (error) {
			console.error('Error fetching logs:', error);
		}
	};

	const fetchItems = async () => {
		try {
			setLoading(true);
			setError(null);
			const api = activeSection === 'sales' ? productsAPI : sparesAPI;
			const response = await api.getAll({ branch_id: selectedBranchId });
			
			let results = [];
			if (Array.isArray(response)) {
				results = response;
			} else if (response && Array.isArray(response.data)) {
				results = response.data;
			}
			
			setItems(results);
		} catch (error) {
			console.error('Error fetching inventory:', error);
			setError('Could not connect to the inventory service.');
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? (checked ? 'available' : 'unavailable') : 
			        name === 'quantity' || name === 'price' ? Number(value) : value
		}));
	};

	const resetForm = () => {
		setFormData({
			name: '',
			company: '',
			category: '',
			price: 0,
			quantity: 0,
			part_number: '',
			status: 'available',
			section: activeSection
		});
		setBulkItems([{ name: '', part_number: '', company: '', price: 0, quantity: 0 }]);
		setIsEdit(false);
		setCurrentId(null);
		setShowForm(false);
	};

	const handleEdit = (item) => {
		setCurrentId(item.id);
		setIsEdit(true);
		setShowAddItemModal(true);
	};

	const handleAdjustStock = async () => {
		if (!adjustItem || adjustQty <= 0) return;
		try {
			const currentStock = adjustItem.quantity || adjustItem.stock || 0;
			const newQty = adjustType === 'in' ? currentStock + Number(adjustQty) : Math.max(0, currentStock - Number(adjustQty));
			
			const api = activeSection === 'sales' ? productsAPI : sparesAPI;
			const updatedItem = { 
				...adjustItem, 
				quantity: newQty, 
				branch_id: selectedBranchId 
			};
			if (adjustType === 'in') {
				updatedItem.price = adjustRetailPrice !== '' ? Number(adjustRetailPrice) : adjustItem.price;
				updatedItem.wholesale_price = adjustWholesalePrice !== '' ? Number(adjustWholesalePrice) : adjustItem.wholesale_price;
			}
			await api.update(adjustItem.id, updatedItem);
			
			await stockLogAPI.create({
				item_id: adjustItem.id,
				item_type: activeSection,
				item_name: adjustItem.name,
				change_type: adjustType,
				quantity_changed: parseInt(adjustQty),
				resulting_quantity: newQty,
				reason: `Manual Adjustment (${adjustType})`,
				branch_id: selectedBranchId
			});
			
			fetchItems();
			fetchLogs();
			setShowAdjustModal(false);
			showMessage(`Stock ${adjustType === 'in' ? 'added' : 'deducted'} successfully!`);
		} catch (error) {
			console.error('Failed to adjust stock', error);
			showMessage('Failed to adjust stock. Please try again.', 'error');
		}
	};

	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('document', file);

		setIsScanning(true);
		showMessage('Scanning document with AI... Please wait.', 'success');

		try {
			const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
			const response = await fetch(`${API_BASE}/ocr/scan-bill`, {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${token}` },
				body: formData
			});

			const data = await response.json();
			if (data.success) {
				if (data.newWalletBalance !== undefined) {
					try {
						const saved = localStorage.getItem('adminUser');
						if (saved) {
							const user = JSON.parse(saved);
							user.scan_wallet_balance = data.newWalletBalance;
							localStorage.setItem('adminUser', JSON.stringify(user));
							window.dispatchEvent(new Event('walletUpdated'));
						}
					} catch (e) {}
				}

				if (data.items && data.items.length > 0) {
					setScanResults(data.items);
					setShowScanModal(true);
				} else {
					showMessage('No items could be read from the document.', 'error');
				}
			} else {
				showMessage(data.message || 'Failed to scan document', 'error');
			}
		} catch (error) {
			console.error('Scan error:', error);
			showMessage(`Error: ${error.message || 'Failed to communicate with scanner'}`, 'error');
		} finally {
			setIsScanning(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const handleConfirmScan = async () => {
		try {
			const api = activeSection === 'sales' ? productsAPI : sparesAPI;
			for (const item of scanResults) {
				await api.create({
					name: item.name,
					price: item.rate || 0,
					purchase_price: item.netRate || 0,
					wholesale_price: item.netRate || 0,
					quantity: item.quantity || 0,
					branch_id: selectedBranchId,
					category: item.category || 'General',
					status: 'available',
					hsn_code: item.hsn || '',
					gst_rate: item.gst || 0
				});
				
				await stockLogAPI.create({
					item_id: null,
					item_type: activeSection,
					item_name: item.name,
					change_type: 'in',
					quantity_changed: item.qty,
					resulting_quantity: item.qty,
					reason: `OCR Scan Added`,
					branch_id: selectedBranchId
				});
			}
			showMessage('All items successfully added from scan!');
			setShowScanModal(false);
			fetchItems();
			fetchLogs();
		} catch (err) {
			console.error(err);
			showMessage('Error saving scanned items', 'error');
		}
	};

	const handleAdvancedEditSave = async (payload) => {
		try {
			const api = activeSection === 'sales' ? productsAPI : sparesAPI;
			
			// Extract numerical rate
			const taxMatch = payload.taxRate && payload.taxRate.match(/\d+/);
			const gstRate = taxMatch ? parseInt(taxMatch[0]) : 0;
			
			const mappedPayload = {
				name: payload.name,
				hsn_code: payload.hsn,
				part_number: payload.code, // sku/code maps to part_number in DB
				category: payload.category || 'General',
				brand: payload.brand || 'Generic',
				unit: payload.unit || 'Nos',
				price: parseFloat(payload.salePrice) || 0,
				wholesale_price: parseFloat(payload.wholesalePrice) || 0,
				purchase_price: parseFloat(payload.purchasePrice) || 0,
				min_wholesale_qty: parseInt(payload.minWholesaleQty) || 0,
				quantity: parseFloat(payload.openingStock) || 0,
				low_stock_warning: parseInt(payload.lowStockWarning) || 5,
				gst_rate: gstRate,
				dimensions: payload.dimensions,
				size: payload.size,
				serial_number: payload.serial_number,
				status: payload.status || 'available',
				has_expiry: payload.hasExpiry ? 1 : 0,
				expiry_date: payload.expiryDate || null,
				type: payload.type || (activeSection === 'sales' ? 'sales' : 'service')
			};

			let createdItem;
			if (payload.image && payload.image instanceof File) {
				const formData = new FormData();
				Object.keys(mappedPayload).forEach(key => {
					if (mappedPayload[key] !== null && mappedPayload[key] !== undefined) {
						formData.append(key, mappedPayload[key]);
					}
				});
				formData.append('branch_id', selectedBranchId);
				formData.append('image', payload.image);
				createdItem = await api.createWithImage(formData);
			} else {
				createdItem = await api.create({ ...mappedPayload, branch_id: selectedBranchId });
			}
			
			// Remove from scan results since it's saved
			const newRes = [...scanResults];
			newRes.splice(advancedEditIndex, 1);
			setScanResults(newRes);
			
			setAdvancedEditIndex(null);
			showMessage('Item saved successfully');
			fetchItems();
			
			// Close scan modal if no more items
			if (newRes.length === 0) {
				setShowScanModal(false);
			}
		} catch (error) {
			console.error('Advanced edit save error:', error);
			showMessage('Failed to save item', 'error');
		}
	};

	const handleSaveCategory = async () => {
		if (!newCategoryName.trim()) return;

		try {
			if (categoryModalMode === 'add') {
				await categoriesAPI.create({ 
					name: newCategoryName.trim(), 
					type: activeSection === 'sales' ? 'sales' : 'service',
					branch_id: selectedBranchId 
				});
			} else {
				const catId = allCategories.find(c => c.name === editOriginalName)?.id;
				if (catId) {
					await categoriesAPI.update(catId, { 
						name: newCategoryName.trim(), 
						type: activeSection === 'sales' ? 'sales' : 'service' 
					});
				}
			}
			showMessage(`Category ${categoryModalMode === 'add' ? 'created' : 'updated'} successfuly!`);
			setShowCategoryModal(false);
			setNewCategoryName('');
			fetchCategories();
		} catch (error) {
			console.error('Failed to save category', error);
			showMessage('Failed to save category.', 'error');
		}
	};

	const handleDelete = (id) => {
		const item = items.find(i => i.id === id);
		setItemToDelete(item);
	};

	const executeDelete = async () => {
		if (!itemToDelete) return;
		try {
			const api = activeSection === 'sales' ? productsAPI : sparesAPI;
			await api.delete(itemToDelete.id);
			fetchItems();
			showMessage('Item deleted successfully!');
		} catch (error) {
			console.error('Failed to delete', error);
			showMessage('Failed to delete item.', 'error');
		} finally {
			setItemToDelete(null);
		}
	};
	const handleToggleForm = () => {
		setShowAddItemModal(true);
	};

	const handleBulkInputChange = (index, field, value) => {
		const updated = [...bulkItems];
		updated[index][field] = value;
		setBulkItems(updated);
	};

	const addBulkRow = () => {
		setBulkItems([...bulkItems, { 
			name: '', 
			part_number: '', 
			company: '', 
			price: 0, 
			quantity: 0, 
			hsn_code: '',
			gst_rate: 18,
			serial_number: '',
			dimensions: '',
			purchase_price: 0,
			isExpanded: false
		}]);
	};

	const removeBulkRow = (index) => {
		if (bulkItems.length > 1) {
			setBulkItems(bulkItems.filter((_, i) => i !== index));
		}
	};

	const handleModalSave = async (payload) => {
		try {
			const api = payload.type === 'sales' ? productsAPI : sparesAPI;
			const categoryId = allCategories.find(c => c.name === payload.category)?.id;
			
			if (!payload.category || !categoryId) {
				showMessage('Please select a valid category.', 'error');
				return;
			}

			const dbPayload = {
				...payload,
				category_id: categoryId,
				admin_id: 1, // Assuming admin_id 1 for now, should come from auth
				branch_id: selectedBranchId,
				brand: payload.brand || '',
				sku: payload.type === 'sales' ? payload.part_number : undefined,
				part_number: payload.type === 'service' ? payload.part_number : undefined,
			};

			if (isEdit && currentId) {
				await api.update(currentId, dbPayload);
				showMessage(`${payload.name} updated successfully!`);
			} else {
				const result = await api.create(dbPayload);

				if (payload.quantity > 0) {
					await stockLogAPI.create({
						item_id: result.id || result.insertId,
						item_type: payload.type,
						item_name: payload.name,
						change_type: 'initial',
						quantity_changed: payload.quantity,
						resulting_quantity: payload.quantity,
						reason: 'Initial Stock Entry',
						branch_id: selectedBranchId
					});
				}
				showMessage('Item added successfully!');
			}
			setShowAddItemModal(false);
			setIsEdit(false);
			setCurrentId(null);
			fetchItems();
			fetchLogs();
		} catch (error) {
			console.error('Failed to save', error);
			showMessage('Failed to save item.', 'error');
		}
	};

	return (
		<div className="sb-pro-inventory-layout" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', background: '#fafafa', gap: '20px', padding: '12px', position: 'relative' }}>
			
			{/* Toast Notification */}
			{notification.show && (
				<div 
					style={{
						position: 'fixed',
						top: '20px',
						right: '20px',
						padding: '12px 24px',
						background: notification.type === 'success' ? '#10b981' : '#ef4444',
						color: 'white',
						borderRadius: '8px',
						boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
						zIndex: 9999,
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						animation: 'slideIn 0.3s ease-out'
					}}
				>
					<span style={{ fontSize: '1.2rem' }}>{notification.type === 'success' ? '✅' : '❌'}</span>
					<span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{notification.message}</span>
				</div>
			)}

			{/* Main Content: Header, View Switcher, and Dynamic View */}
			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
				
				{/* Top Navigation & View Switcher */}
				<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<div style={{ padding: '6px', background: 'white', borderRadius: '8px', fontSize: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
								{activeSection === 'sales' ? '🛒' : '🛠️'}
							</div>
							<h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
								{activeSection === 'sales' ? 'Sales Stock' : 'Service Parts'}
								<span style={{ background: '#e2e8f0', color: '#475569', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
									{filteredItems.length}
								</span>
							</h1>
						</div>

						{/* Compact Multi-Filter Bar */}
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
							{/* Category */}
							<select 
								value={selectedCategory} 
								onChange={(e) => setSelectedCategory(e.target.value)}
								style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '600', background: 'white', outline: 'none', minWidth: '110px' }}
							>
								{categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? '📂 Categories' : cat}</option>)}
							</select>

							{/* Search Bar */}
							<div style={{ position: 'relative', marginLeft: '4px' }}>
								<span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
								<input 
									type="text" 
									placeholder="Search name, SKU, S/N..." 
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									style={{ padding: '4px 10px 4px 30px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', outline: 'none', width: '180px', background: '#f8fafc' }}
								/>
							</div>

							{/* Date Filters */}
							<div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px', borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
								<input 
									type="date" 
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', outline: 'none', background: '#f8fafc', width: '110px' }}
									title="Start Date"
								/>
								<span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
								<input 
									type="date" 
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', outline: 'none', background: '#f8fafc', width: '110px' }}
									title="End Date"
								/>
								{(startDate || endDate) && (
									<button 
										onClick={() => { setStartDate(''); setEndDate(''); }}
										style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px', title: 'Clear Dates' }}
									>✕</button>
								)}
							</div>
						</div>
					</div>

					{viewMode === 'stock' && (
						<div style={{ display: 'flex', gap: '8px' }}>
							<input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
							<button 
								onClick={() => fileInputRef.current && fileInputRef.current.click()}
								disabled={isScanning}
								style={{ 
									padding: '6px 14px', 
									background: '#f59e0b', 
									color: 'white', 
									border: 'none', 
									borderRadius: '6px', 
									fontWeight: 'bold', 
									cursor: isScanning ? 'not-allowed' : 'pointer', 
									fontSize: '0.75rem',
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
									boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
								}}
							>
								{isScanning ? '⏳ Scanning...' : '📷 Scan Bill'}
							</button>
							<button 
								onClick={handleToggleForm}
								style={{ 
									padding: '6px 14px', 
									background: showForm ? '#f1f5f9' : '#14b8a6', 
									color: showForm ? '#475569' : 'white', 
									border: 'none', 
									borderRadius: '6px', 
									fontWeight: 'bold', 
									cursor: 'pointer', 
									fontSize: '0.75rem',
									boxShadow: showForm ? 'none' : '0 2px 4px rgba(20, 184, 166, 0.2)'
								}}
							>
								{showForm ? '✕ Close Form' : '＋ New Entry'}
							</button>
						</div>
					)}
				</header>

				{/* Dynamically Render Views */}
				<div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
					{viewMode === 'stock' && (
						<>
							<AddItemModal 
								isOpen={showAddItemModal} 
								onClose={() => { setShowAddItemModal(false); setIsEdit(false); setCurrentId(null); }} 
								onSave={handleModalSave}
								categories={allCategories}
								initialData={isEdit ? { ...items.find(i => i.id === currentId), type: activeSection } : { type: activeSection }}
							/>

							<div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #eef2f6', overflow: 'auto' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
									<thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
										<tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
											<th style={{ padding: '8px 12px', color: '#64748b', width: '20%' }}>Product Name</th>
											<th style={{ padding: '8px 12px', color: '#64748b' }}>Category</th>
											<th style={{ padding: '8px 12px', color: '#64748b' }}>Brand</th>
											<th style={{ padding: '8px 12px', color: '#64748b' }}>SKU/ID</th>
											<th style={{ padding: '8px 12px', color: '#64748b' }}>HSN</th>
											<th style={{ padding: '8px 12px', color: '#64748b', textAlign: 'center' }}>GST</th>
											<th style={{ padding: '8px 12px', color: '#64748b', textAlign: 'center' }}>Stock</th>
											<th style={{ padding: '8px 12px', color: '#64748b' }}>Serial No</th>
											<th style={{ padding: '8px 12px', color: '#64748b' }}>Dimensions</th>
											<th style={{ padding: '8px 12px', color: '#64748b' }}>Size</th>
											<th style={{ padding: '8px 12px', color: '#64748b' }}>Expiry</th>
											<th style={{ padding: '8px 12px', color: '#64748b', textAlign: 'right' }}>Pur. Price</th>
											<th style={{ padding: '8px 12px', color: '#64748b', textAlign: 'right' }}>Whol. Price</th>
											<th style={{ padding: '8px 12px', color: '#64748b', textAlign: 'center' }}>Min Whol Qty</th>
											<th style={{ padding: '8px 12px', color: '#64748b', textAlign: 'center' }}>Status</th>
											<th style={{ padding: '8px 12px', color: '#64748b', textAlign: 'right' }}>Price</th>
											<th style={{ padding: '8px 12px', color: '#64748b', textAlign: 'right' }}>Actions</th>
										</tr>
									</thead>
									<tbody>
										{filteredItems.map(item => (
											<tr key={item.id} style={{ borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' }} className="stock-table-row">
												<td style={{ padding: '6px 12px' }}>
													<div style={{ fontWeight: '700', color: '#1e293b' }}>{item.name}</div>
												</td>
												<td style={{ padding: '6px 12px' }}>
													<span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', color: '#475569', fontWeight: '600' }}>
														{item.category_name || item.category || 'General'}
													</span>
												</td>
												<td style={{ padding: '6px 12px', color: '#64748b' }}>{item.brand || item.company}</td>
												<td style={{ padding: '6px 12px', color: '#64748b', fontFamily: 'monospace' }}>{item.part_number || item.sku || '—'}</td>
												<td style={{ padding: '6px 12px', color: '#64748b' }}>{item.hsn_code || '—'}</td>
												<td style={{ padding: '6px 12px', textAlign: 'center' }}>
													{item.gst_rate !== undefined ? <span style={{ color: '#059669', fontWeight: 'bold' }}>{item.gst_rate}%</span> : '—'}
												</td>
												<td style={{ padding: '6px 12px', textAlign: 'center' }}>
													<span style={{ 
														padding: '2px 6px', 
														borderRadius: '4px', 
														background: (item.quantity||item.stock) < 5 ? '#fef2f2' : '#f0fdf4', 
														color: (item.quantity||item.stock) < 5 ? '#ef4444' : '#15803d', 
														fontWeight: '900',
														fontSize: '0.7rem'
													}}>
														{item.quantity || item.stock}
													</span>
												</td>
												<td style={{ padding: '6px 12px', color: '#94a3b8', fontSize: '0.65rem' }}>{item.serial_number || '—'}</td>
												<td style={{ padding: '6px 12px', color: '#64748b' }}>{item.dimensions || '—'}</td>
												<td style={{ padding: '6px 12px', color: '#64748b', fontWeight: 'bold' }}>{item.size || '—'}</td>
												<td style={{ padding: '6px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
													{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}
												</td>
												<td style={{ padding: '6px 12px', textAlign: 'right' }}>₹{(item.purchase_price || 0).toLocaleString()}</td>
												<td style={{ padding: '6px 12px', textAlign: 'right' }}>{item.wholesale_price ? `₹${item.wholesale_price.toLocaleString()}` : '—'}</td>
												<td style={{ padding: '6px 12px', textAlign: 'center' }}>{item.min_wholesale_qty || '—'}</td>
												<td style={{ padding: '6px 12px', textAlign: 'center' }}>
													<span style={{
														padding: '2px 6px',
														borderRadius: '4px',
														background: item.status === 'available' ? '#f0fdf4' : item.status === 'out_of_stock' ? '#fef2f2' : '#f1f5f9',
														color: item.status === 'available' ? '#15803d' : item.status === 'out_of_stock' ? '#ef4444' : '#475569',
														fontWeight: '600',
														fontSize: '0.7rem'
													}}>
														{item.status ? item.status.replace(/_/g, ' ').toUpperCase() : 'AVAILABLE'}
													</span>
												</td>
												<td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold' }}>₹{(item.price || 0).toLocaleString()}</td>
												<td style={{ padding: '4px 12px', textAlign: 'right' }}>
													<div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
														<button 
															onClick={() => { 
																setAdjustItem(item); 
																setAdjustType('in'); 
																setAdjustRetailPrice(item.price || '');
																setAdjustWholesalePrice(item.wholesale_price || '');
																setShowAdjustModal(true); 
															}}
															className="adjust-btn-sm in"
														>＋</button>
														<button 
															onClick={() => { setAdjustItem(item); setAdjustType('out'); setShowAdjustModal(true); }}
															className="adjust-btn-sm out"
														>－</button>
														<button onClick={() => handleEdit(item)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem', padding: '0 4px' }}>✎</button>
														<button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem', padding: '0 4px' }}>🗑️</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</>
					)}

					{viewMode === 'ledger' && (
						<div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #eef2f6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
							<div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem' }}>Stock Movement Ledger</div>
							<div style={{ flex: 1, overflow: 'auto' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
									<thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
										<tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
											<th style={{ padding: '12px 16px', color: '#64748b' }}>Time</th>
											<th style={{ padding: '12px 16px', color: '#64748b' }}>Item</th>
											<th style={{ padding: '12px 16px', color: '#64748b' }}>Type</th>
											<th style={{ padding: '12px 16px', color: '#64748b', textAlign: 'center' }}>Adjustment</th>
											<th style={{ padding: '12px 16px', color: '#64748b', textAlign: 'right' }}>Resulting Stock</th>
										</tr>
									</thead>
									<tbody>
										{filteredStockHistory.map(entry => (
											<tr key={entry.id} style={{ borderBottom: '1px solid #f8fafc' }}>
												<td style={{ padding: '10px 16px', color: '#94a3b8' }}>
													{new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</td>
												<td style={{ padding: '10px 16px', fontWeight: 'bold' }}>{entry.item_name}</td>
												<td style={{ padding: '10px 16px' }}>
													<span style={{ 
														padding: '2px 6px', 
														borderRadius: '4px', 
														background: entry.change_type === 'in' || entry.change_type === 'initial' ? '#f0fdf4' : '#fef2f2', 
														color: entry.change_type === 'in' || entry.change_type === 'initial' ? '#15803d' : '#ef4444', 
														fontSize: '0.65rem', 
														fontWeight: 'bold',
														textTransform: 'uppercase'
													}}>
														{entry.change_type}
													</span>
												</td>
												<td style={{ padding: '10px 16px', textAlign: 'center', color: entry.change_type === 'in' || entry.change_type === 'initial' ? '#15803d' : '#ef4444', fontWeight: 'bold' }}>
													{entry.change_type === 'in' || entry.change_type === 'initial' ? '＋' : '－'}{entry.quantity_changed}
												</td>
												<td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 'bold' }}>{entry.resulting_quantity}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{viewMode === 'categories' && (
						<div style={{ background: 'white', borderRadius: '12px', border: '1px solid #eef2f6', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
							<div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Master Category List</h3>
								<button 
									onClick={() => { setCategoryModalMode('add'); setNewCategoryName(''); setShowCategoryModal(true); }}
									style={{ padding: '8px 16px', background: '#14b8a6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
								>
									＋ Create New Category
								</button>
							</div>
							<div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
									{allCategories.map(cat => (
										<div key={cat.id} style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
											<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
												<div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏷️</div>
												<div>
													<div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{cat.name}</div>
													<div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Global Category</div>
												</div>
											</div>
											<div style={{ display: 'flex', gap: '8px' }}>
												<button 
													onClick={() => { setCategoryModalMode('edit'); setEditOriginalName(cat.name); setNewCategoryName(cat.name); setCurrentId(cat.id); setShowCategoryModal(true); }}
													style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
												>✏️</button>
												<button 
													onClick={() => { setCategoryToDelete(cat.name); setCurrentId(cat.id); setShowDeleteConfirm(true); }}
													style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', borderRadius: '8px', cursor: 'pointer' }}
												>🗑️</button>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{viewMode === 'expiry' && (
						<div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #eef2f6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
							<div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem' }}>Expiry Monitor</div>
							<div style={{ flex: 1, overflow: 'auto' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
									<thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
										<tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
											<th style={{ padding: '12px 16px', color: '#64748b' }}>Item</th>
											<th style={{ padding: '12px 16px', color: '#64748b' }}>Category</th>
											<th style={{ padding: '12px 16px', color: '#64748b' }}>Stock</th>
											<th style={{ padding: '12px 16px', color: '#64748b' }}>Expiry Date</th>
											<th style={{ padding: '12px 16px', color: '#64748b' }}>Status</th>
										</tr>
									</thead>
									<tbody>
										{filteredItems
											.filter(item => item.expiry_date)
											.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
											.map(item => {
												const expiryDate = new Date(item.expiry_date);
												const today = new Date();
												today.setHours(0,0,0,0);
												const isExpired = expiryDate < today;
												const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
												const isExpiringSoon = !isExpired && daysToExpiry <= 30;

												return (
													<tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
														<td style={{ padding: '10px 16px', fontWeight: 'bold' }}>{item.name}</td>
														<td style={{ padding: '10px 16px' }}>{item.category_name || item.category || 'General'}</td>
														<td style={{ padding: '10px 16px', fontWeight: 'bold' }}>{item.quantity || item.stock}</td>
														<td style={{ padding: '10px 16px', fontWeight: 'bold', color: isExpired ? '#ef4444' : isExpiringSoon ? '#eab308' : '#15803d' }}>
															{expiryDate.toLocaleDateString()}
														</td>
														<td style={{ padding: '10px 16px' }}>
															<span style={{ 
																padding: '4px 8px', 
																borderRadius: '4px', 
																background: isExpired ? '#fef2f2' : isExpiringSoon ? '#fefce8' : '#f0fdf4', 
																color: isExpired ? '#ef4444' : isExpiringSoon ? '#ca8a04' : '#15803d', 
																fontSize: '0.7rem', 
																fontWeight: 'bold',
															}}>
																{isExpired ? 'EXPIRED' : isExpiringSoon ? `EXPIRING IN ${daysToExpiry} DAYS` : 'GOOD'}
															</span>
														</td>
													</tr>
												);
											})}
										{filteredItems.filter(item => item.expiry_date).length === 0 && (
											<tr>
												<td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
													No items with expiry dates found.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>

			<datalist id={`categories-${activeSection}`}>
				{categories.filter(c => c !== 'All').map(c => (
					<option key={c} value={c} />
				))}
			</datalist>

			{/* Add/Edit Category Modal */}
			{showCategoryModal && (
				<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
					<div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '360px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
						<h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#1e293b' }}>
							{categoryModalMode === 'add' ? 'Add New Category' : 'Rename Category'}
						</h3>
						<input 
							autoFocus
							type="text" 
							placeholder="Enter category name..." 
							value={newCategoryName}
							onChange={(e) => setNewCategoryName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleSaveCategory();
							}}
							style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.9rem', outline: 'none' }}
						/>
						<div style={{ display: 'flex', gap: '8px' }}>
							<button 
								onClick={() => {
									setShowCategoryModal(false);
									setNewCategoryName('');
								}}
								style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold', fontSize: '0.85rem' }}
							>Cancel</button>
							<button 
								onClick={handleSaveCategory}
								style={{ flex: 1, padding: '10px', border: 'none', background: '#14b8a6', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
							>
								{categoryModalMode === 'add' ? 'Save Category' : 'Update Name'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Custom Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
					<div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '360px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}>
						<div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
						<h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#1e293b' }}>Confirm Deletion</h3>
						<p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
							Are you sure you want to delete <strong style={{color: '#1e293b'}}>"{categoryToDelete}"</strong>?<br/>
							Existing items will stay but will lose this tag.
						</p>
						<div style={{ display: 'flex', gap: '8px' }}>
							<button 
								onClick={() => setShowDeleteConfirm(false)}
								style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold', fontSize: '0.85rem' }}
							>Keep Category</button>
							<button 
								onClick={async () => {
									const catId = allCategories.find(c => c.name === categoryToDelete)?.id;
									if (catId) {
										await categoriesAPI.delete(catId);
										fetchCategories();
										if (selectedCategory === categoryToDelete) setSelectedCategory('All');
									}
									setShowDeleteConfirm(false);
								}}
								style={{ flex: 1, padding: '10px', border: 'none', background: '#f43f5e', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
							>Yes, Delete</button>
						</div>
					</div>
				</div>
			)}
			{/* Stock Adjustment Modal */}
			{showAdjustModal && (
				<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002 }}>
					<div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
						<h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#1e293b' }}>
							{adjustType === 'in' ? 'Stock In (Add)' : 'Stock Out (Deduct)'}
						</h3>
						<p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>{adjustItem?.name}</p>
						
						<label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>Quantity to {adjustType === 'in' ? 'Add' : 'Deduct'}</label>
						<input 
							autoFocus
							type="number" 
							value={adjustQty}
							onChange={(e) => setAdjustQty(e.target.value)}
							style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}
						/>
						
						{adjustType === 'in' && (
							<div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
								<div style={{ flex: 1 }}>
									<label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>Retail Price</label>
									<input 
										type="number" 
										value={adjustRetailPrice}
										onChange={(e) => setAdjustRetailPrice(e.target.value)}
										style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 'bold' }}
									/>
								</div>
								<div style={{ flex: 1 }}>
									<label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>Wholesale Price</label>
									<input 
										type="number" 
										value={adjustWholesalePrice}
										onChange={(e) => setAdjustWholesalePrice(e.target.value)}
										style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 'bold' }}
									/>
								</div>
							</div>
						)}
						
						<div style={{ display: 'flex', gap: '8px' }}>
							<button onClick={() => setShowAdjustModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>Cancel</button>
							<button 
								onClick={handleAdjustStock}
								style={{ flex: 1, padding: '10px', border: 'none', background: adjustType === 'in' ? '#15803d' : '#ef4444', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
							>Confirm {adjustType.toUpperCase()}</button>
						</div>
					</div>
				</div>
			)}
			{/* Delete Confirmation Modal */}
			{itemToDelete && (
				<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
					<div style={{ background: 'white', borderRadius: '16px', width: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', textAlign: 'center' }}>
						<div style={{ width: '60px', height: '60px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>
							🗑️
						</div>
						<h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '800' }}>Confirm Deletion</h3>
						<p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 24px' }}>
							Are you sure you want to delete <strong>{itemToDelete.name}</strong>? This action cannot be undone.
						</p>
						<div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
							<button 
								onClick={() => setItemToDelete(null)}
								style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '700', cursor: 'pointer', flex: 1 }}
							>
								Cancel
							</button>
							<button 
								onClick={executeDelete}
								style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer', flex: 1, boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
							>
								Yes, Delete
							</button>
						</div>
					</div>
				</div>
			)}
			
			{/* OCR Review Modal */}
			{showScanModal && (
				<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1003, backdropFilter: 'blur(2px)' }}>
					<div style={{ background: 'white', borderRadius: '16px', width: '95vw', height: '95vh', maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
						<div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Review Scanned Items</h3>
							<button onClick={() => setShowScanModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
						</div>
						
						<div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
							<p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#64748b' }}>
								The AI extracted the following items. Please verify and edit them before saving.
							</p>
							<div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
									<thead style={{ background: '#f8fafc' }}>
										<tr>
											<th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Item Name</th>
											<th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', width: '100px' }}>HSN</th>
											<th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', width: '60px' }}>GST%</th>
											<th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', width: '60px' }}>Qty</th>
											<th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', width: '80px' }}>Net Rate</th>
											<th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', width: '80px' }}>Rate</th>
											<th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', width: '80px' }}>Discount</th>
											<th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', width: '80px' }}>Amount</th>
											<th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', width: '100px' }}>Actions</th>
										</tr>
									</thead>
									<tbody>
										{scanResults.map((item, index) => (
											<tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
												<td style={{ padding: '4px' }}>
													<input 
														type="text" 
														value={item.name} 
														onChange={e => {
															const newRes = [...scanResults];
															newRes[index].name = e.target.value;
															setScanResults(newRes);
														}}
														style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem' }}
													/>
												</td>
												<td style={{ padding: '4px' }}>
													<input 
														type="text" 
														value={item.hsn || ''} 
														onChange={e => {
															const newRes = [...scanResults];
															newRes[index].hsn = e.target.value;
															setScanResults(newRes);
														}}
														style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem' }}
													/>
												</td>
												<td style={{ padding: '4px' }}>
													<input 
														type="number" 
														value={item.gst || 0} 
														onChange={e => {
															const newRes = [...scanResults];
															newRes[index].gst = Number(e.target.value);
															setScanResults(newRes);
														}}
														style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center' }}
													/>
												</td>
												<td style={{ padding: '4px' }}>
													<input 
														type="number" 
														value={item.quantity || 0} 
														onChange={e => {
															const newRes = [...scanResults];
															newRes[index].quantity = Number(e.target.value);
															setScanResults(newRes);
														}}
														style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center' }}
													/>
												</td>
												<td style={{ padding: '4px' }}>
													<input 
														type="number" 
														value={item.netRate || 0} 
														onChange={e => {
															const newRes = [...scanResults];
															newRes[index].netRate = Number(e.target.value);
															setScanResults(newRes);
														}}
														style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'right' }}
													/>
												</td>
												<td style={{ padding: '4px' }}>
													<input 
														type="number" 
														value={item.rate || 0} 
														onChange={e => {
															const newRes = [...scanResults];
															newRes[index].rate = Number(e.target.value);
															setScanResults(newRes);
														}}
														style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'right' }}
													/>
												</td>
												<td style={{ padding: '4px' }}>
													<input 
														type="number" 
														value={item.discount || 0} 
														onChange={e => {
															const newRes = [...scanResults];
															newRes[index].discount = Number(e.target.value);
															setScanResults(newRes);
														}}
														style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'right' }}
													/>
												</td>
												<td style={{ padding: '4px' }}>
													<input 
														type="number" 
														value={item.amount || 0} 
														onChange={e => {
															const newRes = [...scanResults];
															newRes[index].amount = Number(e.target.value);
															setScanResults(newRes);
														}}
														style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'right' }}
													/>
												</td>
												<td style={{ padding: '4px', textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
													<button 
														onClick={() => setAdvancedEditIndex(index)}
														style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}
														title="Advanced Edit"
													>
														Edit
													</button>
													<button 
														onClick={() => {
															const newRes = [...scanResults];
															newRes.splice(index, 1);
															setScanResults(newRes);
														}}
														style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}
														title="Remove Item"
													>
														✕
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{scanResults.length === 0 && (
								<div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
									No items left. Try scanning again.
								</div>
							)}
						</div>
						
						<div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
							<button onClick={() => setShowScanModal(false)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
							<button 
								onClick={handleConfirmScan}
								disabled={scanResults.length === 0}
								style={{ padding: '10px 20px', border: 'none', background: '#10b981', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: scanResults.length === 0 ? 'not-allowed' : 'pointer', opacity: scanResults.length === 0 ? 0.5 : 1 }}
							>Confirm & Save Items</button>
						</div>
					</div>
				</div>
			)}
			
			{/* Advanced Edit Modal inside Scanner */}
			{advancedEditIndex !== null && (
				<AddItemModal 
					isOpen={true} 
					onClose={() => setAdvancedEditIndex(null)} 
					onSave={handleAdvancedEditSave}
					categories={allCategories}
					initialData={{
						name: scanResults[advancedEditIndex]?.name || '',
						hsn_code: scanResults[advancedEditIndex]?.hsn || '',
						category: scanResults[advancedEditIndex]?.category || 'General',
						price: scanResults[advancedEditIndex]?.rate || '',
						purchase_price: scanResults[advancedEditIndex]?.netRate || '',
						wholesale_price: scanResults[advancedEditIndex]?.netRate || '',
						quantity: scanResults[advancedEditIndex]?.quantity || 0,
						gst_rate: scanResults[advancedEditIndex]?.gst || 0,
						type: activeSection === 'sales' ? 'sales' : 'service'
					}}
				/>
			)}

			{/* Funny Scanning Loading Overlay */}
			{isScanning && (
				<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', backdropFilter: 'blur(4px)' }}>
					<style>{`
						@keyframes bounceRobot {
							0% { transform: translateY(0) rotate(0deg) scale(1); }
							50% { transform: translateY(-30px) rotate(10deg) scale(1.1); }
							100% { transform: translateY(0) rotate(-10deg) scale(1); }
						}
						@keyframes pulseGlow {
							0% { text-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
							50% { text-shadow: 0 0 30px rgba(59, 130, 246, 1), 0 0 50px rgba(59, 130, 246, 0.8); }
							100% { text-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
						}
					`}</style>
					<div style={{ fontSize: '6rem', animation: 'bounceRobot 2s infinite ease-in-out' }}>🤖</div>
					<h2 style={{ marginTop: '30px', fontSize: '2rem', animation: 'pulseGlow 2s infinite', textAlign: 'center', transition: 'all 0.5s ease' }}>
						{funnyMessages[scanMessageIndex]}
					</h2>
					<p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '1.1rem' }}>
						This usually takes 10 to 20 seconds. Please don't click away!
					</p>
					<div style={{ marginTop: '40px', display: 'flex', gap: '10px' }}>
						<div style={{ width: '15px', height: '15px', background: '#3b82f6', borderRadius: '50%', animation: 'bounceRobot 1s infinite 0.1s' }}></div>
						<div style={{ width: '15px', height: '15px', background: '#ec4899', borderRadius: '50%', animation: 'bounceRobot 1s infinite 0.2s' }}></div>
						<div style={{ width: '15px', height: '15px', background: '#10b981', borderRadius: '50%', animation: 'bounceRobot 1s infinite 0.3s' }}></div>
					</div>
				</div>
			)}

		</div>
	);
}
