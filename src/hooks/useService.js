import { useContext } from 'react';
import { ServiceContext } from '../context/ServiceContext';

export function useService() {
	const context = useContext(ServiceContext);
	if (!context) {
		throw new Error('useService must be used within ServiceProvider');
	}
	return context;
}
