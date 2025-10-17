const { useState, useEffect } = React;

// Storage helper
const storage = {
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    },
    set: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

const USERS_KEY = 'wm-users';
const getUsers = () => {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
};
const setUsers = (list) => localStorage.setItem(USERS_KEY, JSON.stringify(list));

// Main App Component
function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [reports, setReports] = useState([]);

    useEffect(() => {
        // Load reports from localStorage
        setReports(storage.get('waste-reports'));
    }, []);

    useEffect(() => {
        // Save reports to localStorage
        storage.set('waste-reports', reports);
    }, [reports]);

    useEffect(() => {
        // Sync with hash on load and changes
        const applyActive = (page) => {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('active', link.dataset.page === page);
            });
        };
        const setFromHash = () => {
            const hash = window.location.hash.replace('#', '') || 'home';
            setCurrentPage(hash);
            applyActive(hash);
        };
        setFromHash();
        const onHash = () => setFromHash();
        window.addEventListener('hashchange', onHash);

        // Handle navigation clicks
        const handleNavClick = (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const page = navLink.dataset.page;
                if (page) {
                    window.location.hash = page;
                }
            }
        };
        document.addEventListener('click', handleNavClick);

        return () => {
            window.removeEventListener('hashchange', onHash);
            document.removeEventListener('click', handleNavClick);
        };
    }, []);

    const addReport = (report) => {
        const newReport = {
            ...report,
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'submitted'
        };
        setReports(prev => [newReport, ...prev]);
    };

    const updateReportStatus = (id, newStatus) => {
        setReports(prev => prev.map(report => 
            report.id === id ? { ...report, status: newStatus, updatedAt: new Date().toISOString() } : report
        ));
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage reports={reports} />;
            case 'dashboard':
                return <UserDashboard reports={reports} />;
            case 'report':
                return <ReportPage onSubmit={addReport} />;
            case 'schedule':
                return <SchedulePage />;
            case 'admin':
                return <AdminDashboard reports={reports} onUpdateStatus={updateReportStatus} />;
            case 'about':
                return <AboutPage />;
            case 'signup':
                return <SignUpPage />;
            default:
                return <HomePage reports={reports} />;
        }
    };

    return (
        <div className="fade-in">
            {renderPage()}
        </div>
    );
}

// User Dashboard Component  
function UserDashboard({ reports }) {
    const myReports = reports.filter(report => report.status !== 'admin-only');
    const submittedReports = myReports.filter(r => r.status === 'submitted').length;
    const inProgressReports = myReports.filter(r => r.status === 'in-progress').length;
    const resolvedReports = myReports.filter(r => r.status === 'resolved').length;
    const totalReports = myReports.length;
    
    // Recent activity (last 5 activities)
    const recentActivity = myReports
        .sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date))
        .slice(0, 5);

    const getActivityIcon = (status) => {
        const icons = {
            'submitted': '📝',
            'in-progress': '⚙️',
            'resolved': '✅'
        };
        return icons[status] || '📝';
    };

    const getActivityMessage = (report) => {
        const messages = {
            'submitted': 'New report submitted',
            'in-progress': 'Report is being processed', 
            'resolved': 'Report has been resolved'
        };
        return messages[report.status] || 'Report updated';
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-title">My Dashboard</h1>
                <div className="quick-actions">
                    <button className="quick-action-btn" onClick={() => document.querySelector('[data-page="report"]').click()}>
                        🗑️ New Report
                    </button>
                    <button className="quick-action-btn" onClick={() => document.querySelector('[data-page="schedule"]').click()}>
                        📅 Schedule
                    </button>
                </div>
            </div>

            <div className="kpi-cards">
                <div className="kpi-card">
                    <div className="kpi-number">{submittedReports}</div>
                    <div className="kpi-title">Pending</div>
                    <div className="kpi-subtitle">Awaiting Review</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-number">{inProgressReports}</div>
                    <div className="kpi-title">In Progress</div>
                    <div className="kpi-subtitle">Being Addressed</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-number">{resolvedReports}</div>
                    <div className="kpi-title">Resolved</div>
                    <div className="kpi-subtitle">Completed</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-number">{totalReports}</div>
                    <div className="kpi-title">Total Reports</div>
                    <div className="kpi-subtitle">All Time</div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <h3>My Recent Reports</h3>
                    {myReports.length > 0 ? (
                        <div className="grid grid-2" style={{marginTop: '1rem'}}>
                            {myReports.slice(0, 4).map(report => (
                                <div key={report.id} style={{padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '8px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                                        <span className={`status-badge ${report.status}`}>
                                            {report.status}
                                        </span>
                                        <span style={{fontSize: '0.8rem', color: 'var(--gray-500)'}}>
                                            {formatTimeAgo(report.date)}
                                        </span>
                                    </div>
                                    <h4 style={{margin: '0 0 0.5rem', fontSize: '1rem'}}>{report.location}</h4>
                                    <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--gray-600)'}}>
                                        {report.description.substring(0, 80)}...
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{padding: '2rem', textAlign: 'center', color: 'var(--gray-500)'}}>
                            <p>No reports yet. Start by reporting a waste issue!</p>
                            <button className="btn btn-primary" onClick={() => document.querySelector('[data-page="report"]').click()}>
                                🗑️ Report Issue
                            </button>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3>Recent Activity</h3>
                    <div className="activity-timeline">
                        {recentActivity.length > 0 ? recentActivity.map(activity => (
                            <div key={activity.id} className="activity-item">
                                <div className={`activity-icon ${activity.status}`}>
                                    {getActivityIcon(activity.status)}
                                </div>
                                <div className="activity-content">
                                    <h4>{getActivityMessage(activity)}</h4>
                                    <p>{activity.location}</p>
                                    <div className="activity-time">
                                        {formatTimeAgo(activity.updatedAt || activity.date)}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={{padding: '2rem', textAlign: 'center', color: 'var(--gray-500)'}}>
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Home Page Component
function HomePage({ reports }) {
    const recentReports = reports.slice(0, 6);
    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

    return (
        <div>
            <div className="hero card">
                <h1>Keep Your Neighborhood Clean</h1>
                <p>Report waste issues, check collection schedules, and help build a cleaner, greener community.</p>
                <div className="hero-buttons">
                    <button className="btn btn-primary" onClick={() => document.querySelector('[data-page="report"]').click()}>
                        🗑️ Report an Issue
                    </button>
                    <button className="btn btn-secondary" onClick={() => document.querySelector('[data-page="schedule"]').click()}>
                        📅 View Schedule
                    </button>
                </div>
            </div>

            <div className="stats">
                <div className="card stat-card">
                    <div className="stat-number">{totalReports}</div>
                    <div className="stat-label">Total Reports</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-number">{resolutionRate}%</div>
                    <div className="stat-label">Resolution Rate</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-number">{reports.filter(r => r.status === 'in-progress').length}</div>
                    <div className="stat-label">In Progress</div>
                </div>
            </div>

            <div className="card">
                <h2 style={{marginBottom: '1.5rem'}}>Recent Reports</h2>
                {recentReports.length > 0 ? (
                    <div className="grid grid-3">
                        {recentReports.map(report => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center" style={{padding: '2rem', color: 'var(--gray-500)'}}>
                        <p>No reports yet. Be the first to report a waste issue!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Report Page Component
function ReportPage({ onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        location: '',
        wasteType: 'overflowing-garbage',
        description: '',
        photo: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    photo: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        onSubmit(formData);
        
        // Reset form
        setFormData({
            name: '',
            contact: '',
            location: '',
            wasteType: 'overflowing-garbage',
            description: '',
            photo: null
        });
        
        setIsSubmitting(false);
        alert('Report submitted successfully! Thank you for helping keep our community clean.');
    };

    return (
        <div className="card">
            <h2>Report a Waste Problem</h2>
            <p style={{marginBottom: '2rem', color: 'var(--gray-500)'}}>
                Help us maintain a clean environment by reporting waste issues in your area.
            </p>
            
            <form className="form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="name">Your Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="contact">Contact Information</label>
                        <input
                            type="text"
                            id="contact"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            placeholder="Phone number or email"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Street address or landmark"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="wasteType">Type of Waste Issue</label>
                    <select
                        id="wasteType"
                        name="wasteType"
                        value={formData.wasteType}
                        onChange={handleChange}
                        required
                    >
                        <option value="overflowing-garbage">🗑️ Overflowing Garbage Bin</option>
                        <option value="illegal-dumping">🚫 Illegal Dumping</option>
                        <option value="hazardous-waste">⚠️ Hazardous Waste</option>
                        <option value="recycling-issue">♻️ Recycling Problem</option>
                        <option value="other">❓ Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Please describe the waste issue in detail..."
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Upload Photo (Optional)</label>
                    <div className="file-input">
                        <input
                            type="file"
                            id="photo"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <div className="file-label">
                            <span>📷</span>
                            {formData.photo ? 'Photo Selected' : 'Choose Photo'}
                        </div>
                    </div>
                </div>

                {formData.photo && (
                    <div className="form-group">
                        <img src={formData.photo} alt="Preview" style={{maxWidth: '200px', borderRadius: '8px'}} />
                    </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : '📤 Submit Report'}
                </button>
            </form>
        </div>
    );
}

// Schedule Page Component
function SchedulePage() {
    const scheduleData = [
        {
            zone: 'Zone A - Central',
            areas: ['Downtown', 'Main Street', 'City Center'],
            garbage: 'Monday & Thursday',
            recycling: 'Tuesday',
            hazardous: 'First Saturday of month'
        },
        {
            zone: 'Zone B - North',
            areas: ['Northside', 'Parkview', 'Hillcrest'],
            garbage: 'Tuesday & Friday',
            recycling: 'Wednesday',
            hazardous: 'Second Saturday of month'
        },
        {
            zone: 'Zone C - South',
            areas: ['Southdale', 'Riverside', 'Oak Valley'],
            garbage: 'Wednesday & Saturday',
            recycling: 'Thursday',
            hazardous: 'Third Saturday of month'
        },
        {
            zone: 'Zone D - East',
            areas: ['Eastbrook', 'Garden District', 'Sunrise'],
            garbage: 'Monday & Friday',
            recycling: 'Tuesday',
            hazardous: 'Fourth Saturday of month'
        },
        {
            zone: 'Zone E - West',
            areas: ['Westfield', 'Meadowbrook', 'Sunset Hills'],
            garbage: 'Tuesday & Saturday',
            recycling: 'Wednesday',
            hazardous: 'First Saturday of month'
        }
    ];

    return (
        <div>
            <div className="card">
                <h2>Waste Collection Schedule</h2>
                <p style={{marginBottom: '2rem', color: 'var(--gray-500)'}}>
                    Check your area's waste collection schedule below. Please put bins out by 7:00 AM on collection days.
                </p>
            </div>

            <div className="grid grid-2">
                {scheduleData.map((schedule, index) => (
                    <div key={index} className="card schedule-card">
                        <div className="schedule-title">{schedule.zone}</div>
                        <div className="schedule-areas">
                            Areas: {schedule.areas.join(', ')}
                        </div>
                        <div className="schedule-times">
                            <div className="time-badge">
                                🗑️ Garbage: {schedule.garbage}
                            </div>
                            <div className="time-badge">
                                ♻️ Recycling: {schedule.recycling}
                            </div>
                            <div className="time-badge">
                                ⚠️ Hazardous: {schedule.hazardous}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <h3>Collection Guidelines</h3>
                <div className="grid grid-2" style={{marginTop: '1rem'}}>
                    <div>
                        <h4 style={{color: 'var(--primary-green)', marginBottom: '0.5rem'}}>✅ Do's</h4>
                        <ul style={{paddingLeft: '1.5rem', color: 'var(--gray-600)'}}>
                            <li>Separate recyclables from regular waste</li>
                            <li>Put bins out by 7:00 AM on collection day</li>
                            <li>Keep lids closed to prevent spills</li>
                            <li>Rinse containers before recycling</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{color: 'var(--primary-green)', marginBottom: '0.5rem'}}>❌ Don'ts</h4>
                        <ul style={{paddingLeft: '1.5rem', color: 'var(--gray-600)'}}>
                            <li>Don't overfill bins</li>
                            <li>Don't put hazardous waste in regular bins</li>
                            <li>Don't leave bins out overnight</li>
                            <li>Don't put electronics in regular waste</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// About Page Component
function AboutPage() {
    return (
        <div>
            <div className="card">
                <h2>About CleanCity</h2>
                <p style={{fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--gray-600)'}}>
                    CleanCity is a community-driven initiative to help residents actively participate in keeping their neighborhoods clean and environmentally sustainable.
                </p>
            </div>

            <div className="grid grid-2">
                <div className="card">
                    <h3 style={{color: 'var(--primary-green)'}}>📧 Contact Information</h3>
                    <div style={{marginTop: '1rem'}}>
                        <p><strong>Email:</strong> support@cleancity.com</p>
                        <p><strong>Phone:</strong> (555) 123-CLEAN</p>
                        <p><strong>Emergency:</strong> (555) 911-WASTE</p>
                        <p><strong>Hours:</strong> Mon-Fri 8AM-6PM</p>
                    </div>
                    <div style={{marginTop: '1.5rem'}}>
                        <a href="mailto:support@cleancity.com" className="btn btn-primary">
                            📧 Email Us
                        </a>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{color: 'var(--primary-green)'}}>🌱 Our Mission</h3>
                    <p style={{marginTop: '1rem', color: 'var(--gray-600)'}}>
                        To create cleaner, healthier communities through citizen engagement, 
                        efficient waste management, and environmental awareness. Together, 
                        we can build a sustainable future for our neighborhoods.
                    </p>
                </div>
            </div>

            <div className="card">
                <h3 style={{color: 'var(--primary-green)'}}>💡 Tips for Residents</h3>
                <div className="grid grid-3" style={{marginTop: '1.5rem'}}>
                    <div style={{textAlign: 'center', padding: '1rem'}}>
                        <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>♻️</div>
                        <h4>Recycle Right</h4>
                        <p style={{color: 'var(--gray-600)', fontSize: '0.9rem'}}>
                            Clean containers before recycling and separate materials properly
                        </p>
                    </div>
                    <div style={{textAlign: 'center', padding: '1rem'}}>
                        <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🗑️</div>
                        <h4>Reduce Waste</h4>
                        <p style={{color: 'var(--gray-600)', fontSize: '0.9rem'}}>
                            Use reusable bags, containers, and avoid single-use items
                        </p>
                    </div>
                    <div style={{textAlign: 'center', padding: '1rem'}}>
                        <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🌿</div>
                        <h4>Compost Organic</h4>
                        <p style={{color: 'var(--gray-600)', fontSize: '0.9rem'}}>
                            Turn food scraps and yard waste into nutrient-rich compost
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sign Up Page Component
function SignUpPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const users = getUsers();
        const exists = users.some(u => (u.email || '').toLowerCase() === (formData.email || '').toLowerCase());
        if (exists) {
            alert('An account with this email already exists. Please log in.');
            window.location.hash = 'home';
            return;
        }

        const newUser = { name: formData.name.trim(), email: formData.email.trim(), password: formData.password, role: 'user' };
        setUsers([newUser, ...users]);

        setIsSubmitting(false);
        alert('Account created! You can now log in and report issues.');
        window.location.hash = 'home';
    };

    return (
        <div className="card" style={{maxWidth: '520px', margin: '0 auto'}}>
            <h2>Create an Account</h2>
            <p style={{marginBottom: '1rem', color: 'var(--gray-500)'}}>Sign up to report issues and track progress.</p>
            <form className="form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="su_name">Name</label>
                    <input id="su_name" name="name" type="text" placeholder="Your full name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="su_email">Email</label>
                    <input id="su_email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="su_password">Password</label>
                    <input id="su_password" name="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
            </form>
        </div>
    );
}

// Report Card Component
function ReportCard({ report }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getWasteTypeIcon = (type) => {
        const icons = {
            'overflowing-garbage': '🗑️',
            'illegal-dumping': '🚫',
            'hazardous-waste': '⚠️',
            'recycling-issue': '♻️',
            'other': '❓'
        };
        return icons[type] || '❓';
    };

    const getWasteTypeLabel = (type) => {
        const labels = {
            'overflowing-garbage': 'Overflowing Garbage',
            'illegal-dumping': 'Illegal Dumping',
            'hazardous-waste': 'Hazardous Waste',
            'recycling-issue': 'Recycling Issue',
            'other': 'Other'
        };
        return labels[type] || 'Other';
    };

    return (
        <div className="card report-card">
            <div className="report-header">
                <div className="report-type">
                    {getWasteTypeIcon(report.wasteType)} {getWasteTypeLabel(report.wasteType)}
                </div>
                <div className="report-date">{formatDate(report.date)}</div>
            </div>
            <div className="report-location">📍 {report.location}</div>
            <p style={{color: 'var(--gray-600)', fontSize: '0.9rem', marginBottom: '1rem'}}>
                {report.description}
            </p>
            <div style={{fontSize: '0.875rem', color: 'var(--gray-500)'}}>
                Reported by: {report.name}
            </div>
            {report.photo && (
                <img src={report.photo} alt="Report" className="report-image" />
            )}
        </div>
    );
}

// Admin Dashboard Component
function AdminDashboard({ reports, onUpdateStatus }) {
    const totalReports = reports.length;
    const submittedReports = reports.filter(r => r.status === 'submitted').length;
    const inProgressReports = reports.filter(r => r.status === 'in-progress').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
    
    // Calculate average response time (simulated)
    const avgResponseTime = totalReports > 0 ? Math.round((totalReports * 2.5) / 10) / 10 : 0;
    
    // Generate chart data
    const generateCharts = () => {
        setTimeout(() => {
            // Reports by Status Chart
            const statusCtx = document.getElementById('statusChart');
            if (statusCtx && window.Chart) {
                new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Submitted', 'In Progress', 'Resolved'],
                        datasets: [{
                            data: [submittedReports, inProgressReports, resolvedReports],
                            backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
            
            // Reports by Type Chart
            const typeData = {};
            reports.forEach(report => {
                typeData[report.wasteType] = (typeData[report.wasteType] || 0) + 1;
            });
            
            const typeCtx = document.getElementById('typeChart');
            if (typeCtx && window.Chart) {
                new Chart(typeCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(typeData),
                        datasets: [{
                            label: 'Reports by Type',
                            data: Object.values(typeData),
                            backgroundColor: '#22c55e',
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            }
            
            // Monthly Trend Chart (simulated data)
            const trendCtx = document.getElementById('trendChart');
            if (trendCtx && window.Chart) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                const trendData = months.map(() => Math.floor(Math.random() * 20) + 5);
                
                new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Monthly Reports',
                            data: trendData,
                            borderColor: '#22c55e',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            }
        }, 100);
    };
    
    React.useEffect(() => {
        generateCharts();
    }, [reports]);
    
    const handleStatusUpdate = (reportId, newStatus) => {
        onUpdateStatus(reportId, newStatus);
    };
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    
    const getPriorityClass = (report) => {
        // Simple priority calculation based on waste type and keywords
        const highPriorityTypes = ['hazardous-waste'];
        const description = report.description.toLowerCase();
        const urgentWords = ['emergency', 'danger', 'overflow', 'block'];
        
        if (highPriorityTypes.includes(report.wasteType) || urgentWords.some(word => description.includes(word))) {
            return 'priority-high';
        }
        if (report.wasteType === 'illegal-dumping') {
            return 'priority-medium';
        }
        return 'priority-low';
    };
    
    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-title">Admin Dashboard</h1>
                <div style={{fontSize: '1rem', color: 'var(--gray-600)'}}>
                    Waste Management System Overview
                </div>
            </div>
            
            <div className="kpi-cards">
                <div className="kpi-card">
                    <div className="kpi-number">{totalReports}</div>
                    <div className="kpi-title">Total Reports</div>
                    <div className="kpi-subtitle">All Time</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-number">{resolutionRate}%</div>
                    <div className="kpi-title">Resolution Rate</div>
                    <div className="kpi-subtitle">Success Rate</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-number">{submittedReports + inProgressReports}</div>
                    <div className="kpi-title">Active Issues</div>
                    <div className="kpi-subtitle">Need Attention</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-number">{avgResponseTime}d</div>
                    <div className="kpi-title">Avg Response</div>
                    <div className="kpi-subtitle">Time to Resolve</div>
                </div>
            </div>
            
            <div className="grid grid-3" style={{marginBottom: '2rem'}}>
                <div className="chart-container">
                    <div className="chart-title">Reports by Status</div>
                    <canvas id="statusChart" className="chart-canvas"></canvas>
                </div>
                <div className="chart-container">
                    <div className="chart-title">Reports by Type</div>
                    <canvas id="typeChart" className="chart-canvas"></canvas>
                </div>
                <div className="chart-container">
                    <div className="chart-title">Monthly Trend</div>
                    <canvas id="trendChart" className="chart-canvas"></canvas>
                </div>
            </div>
            
            <div className="reports-table">
                <div style={{padding: '1.5rem 1.5rem 0'}}>
                    <h3 style={{margin: 0}}>All Reports</h3>
                    <p style={{margin: '0.5rem 0 1rem', color: 'var(--gray-600)'}}>Manage and track all waste management reports</p>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>Reporter</th>
                            <th>Date</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map(report => (
                            <tr key={report.id}>
                                <td>#{report.id.toString().slice(-4)}</td>
                                <td>
                                    {report.wasteType.split('-').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                </td>
                                <td>{report.location}</td>
                                <td>{report.name}</td>
                                <td>{formatDate(report.date)}</td>
                                <td>
                                    <span className={`priority-indicator ${getPriorityClass(report)}`}></span>
                                    {getPriorityClass(report).split('-')[1]}
                                </td>
                                <td>
                                    <span className={`status-badge ${report.status}`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td>
                                    {report.status !== 'resolved' && (
                                        <button 
                                            className="action-btn resolve"
                                            onClick={() => handleStatusUpdate(report.id, 
                                                report.status === 'submitted' ? 'in-progress' : 'resolved'
                                            )}
                                        >
                                            {report.status === 'submitted' ? 'Start' : 'Resolve'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{textAlign: 'center', padding: '2rem', color: 'var(--gray-500)'}}>
                                    No reports found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('app'));
