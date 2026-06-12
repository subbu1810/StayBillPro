import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/apiConfig';
import { usePopup } from './ui/PopupProvider';
import { backupAPI } from '../services/api';

const BackupReminderModal = () => {
    const [showModal, setShowModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const popup = usePopup();

    useEffect(() => {
        const checkBackupStatus = async () => {
            try {
                const response = await backupAPI.getStatus();
                const lastBackupDateStr = response.last_backup_date;
                
                if (!lastBackupDateStr) {
                    // If never backed up, trigger modal immediately
                    setShowModal(true);
                    return;
                }

                const lastBackupDate = new Date(lastBackupDateStr);
                const now = new Date();
                const diffTime = Math.abs(now - lastBackupDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 7) {
                    setShowModal(true);
                } else {
                    setShowModal(false);
                }
            } catch (error) {
                console.error("Failed to check backup status from server", error);
            }
        };

        checkBackupStatus();
        
        // Check once a day if app is left open
        const interval = setInterval(checkBackupStatus, 24 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            const response = await fetch(`${API_CONFIG.BASE_URL}/backup/download`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/';
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to download backup");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `StayBillPro_Backup_${new Date().toISOString().split('T')[0]}.sql`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Removing local storage fallback since server tracks it
            localStorage.removeItem('last_backup_date');
            setShowModal(false);
            if(popup) popup.showSuccess("Database backup successful!");
        } catch (error) {
            console.error(error);
            if(popup) popup.showError("Failed to generate backup. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (!showModal) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h2 style={{ color: '#e74c3c', marginTop: 0 }}>Weekly Backup Required</h2>
                <p style={{ color: '#34495e', fontSize: '15px', lineHeight: '1.5' }}>
                    To ensure your data is always safe, StayBillPro requires you to download a backup of your database every week.
                </p>
                <p style={{ color: '#34495e', fontSize: '15px', lineHeight: '1.5', fontWeight: 'bold' }}>
                    You cannot continue using the application until the backup is downloaded.
                </p>
                
                <div style={{ marginTop: '25px', textAlign: 'center' }}>
                    <button 
                        onClick={handleDownload} 
                        disabled={downloading}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            opacity: downloading ? 0.7 : 1,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        {downloading ? 'Generating Backup...' : '📥 Download Database Backup'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // Ensure it's on top of everything
    backdropFilter: 'blur(5px)'
};

const modalStyle = {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    textAlign: 'center'
};

export default BackupReminderModal;
