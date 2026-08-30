import React, { createContext, useState, useCallback, useEffect } from 'react';
import { appliancesAPI, jobsAPI, serviceRequestsAPI, techniciansAPI, customersAPI, sparesAPI, billingAPI } from '../services/api';

export const ServiceContext = createContext();

export function ServiceProvider({ children, isAuthenticated }) {
	const [jobs, setJobs] = useState([]);
	const [jobsLoaded, setJobsLoaded] = useState(false);

	const [customers, setCustomers] = useState([]);

	const [technicians, setTechnicians] = useState([]);

	const [availableProducts, setAvailableProducts] = useState([]);
	const [allSpares, setAllSpares] = useState([]);
	const [lowStockSpares, setLowStockSpares] = useState([]);
	const [todaySummary, setTodaySummary] = useState({ total_invoices: 0, total_sales: 0 });
	const [invoiceSalesReport, setInvoiceSalesReport] = useState([]);
	const [selectedBranchId, setSelectedBranchId] = useState(null);

	const mapJobFromApi = useCallback((job) => {
		const sr = job?.service_request || job?.serviceRequest;
		const appliance = sr?.appliance;
		const createdAt = job?.created_at || job?.createdAt;
		const scheduledDate = job?.scheduled_date || job?.scheduledDate;
		const statusRaw = (job?.status || '').toString();
		const statusMap = {
			pending: 'New',
			scheduled: 'New',
			in_progress: 'In Progress',
			completed: 'Completed',
			cancelled: 'Cancelled',
			on_hold: 'On Hold',
		};
		const displayStatus = statusMap[statusRaw] || statusRaw || 'New';

		const customerName = appliance?.customer_name || '';
		const customerMobile = appliance?.phone || '';
		const productName = [appliance?.brand, appliance?.name || appliance?.appliance_type || appliance?.model].filter(Boolean).join(' - ');
		const technicianName = job?.technician?.name || sr?.technician_name || 'Unassigned';
		return {
			id: job?.id,
			ticketNo: job?.job_number || job?.jobNumber || '',
			createdDate: createdAt ? String(createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
			customer: customerName,
			customerMobile,
			product: productName,
			problem: sr?.issue_description || '',
			status: displayStatus,
			technician: technicianName,
			dueDate: scheduledDate ? String(scheduledDate).slice(0, 10) : '',
		};
	}, []);

	useEffect(() => {
		if (!isAuthenticated) return;
        
		let cancelled = false;
		
		const fetchData = async () => {
			try {
				const params = selectedBranchId ? { branch_id: selectedBranchId } : {};

				const getLocalDate = (d) => {
					return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
				};

				// Compute 7-day date range for sales report
				const now = new Date();
				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(now.getDate() - 6);
				const startDate = getLocalDate(sevenDaysAgo);
				const endDate = getLocalDate(now);

				const [apiJobs, apiTechnicians, apiAppliances, apiCustomers, apiLowStock, apiAllSpares, apiDailySummary, apiSalesReport] = await Promise.all([
					jobsAPI.getAll(params).catch(() => []),
					techniciansAPI.getAll(params).catch(() => []),
					appliancesAPI.getAll(params).catch(() => []),
					customersAPI.getAll(params).catch(() => []),
					sparesAPI.getLowStock(params).catch(() => []),
					sparesAPI.getAll(params).catch(() => []),
					billingAPI.getDailySummary(endDate).catch(() => null),
					billingAPI.getSalesReport(startDate, endDate).catch(() => []),
				]);
				if (cancelled) return;
				if (Array.isArray(apiJobs)) {
					setJobs(apiJobs.map(mapJobFromApi));
				}
				if (Array.isArray(apiTechnicians)) {
					setTechnicians(
						apiTechnicians.map((t) => ({
							id: t.id,
							name: t.name || '',
							mobile: t.phone || '',
							skills: (t.specialization || '')
								.split(',')
								.map((s) => s.trim())
								.filter(Boolean),
							activeJobs: 0,
							status: t.status === 'inactive' ? 'Busy' : t.status === 'on_leave' ? 'On leave' : 'Available',
						}))
					);
				}
				if (Array.isArray(apiAppliances)) {
					setAvailableProducts(
						apiAppliances.map((a) => ({
							id: a.id,
							category: a.category || a.appliance_type || '',
							brand: a.brand || '',
							model: a.model || '',
							name: a.name || a.appliance_type || '',
						}))
					);
				}
				if (Array.isArray(apiCustomers)) {
					setCustomers(
						apiCustomers.map((c) => ({
							id: c.id,
							name: c.name || c.customer_name || '',
							mobile: c.phone || '',
							area: [c.city, c.state].filter(Boolean).join(', ') || c.address || '',
							totalJobs: c.total_jobs || 0,
							lastService: c.last_service_date ? String(c.last_service_date).slice(0, 10) : '',
						}))
					);
				}
				if (Array.isArray(apiLowStock)) {
					setLowStockSpares(apiLowStock);
				}
				if (Array.isArray(apiAllSpares)) {
					setAllSpares(apiAllSpares);
				}
				if (apiDailySummary && typeof apiDailySummary === 'object') {
					// getDailySummary returns { date, summary: { total_invoices, total_sales, ... } }
					const s = apiDailySummary.summary || apiDailySummary;
					setTodaySummary(s);
				}
				if (Array.isArray(apiSalesReport)) {
					setInvoiceSalesReport(apiSalesReport);
				}
			} catch (e) {
				if (cancelled) return;
				console.error("Error fetching realtime data:", e);
			} finally {
				if (!cancelled) setJobsLoaded(true);
			}
		};

		// Initial fetch
		fetchData();

		// Set up polling for realtime updates
		const intervalId = setInterval(fetchData, 300000); // Poll every 5 minutes (300000ms)

		return () => {
			cancelled = true;
			clearInterval(intervalId);
		};
	}, [mapJobFromApi, selectedBranchId, isAuthenticated]);

	const addJob = useCallback(async (jobData) => {
		const now = new Date();
		// Generate sequential ticket number: SRV01, SRV02, ...
		const existingJobs = jobs || [];
		let maxSrv = 0;
		existingJobs.forEach(j => {
			const m = (j.ticketNo || j.job_number || '').match(/^SRV(\d+)$/i);
			if (m) maxSrv = Math.max(maxSrv, parseInt(m[1], 10));
		});
		const jobNumber = `SRV${String(maxSrv + 1).padStart(2, '0')}`;

		const visitDateTime = jobData?.visitDate
			? new Date(`${jobData.visitDate}T${jobData.visitTime || '00:00'}:00`)
			: now;
		const scheduledDateIso = visitDateTime.toISOString();
		const priorityMap = {
			Low: 'low',
			Medium: 'medium',
			High: 'high',
			Urgent: 'urgent',
		};
		const serviceTypeMap = {
			Onsite: 'repair',
			'In-Store': 'repair',
			'Remote Assistance': 'other',
			Repair: 'repair',
			Maintenance: 'maintenance',
			Inspection: 'inspection',
			Other: 'other',
		};

		// Fetch or create customer
		let customerId = null;
		try {
			// First search for customer by mobile
			const customersResp = await customersAPI.getAll({ branch_id: selectedBranchId });
			let customer = (customersResp || []).find(c => c.mobile === jobData.mobile);
			
			if (!customer) {
				// Create new customer
				const newCustomer = await customersAPI.create({
					name: jobData.customerName,
					mobile: jobData.mobile,
					email: jobData.email || '',
					billingAddress: [jobData.address1, jobData.address2, jobData.city, jobData.pincode].filter(Boolean).join(', ') || null,
					branch_id: selectedBranchId
				});
				customerId = newCustomer.id || newCustomer.insertId || null;
			} else {
				customerId = customer.id;
			}
		} catch (e) {
			console.error("Failed to associate customer", e);
		}

		const serviceRequestPayload = {
			customer_id: customerId,
			appliance_id: Number(jobData.productId),
			issue_description: jobData.problemDescription || jobData.problemType || '',
			service_date: scheduledDateIso,
			service_type: serviceTypeMap[jobData.serviceType] || 'repair',
			status: 'pending',
			technician_name: jobData.technician || null,
			cost: jobData.estimatedCharge ? Number(jobData.estimatedCharge) : null,
			notes: jobData.notes || null,
			branch_id: selectedBranchId
		};
		const createdServiceRequest = await serviceRequestsAPI.create(serviceRequestPayload);

		const jobPayload = {
			job_number: jobNumber,
			service_request_id: createdServiceRequest?.id,
			technician_id: null,
			user_id: null,
			scheduled_date: scheduledDateIso,
			start_time: null,
			end_time: null,
			status: 'pending',
			priority: priorityMap[jobData.priority] || 'medium',
			job_description: jobData.problemDescription || null,
			work_done: null,
			labor_cost: null,
			parts_cost: null,
			total_cost: null,
			location: [jobData.address1, jobData.address2, jobData.city, jobData.pincode].filter(Boolean).join(', ') || null,
			notes: jobData.notes || null,
			completion_signature: null,
			branch_id: selectedBranchId
		};
		const createdJob = await jobsAPI.create(jobPayload);
		let mapped = mapJobFromApi(createdJob);
		try {
			const freshJob = await jobsAPI.get(createdJob?.id);
			mapped = mapJobFromApi(freshJob);
		} catch (e) {
			// Keep optimistic mapping if fresh fetch fails.
		}
		setJobs((prev) => [mapped, ...prev]);
		return createdJob;
	}, [mapJobFromApi, selectedBranchId]);

	const updateJob = useCallback(async (jobId, updates) => {
		// First get the current job to find related IDs
		const currentJob = await jobsAPI.get(jobId);
		const srId = currentJob.service_req_id || currentJob.service_request?.id;
		const applianceId = currentJob.service_request?.appliance?.id;

		// 1. Update Job
		const jobUpdates = {
			status: updates.status,
			priority: updates.priority,
			scheduled_date: updates.scheduled_date,
			job_description: updates.job_description,
			labor_cost: updates.labor_cost,
			parts_cost: updates.parts_cost,
			total_cost: updates.total_cost,
			location: updates.address,
		};
		await jobsAPI.update(jobId, jobUpdates);

		// 2. Update Service Request if fields provided
		if (srId) {
			const srUpdates = {};
			if (updates.serviceCharge !== undefined) srUpdates.cost = Number(updates.serviceCharge);
			if (updates.problem !== undefined) srUpdates.issue_description = updates.problem;
			if (updates.serviceType !== undefined) srUpdates.service_type = updates.serviceType;
			if (Object.keys(srUpdates).length > 0) {
				await serviceRequestsAPI.update(srId, srUpdates);
			}
		}

		const customerId = currentJob.service_request?.appliance?.customer_id;

		// 3. Update Appliance if fields provided
		if (applianceId) {
			const applianceUpdates = {};
			if (updates.model) applianceUpdates.model = updates.model;
			if (updates.serial) applianceUpdates.serial_number = updates.serial;
			if (updates.warranty) applianceUpdates.warranty_status = updates.warranty;
			if (Object.keys(applianceUpdates).length > 0) {
				await appliancesAPI.update(applianceId, applianceUpdates);
			}
		}
        
		// 4. Update Customer if fields provided
		if (customerId) {
			const customerUpdates = {};
			if (updates.customerName) customerUpdates.name = updates.customerName;
			if (updates.customerMobile) customerUpdates.mobile = updates.customerMobile;
			// We handle address update on the job location (in 1. Update Job), but we can also update customer billingAddress
			if (updates.address) customerUpdates.billingAddress = updates.address;
			if (Object.keys(customerUpdates).length > 0) {
				await customersAPI.update(customerId, customerUpdates);
			}
		}

		// Re-fetch the job to get fully updated state
		const finalJob = await jobsAPI.get(jobId);
		const mapped = mapJobFromApi(finalJob);
		setJobs((prev) => prev.map((j) => (j.id === mapped.id ? mapped : j)));
		return mapped;
	}, [mapJobFromApi]);

	const deleteJob = useCallback(async (jobId) => {
		await jobsAPI.delete(jobId);
		setJobs((prev) => prev.filter((j) => j.id !== jobId));
	}, []);

	const addCustomer = useCallback((customerData) => {
		const newCustomer = {
			id: Date.now(),
			totalJobs: 0,
			...customerData,
		};
		setCustomers((prev) => [newCustomer, ...prev]);
		return newCustomer;
	}, []);

	const addTechnician = useCallback((techData) => {
		const newTech = {
			id: Date.now(),
			activeJobs: 0,
			...techData,
		};
		setTechnicians((prev) => [newTech, ...prev]);
		return newTech;
	}, []);

	return (
		<ServiceContext.Provider value={{ 
			jobs, jobsLoaded, customers, technicians, availableProducts, 
			allSpares, lowStockSpares, todaySummary, invoiceSalesReport, selectedBranchId, setSelectedBranchId,
			addJob, updateJob, deleteJob, addCustomer, addTechnician, jobsAPI 
		}}>
			{children}
		</ServiceContext.Provider>
	);
}
