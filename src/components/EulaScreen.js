import React, { useState } from 'react';
import '../styles/EulaScreen.css';

function EulaScreen({ onAccept, onDecline }) {
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

    const handleScroll = (e) => {
        const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 10;
        if (bottom) {
            setScrolledToBottom(true);
        }
    };

    const handleDeclineClick = () => {
        setShowDeclineConfirm(true);
    };

    const handleCancelDecline = () => {
        setShowDeclineConfirm(false);
    };

    return (
        <div className="eula-container">
            <div className="eula-modal">
                <div className="eula-header">
                    <h2>End User License Agreement (EULA)</h2>
                    <p>Please read and accept the agreement to continue using StayBillPro.</p>
                </div>

                <div className="eula-content" onScroll={handleScroll}>
                    <p>
                        use of the StayBillPro software, including all updates, upgrades, and modifications thereto ("SOFTWARE"), being an Inventory & Accounting software developed by S Square G Tech Solutions ("LICENSOR"). The Software is offered by the Licensor for a term of 1 (one) license to the end-user ("CUSTOMER") on the following terms and conditions, which the Customer shall be deemed to accept in full upon clicking ‘I accept’ and/or installing the Software.
                    </p>

                    <ol>
                        <li><strong>Ownership of intellectual property:</strong> The Licensor is the sole owner of all rights, title and interest in any and all copyrights, trademark rights, patent rights and all other intellectual property rights in the Software, any application programming interfaces, improvements, design contributions or derivative works thereto. Except for the limited license for the Software expressly granted under this EULA, no proprietary right or interest is transferred to the Customer in relation to the Software.</li>

                        <li><strong>Grant of license:</strong> Pursuant to your acceptance of this EULA and compliance with the terms of this EULA, the Licensor grants to the Customer, a license to use the SOFTWARE on a limited, revocable, non-exclusive, non-transferable, non-assignable and non-sub licensable basis, for the purpose set out under this EULA and upon the terms and conditions as hereinafter contained. The Licensor may change or modify the Software or this EULA at any time and in its sole discretion. The Software is not for resale and is subject to the restrictions on use as set out under Clause 4 below.</li>

                        <li><strong>Term and Termination:</strong>
                            <ol type="a">
                                <li>The Software is licensed for a period of 1 (one) year from the date of grant of the license under this EULA (“Term”). Upon the expiry of the Term, the license required to be renewed by the Customer subject to the payment of the applicable license renewal fees as may be determined by the Licensor. Any new versions / upgrades of the Software shall only be available to the Customer upon payment of the license renewal fees on or prior to the due date for such payment.</li>
                                <li>This EULA shall be valid from the date of acceptance of the EULA by the Customer and shall automatically terminate upon the expiry of the Term.</li>
                                <li>The Licensor may terminate this EULA at any time, for any reason, or for no reason, without notice to the Customer. In addition, this EULA shall terminate immediately in the event the Customer breaches the terms and conditions under this EULA. Upon termination, the Customer shall immediately discontinue access to and use of the Software.</li>
                            </ol>
                        </li>

                        <li><strong>Restrictions on use:</strong>
                            <ol type="a">
                                <li>The Customer shall not copy, translate, decompile, disassemble, reverse engineer, create derivative works or otherwise modify the Software or any parts of the Software in any manner whatsoever. The Customer agrees that it shall not use the Software for any other purpose apart from the accounting and inventory solutions provided by the Software or for any other commercial purpose. The Software is intended for the use by the Customer for commercial purposes only.</li>
                                <li>The Customer shall not sub-license, license, sell, lease, rent or otherwise make the Software available to any third party.</li>
                                <li>The Customer shall not access the Software for the purpose of building a competitive product or service or copying its features or user interface, analysing the Software for any competitive or review purposes, or permit access to the Software by a direct competitor of the Licensor.</li>
                                <li>The Customer shall not install, access, use or attempt to install, access or use the Software through any other service provider except through a distributor / partner duly authorised by the Licensor.</li>
                                <li>The Customer shall take all reasonable precautions and measures to protect the Software and related items from any unauthorized use, access, modifications, distribution or publication.</li>
                                <li>The Licensor shall have the right to block or restrict the Customer from accessing the Software in case of: (i) breach of the terms of use as set out in this EULA, or (ii) breach of applicable law by the Customer in relation to the use of the Software.</li>
                            </ol>
                        </li>

                        <li><strong>Third Party Components:</strong> The Software may contain links to external websites or (including embedded widgets or other means of access) and/or information provided on such external websites by third parties. The Customer’s access and use of such external websites shall be subject to the terms and conditions of such external websites. The Licensor shall not be responsible in any manner for the content of any external website. All third-party components provided in relation to the Software are provided on an “as is” basis and the Licensor shall have no liability for any claims arising therefrom.</li>

                        <li><strong>Customer Representations and Warranties:</strong> The Customer hereby represents and warrants to the Licensor as follows:
                            <ol type="a">
                                <li>The Customer is fully satisfied with the working of the Software and the demonstration conducted by the distributor / partner authorised by the Licensor before the acceptance of this EULA.</li>
                                <li>The Customer is solely responsible for determining the suitability of the Software for the commercial purpose it is intended to be used.</li>
                            </ol>
                        </li>

                        <li><strong>Data Protection:</strong>
                            <ol type="a">
                                <li>The Customer shall comply with all applicable data privacy and cyber security laws in relation to the processing, use, and disclosure of personal data in connection with this EULA. For the purposes of this EULA, personal data means any information relating to an identified or identifiable natural person (including materially equivalent terms such as “personally identifiable information,” “sensitive personal data,” or “sensitive personal information” under applicable laws, including the Information Technology Act, 2000 read with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011) (“Personal Data”).</li>
                                <li>By accepting this EULA, the Customer provides its express consent to the collection, use, and processing of its information (including any Personal Data) by the Licensor for the purposes of providing the licence to use the Software under this EULA. The Customer acknowledges that the Licensor may store, access, and use all user-related data associated with the Customer, to the extent necessary to provide services through the Software or to support enhancements and improvements to the Software.</li>
                                <li>The Customer agrees that, to the extent any Personal Data relating to a third party is input into the Software or otherwise shared with the Licensor, the Customer shall obtain all necessary consents and comply with applicable data protection laws (including the Information Technology Act 2000 read with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011)), as required for: (i) the transfer of Personal Data to the Licensor; and (ii) use of such Personal Data by the Licensor in relation to the Software.</li>
                            </ol>
                        </li>

                        <li><strong>Single use:</strong> The license granted to the Customer under this EULA is a single-use license which is valid for the installation of the Software on a single computer / single system only. In case the Customer requires the Software to be installed on more than 1 (one) system, the Customer shall be required to purchase a separate license for the installation of such software at full cost.</li>

                        <li><strong>License fees:</strong> The amount payable by the Customer for the License of the Software is inclusive of installation charges, but exclusive of any: (i) goods and services tax, and (ii) charges payable for any additional training and support services required to be provided by the Licensor and/or its authorised distributors or partners, which shall be chargeable on an hourly per visit basis.</li>

                        <li><strong>Disclaimer:</strong>
                            <ol type="a">
                                <li>The Licensor shall take no responsibility for any kind of corruption of data on the Customer’s system due to any media failure / power failure / hardware problem / virus infection of any kind or any other reason, provided that the Licensor agrees to attempt to (but in no manner guarantees) recover the data either fully or partially, which shall be chargeable at an amount as may be decided by the Licensor.</li>
                                <li>The Licensor licenses the Software on an "as is" and “with all faults” basis, and the Licensor does not represent or warrant that operations of the Software or the network and third-party services to which the Software are connected will be error free or uninterrupted or that programming errors in the Software can be found in order to be corrected.</li>
                                <li>The Licensor expressly disclaims any warranty of non-infringement and/or any implied warranties of suitability, applicability, merchantability and fitness of the Software for a particular purpose.</li>
                            </ol>
                        </li>

                        <li><strong>Indemnity and Limitation of Liability:</strong>
                            <ol type="a">
                                <li>The Customer shall indemnify and hold harmless the Licensor, its officers, directors, employees and its affiliates against all losses, damages and claims (including third party claims, court costs and reasonable attorney’s fees), suffered by the Licensor arising out of or related to: (a) any use of the Software by the Customer which is in violation of this EULA or any applicable law or in infringement of the rights of a third party; or (b) the collection and storage of third-party user data which is in breach of this EULA or violation of applicable law. The foregoing shall apply regardless of whether such loss or damage is caused by the conduct of the Customer or by the conduct of a third-party using the Customer’s access credentials for the Software.</li>
                                <li>It is expressly agreed by the Customer that the Licensor shall in no circumstances be liable for any loss or damage, whether direct, indirect, special, consequential and/ or incidental, arising from the use or application of Software and related items, for an amount of damages in excess of the license fees paid by the Customer for the Software.</li>
                            </ol>
                        </li>

                        <li><strong>Disputes:</strong> The Licensor and the Customer hereby agree that the courts at Sindhanur, Raichur(dt), Karnataka have exclusive jurisdiction to entertain any proceedings in respect of any matters arising out of or pursuant to this EULA.</li>

                        <li><strong>Advertisement:</strong> The Licensor reserves the right to advertise or display additional information in relation to any other software products (whether such software products are developed by the Licensor or otherwise) on the Software platform accessible to the Customer.</li>

                        <li>The Customer is expressly prohibited from appointing or engaging any distributors and/or partners of the Licensor (including any ex-distributors and/or partners) without the prior written consent of the Licensor.</li>
                    </ol>
                </div>

                <div className="eula-actions">
                    <button className="btn-decline" onClick={handleDeclineClick}>Decline</button>
                    <button
                        className={`btn-accept ${scrolledToBottom ? 'active' : ''}`}
                        onClick={onAccept}
                        disabled={!scrolledToBottom}
                        title={!scrolledToBottom ? "Please scroll to the bottom to accept" : ""}
                    >
                        I Accept
                    </button>
                </div>
            </div>

            {/* Custom Decline Confirmation Modal */}
            {showDeclineConfirm && (
                <div className="eula-confirm-overlay">
                    <div className="eula-confirm-modal">
                        <h3>Are you sure you want to decline?</h3>
                        <p>You must accept the End User License Agreement to use StayBillPro.</p>
                        <p>Declining will log you out of your account.</p>
                        <div className="eula-confirm-actions">
                            <button className="btn-confirm-cancel" onClick={handleCancelDecline}>Go Back</button>
                            <button className="btn-confirm-logout" onClick={onDecline}>Yes, Log Out</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EulaScreen;
