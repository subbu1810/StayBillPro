import React, { useEffect, useState, useMemo } from 'react';
import '../styles/NewJob.css';
import { useService } from '../hooks/useService';
import { estimatedServiceTimes } from '../data/products';
import { appliancesAPI, techniciansAPI } from '../services/api';
import { usePopup } from './ui/PopupProvider';

export default function NewJob({ onBack, onSuccess }) {
	const popup = usePopup();
	const { availableProducts: fallbackProducts, technicians: fallbackTechnicians, addJob, selectedBranchId } = useService();
	const [availableProducts, setAvailableProducts] = useState([]);
	const [availableTechnicians, setAvailableTechnicians] = useState([]);
	const [loadingProducts, setLoadingProducts] = useState(true);
	const [productsLoadError, setProductsLoadError] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState('');
	const [formData, setFormData] = useState({
		// Customer
		customerName: '',
		mobile: '',
		altMobile: '',
		address1: '',
		address2: '',
		city: '',
		pincode: '',
		email: '',
		// Product
		productId: '',
		brand: '',
		model: '',
		serial: '',
		purchaseDate: '',
		// Warranty
		warrantyStatus: 'no',
		warrantyClaimRequest: false,
		// Problem
		problemType: '',
		problemDescription: '',
		serviceType: 'Onsite',
		visitDate: '',
		visitTime: '',
		priority: 'Medium',
		estimatedTime: '', // Added field
		// Assignment
		technician: '',
		estimatedCharge: '',
		advanceCollected: '',
	});

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoadingProducts(true);
				setProductsLoadError('');
				const [appliances, technicians] = await Promise.all([
					appliancesAPI.getAll({ branch_id: selectedBranchId }),
					techniciansAPI.getAll({ branch_id: selectedBranchId }).catch(() => []),
				]);
				if (cancelled) return;
				// Map DB appliances -> UI expects { id, category, brand, model, name }
				const mapped = (appliances || []).map((a) => ({
					id: a.id,
					category: a.category || a.appliance_type || '',
					brand: a.brand || '',
					model: a.model || '',
					name: a.name || a.appliance_type || '',
				}));
				setAvailableProducts(mapped);
				setAvailableTechnicians(
					(technicians || [])
						.filter((t) => (t.status || 'active') !== 'inactive')
						.map((t) => t.name)
						.filter(Boolean)
				);
			} catch (err) {
				if (cancelled) return;
				setProductsLoadError(err?.message || 'Failed to load products');
				setAvailableProducts([]);
				setAvailableTechnicians((fallbackTechnicians || []).map((t) => t.name).filter(Boolean));
			} finally {
				if (!cancelled) setLoadingProducts(false);
			}
		})();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fallbackProducts, fallbackTechnicians, selectedBranchId]);

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	// Get products and problems based on selection
	const selectedProduct = useMemo(() => {
		return availableProducts.find((p) => p.id === parseInt(formData.productId, 10));
	}, [formData.productId, availableProducts]);

	const availableCategories = useMemo(() => {
		const cats = [...new Set(availableProducts.map((p) => p.category).filter(Boolean))];
		cats.sort((a, b) => a.localeCompare(b));
		return cats;
	}, [availableProducts]);



	const technicianOptions = useMemo(() => {
		return [...new Set((availableTechnicians || []).filter(Boolean))].sort((a, b) =>
			a.localeCompare(b)
		);
	}, [availableTechnicians]);

	const handleProductChange = (e) => {
		const productId = e.target.value;
		const product = availableProducts.find((p) => p.id === parseInt(productId, 10));
		setSelectedCategory(product?.category || selectedCategory);
		setFormData((prev) => ({ ...prev, productId }));
		if (product) {
			setFormData((prev) => ({
				...prev,
				brand: product.brand,
				model: product.model || '',
				estimatedTime: estimatedServiceTimes[product.category] || ''
			}));
		}
	};

	const handleCategoryChange = (category) => {
		setSelectedCategory(category);
		setFormData((prev) => ({
			...prev,
			productId: '',
			brand: '',
			model: '',
			estimatedTime: estimatedServiceTimes[category] || ''
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.customerName || !formData.mobile || !selectedProduct || !formData.problemType) {
			popup.showError('Please fill all required fields');
			return;
		}
		const newJobData = {
			...formData,
			productCategory: selectedProduct.category,
			productBrand: selectedProduct.brand,
		};
		try {
			setSubmitting(true);
			await addJob(newJobData);
			onSuccess();
		} catch (err) {
			popup.showError(err?.message || 'Failed to create job. Please check your inputs.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="new-job">
			<div className="new-job-header">
				<div className="header-titles">
					<h1>📋 Create New Service Request</h1>
					<p>Quickly add a new service job to your system</p>
				</div>
				<button type="button" className="nj-btn-close" onClick={onBack}>✕</button>
			</div>

			<form onSubmit={handleSubmit} className="new-job-layout">
				{/* Left Column */}
				<div className="job-column left-column">
					{/* Section A: Customer Details */}
					<div className="nj-form-card">
						<div className="nj-card-header">
							<h2>👤 Customer Details</h2>
						</div>

						<div className="card-content">
							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Customer Name *</label>
									<input
										type="text"
										name="customerName"
										value={formData.customerName}
										onChange={handleInputChange}
										placeholder="Enter customer name"
										required
									/>
								</div>
								<div className="nj-form-row">
									<label>Mobile *</label>
									<input
										type="tel"
										maxLength="10"
										name="mobile"
										value={formData.mobile}
										onChange={handleInputChange}
										placeholder="10 digit mobile"
										required
									/>
								</div>
							</div>

							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Alternate Mobile</label>
									<input
										type="tel"
										maxLength="10"
										name="altMobile"
										value={formData.altMobile}
										onChange={handleInputChange}
										placeholder="Alternate mobile"
									/>
								</div>
								<div className="nj-form-row">
									<label>Email</label>
									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										placeholder="customer@example.com"
									/>
								</div>
							</div>

							<div className="nj-form-row">
								<label>Address Line 1 *</label>
								<input
									type="text"
									name="address1"
									value={formData.address1}
									onChange={handleInputChange}
									placeholder="Street address"
									required
								/>
							</div>

							<div className="nj-form-row">
								<label>Address Line 2</label>
								<input
									type="text"
									name="address2"
									value={formData.address2}
									onChange={handleInputChange}
									placeholder="Apartment, suite, etc."
								/>
							</div>

							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>City *</label>
									<input
										type="text"
										name="city"
										value={formData.city}
										onChange={handleInputChange}
										placeholder="City"
										required
									/>
								</div>
								<div className="nj-form-row">
									<label>Pincode *</label>
									<input
										type="text"
										name="pincode"
										value={formData.pincode}
										onChange={handleInputChange}
										placeholder="Pincode"
										required
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Section B: Product Details */}
					<div className="nj-form-card">
						<div className="nj-card-header">
							<h2>📦 Product Details</h2>
						</div>

						<div className="card-content">
							<div className="category-selector">
								<label>Quick Select Category:</label>
								<div className="category-buttons">
									{availableCategories.map(
										(cat) => (
											<button
												key={cat}
												type="button"
												className={`category-btn ${selectedCategory === cat ? 'active' : ''
													}`}
												onClick={() => handleCategoryChange(cat)}
											>
												{cat}
											</button>
										)
									)}
								</div>
							</div>

							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Product *</label>
									<select
										name="productId"
										value={formData.productId}
										onChange={handleProductChange}
										required
									>
										<option value="">-- Select Product --</option>
										{availableProducts
											.filter((p) => (selectedCategory ? p.category === selectedCategory : true))
											.map((p) => (
												<option key={p.id} value={p.id}>
													{p.brand ? `${p.brand} - ` : ''}{p.name || p.model || p.category}
												</option>
											))}
									</select>
									{loadingProducts && (
										<div className="nj-help-text">Loading products...</div>
									)}
									{productsLoadError && (
										<div className="nj-help-text">{productsLoadError}</div>
									)}
								</div>
							</div>

							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Model *</label>
									<input
										type="text"
										name="model"
										value={formData.model}
										onChange={handleInputChange}
										placeholder="Enter model number"
										required
									/>
								</div>

								<div className="nj-form-row">
									<label>Serial Number</label>
									<input
										type="text"
										name="serial"
										value={formData.serial}
										onChange={handleInputChange}
										placeholder="Serial number"
									/>
								</div>
							</div>

							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Purchase Date *</label>
									<input
										type="date"
										name="purchaseDate"
										value={formData.purchaseDate}
										onChange={handleInputChange}
										required
									/>
								</div>

								<div className="nj-form-row">
									<label>Warranty Status</label>
									<select
										name="warrantyStatus"
										value={formData.warrantyStatus}
										onChange={handleInputChange}
									>
										<option value="yes">In Warranty</option>
										<option value="no">Out of Warranty</option>
										<option value="expired">Warranty Expired</option>
									</select>
								</div>
							</div>

							{formData.warrantyStatus !== 'no' && (
								<div className="nj-form-row warranty-claim">
									<label className="checkbox-label">
										<input
											type="checkbox"
											name="warrantyClaimRequest"
											checked={formData.warrantyClaimRequest}
											onChange={handleInputChange}
										/>
										Request Warranty Claim
									</label>
								</div>
							)}

							{selectedProduct && (
								<div className="nj-form-row">
									<label>Estimated Service Time</label>
									<input
										type="text"
										name="estimatedTime"
										value={formData.estimatedTime}
										onChange={handleInputChange}
										placeholder="e.g. 2-3 hours"
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Right Column */}
				<div className="job-column right-column">
					{/* Section C: Problem & Service Info */}
					<div className="nj-form-card">
						<div className="nj-card-header">
							<h2>⚠️ Problem & Service Info</h2>
						</div>

						<div className="card-content">
							<div className="nj-form-row">
								<label>Problem Type *</label>
								<input
									type="text"
									name="problemType"
									value={formData.problemType}
									onChange={handleInputChange}
									placeholder="e.g., Not cooling, Water leak, Noise, etc."
									required
								/>
							</div>

							<div className="nj-form-row">
								<label>Problem Description *</label>
								<textarea
									name="problemDescription"
									value={formData.problemDescription}
									onChange={handleInputChange}
									rows="3"
									placeholder="Describe the issue in detail..."
									required
								></textarea>
							</div>

							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Service Type *</label>
									<select
										name="serviceType"
										value={formData.serviceType}
										onChange={handleInputChange}
										required
									>
										<option value="Onsite">Onsite</option>
										<option value="In-Store">In-Store</option>
										<option value="Remote">Remote Assistance</option>
									</select>
								</div>

								<div className="nj-form-row">
									<label>Priority</label>
									<select name="priority" value={formData.priority} onChange={handleInputChange}>
										<option value="Low">Low</option>
										<option value="Medium">Medium</option>
										<option value="High">High</option>
										<option value="Urgent">Urgent</option>
									</select>
								</div>
							</div>

							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Preferred Visit Date</label>
									<input
										type="date"
										name="visitDate"
										value={formData.visitDate}
										onChange={handleInputChange}
									/>
								</div>

								<div className="nj-form-row">
									<label>Visit Time Slot</label>
									<input
										type="time"
										name="visitTime"
										value={formData.visitTime}
										onChange={handleInputChange}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Section D: Assignment & Cost */}
					<div className="nj-form-card">
						<div className="nj-card-header">
							<h2>💰 Assignment & Cost</h2>
						</div>

						<div className="card-content">
							<div className="nj-form-row-pair">
								<div className="nj-form-row">
									<label>Assign Technician</label>
									<select
										name="technician"
										value={formData.technician}
										onChange={handleInputChange}
									>
										<option value="">Unassigned</option>
										{technicianOptions.map((techName) => (
											<option key={techName} value={techName}>
												{techName}
											</option>
										))}
									</select>
								</div>

								<div className="nj-form-row">
									<label>Estimated Charge (₹)</label>
									<input
										type="number"
										name="estimatedCharge"
										value={formData.estimatedCharge}
										onChange={handleInputChange}
										placeholder="0"
									/>
								</div>
							</div>

							<div className="nj-form-row">
								<label>Advance Collected (₹)</label>
								<input
									type="number"
									name="advanceCollected"
									value={formData.advanceCollected}
									onChange={handleInputChange}
									placeholder="0"
								/>
							</div>
						</div>
					</div>

					{/* Form Actions */}
					<div className="form-actions sticky-actions">
						<button type="button" className="btn-secondary" onClick={onBack}>
							Cancel
						</button>
						<button type="submit" className="btn-secondary" disabled={submitting}>
							Save Draft
						</button>
						<button type="submit" className="btn-primary" disabled={submitting}>
							{submitting ? 'Creating...' : 'Create Job'}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
