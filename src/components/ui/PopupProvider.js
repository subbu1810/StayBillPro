import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import '../../styles/Popup.css';

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
	const [toasts, setToasts] = useState([]);
	const [confirmState, setConfirmState] = useState({
		open: false,
		title: '',
		message: '',
		confirmText: 'OK',
		cancelText: 'Cancel',
		resolve: null,
	});
	const idRef = useRef(0);

	const removeToast = useCallback((id) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const pushToast = useCallback(
		(type, message, title = '') => {
			const id = ++idRef.current;
			setToasts((prev) => [...prev, { id, type, title, message }]);
			setTimeout(() => removeToast(id), 3200);
		},
		[removeToast]
	);

	const showInfo = useCallback((message, title = 'Info') => pushToast('info', message, title), [pushToast]);
	const showSuccess = useCallback((message, title = 'Success') => pushToast('success', message, title), [pushToast]);
	const showError = useCallback((message, title = 'Error') => pushToast('error', message, title), [pushToast]);

	const confirm = useCallback((options) => {
		const config = typeof options === 'string' ? { message: options } : options || {};
		return new Promise((resolve) => {
			setConfirmState({
				open: true,
				title: config.title || 'Please Confirm',
				message: config.message || '',
				confirmText: config.confirmText || 'Confirm',
				cancelText: config.cancelText || 'Cancel',
				resolve,
			});
		});
	}, []);

	const closeConfirm = useCallback(
		(result) => {
			if (confirmState.resolve) {
				confirmState.resolve(result);
			}
			setConfirmState({
				open: false,
				title: '',
				message: '',
				confirmText: 'OK',
				cancelText: 'Cancel',
				resolve: null,
			});
		},
		[confirmState]
	);

	const value = useMemo(
		() => ({ showInfo, showSuccess, showError, confirm }),
		[confirm, showError, showInfo, showSuccess]
	);

	return (
		<PopupContext.Provider value={value}>
			{children}

			<div className="popup-toast-container">
				{toasts.map((toast) => (
					<div key={toast.id} className={`popup-toast popup-${toast.type}`}>
						<div className="popup-toast-head">
							<strong>{toast.title}</strong>
							<button
								type="button"
								className="popup-close-btn"
								onClick={() => removeToast(toast.id)}
								aria-label="Close"
							>
								x
							</button>
						</div>
						<div className="popup-toast-message">{toast.message}</div>
					</div>
				))}
			</div>

			{confirmState.open && (
				<div className="popup-modal-overlay">
					<div className="popup-modal" role="dialog" aria-modal="true" aria-label={confirmState.title}>
						<h3>{confirmState.title}</h3>
						<p>{confirmState.message}</p>
						<div className="popup-modal-actions">
							<button type="button" className="popup-btn ghost" onClick={() => closeConfirm(false)}>
								{confirmState.cancelText}
							</button>
							<button type="button" className="popup-btn solid" onClick={() => closeConfirm(true)}>
								{confirmState.confirmText}
							</button>
						</div>
					</div>
				</div>
			)}
		</PopupContext.Provider>
	);
}

export function usePopup() {
	const context = useContext(PopupContext);
	if (!context) {
		throw new Error('usePopup must be used within PopupProvider');
	}
	return context;
}

