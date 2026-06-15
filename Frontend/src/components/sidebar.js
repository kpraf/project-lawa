import { useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom"
import project_lawa_logo from '../images/project_lawa_logo_2.png'

export default function Sidebar({userProps, emailProps}) {
    const navigate = useNavigate()
    const location = useLocation()
    const [open, setOpen] = useState(false); // Start collapsed

    let {pathname} = useLocation()
    let subpage = pathname.split('/')[1]

    function Linkness(type = null) {
        let base = "flex items-center gap-x-3 px-4 py-3 rounded-lg transition-colors duration-200 group";
        let active = "bg-gradient-to-r from-mapua-red/90 to-mapua-blue/80 text-white shadow-lg";
        let inactive = "text-white hover:bg-mapua-blue/70 hover:shadow";
        return type === subpage ? `${base} ${active}` : `${base} ${inactive}`;
    }

    const navToDashboard = () => navigate('/admin');
    const navToLogin = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        navigate('/');
    }
    
    const navToReports = () => navigate('/admin-reports');
    const navToAnalytics = () => navigate('/admin-analytics');
    const navToHome = () => navigate('/');
    const navToCommunityDashboard = () => navigate('/dashboard');
    const navToProfile = () => navigate('/profile');

    // // Get user info from localStorage
    // let user = null;
    // try {
    //     user = JSON.parse(localStorage.getItem('user'));
    // } catch (e) {
    //     user = null;
    // }
    // Use email as the display name
    const email = emailProps
    // const profilePic = user?.profilePic || null; // expects a URL
    const role = userProps ? userProps.toUpperCase() : userProps; // expects a string like 'admin', 'user', etc.
    const profilePic = `/images/${role}.png`;

    // Sidebar width and collapse logic
    const sidebarWidth = open ? "w-[260px]" : "w-[72px]";
    const labelClass = open ? "opacity-100 ml-2" : "opacity-0 ml-0 pointer-events-none";
    const transitionAll = "transition-all duration-300 ease-in-out";

    // Sidebar positioning
    const sidebarPosition = open
        ? "fixed top-0 left-0 z-[60] h-screen"
        : "sticky top-0 h-screen"; // sticky when collapsed

    // Overlay for blur effect
    const overlay = open ? (
        <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-all duration-300"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar overlay"
        />
    ) : null;

    return (
        <>
            {/* Overlay when expanded */}
            {overlay}
            <div
                className={`${sidebarPosition} ${sidebarWidth} ${transitionAll}`}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                aria-label="Sidebar"
                tabIndex={0}
            >
                <div
                    className={`flex flex-col bg-gradient-to-b from-mapua-blue via-mapua-blue/90 to-mapua-blue/80 pt-6 ${transitionAll} w-full h-full justify-between shadow-2xl`}
                >
                    {/* Top section: logo + navigation */}
                    <div>
                        {/* Centered and larger logo with size transition */}
                        <div className="flex flex-col justify-center items-center px-4 mb-6">
                            <div
                                className="flex flex-col items-center cursor-pointer select-none w-full"
                                style={{ minHeight: open ? 80 : 64, transition: 'min-height 0.3s' }}
                                onClick={navToHome}
                                tabIndex={0}
                                aria-label="Go to Home"
                            >
                                <div
                                    className={`bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-mapua-red p-0 transition-all duration-300`}
                                    style={{
                                        width: open ? 80 : 44,
                                        height: open ? 80 : 44,
                                    }}
                                >
                                    <img
                                        src={project_lawa_logo}
                                        alt="Project LAWA Logo"
                                        className="object-contain transition-all duration-300"
                                        style={{
                                            width: open ? 64 : 28,
                                            height: open ? 64 : 28,
                                            opacity: 0.93
                                        }}
                                    />
                                </div>
                                {/* Project Lawa text under the logo, animated and hidden when collapsed */}
                                <span
                                    className={`
                                        font-bold text-base select-none leading-tight text-center mt-2
                                        transition-all duration-300
                                        ${open ? 'opacity-100 translate-y-0 max-h-20' : 'opacity-0 -translate-y-2 max-h-0 pointer-events-none'}
                                    `}
                                    style={{
                                        color: "#fff",
                                        WebkitTextStroke: "0.7px #C41230", // More subtle Mapua Red
                                        textStroke: "0.7px #C41230",
                                        letterSpacing: "1px",
                                        overflow: "hidden",
                                        display: "inline-block"
                                    }}
                                >
                                    PROJECT<br />LAWA
                                </span>
                            </div>
                        </div>
                        {/* Navigation buttons */}
                        <nav className="flex flex-col gap-y-2 px-2">
                            <button className={Linkness('admin')}
                                onClick={navToDashboard}
                                tabIndex={0}
                            >
                                <i className="bi bi-graph-up text-xl group-hover:text-mapua-red transition-colors" />
                                <span className={`break-words font-medium text-lg ${transitionAll} ${labelClass}`}>Admin Dashboard</span>
                            </button>
                            <button className={Linkness('admin-analytics')}
                                onClick={navToAnalytics}
                                tabIndex={0}
                            >
                                {
                                    subpage === 'admin-analytics' ? (
                                        <i className="bi bi-clipboard2-data-fill text-xl group-hover:text-mapua-red transition-colors"></i>
                                    ) : (
                                        <i className="bi bi-clipboard-data text-xl group-hover:text-mapua-red transition-colors"></i>
                                    )
                                }
                                <span className={`break-words font-medium text-lg ${transitionAll} ${labelClass}`}>System Logs</span>
                            </button>
                            <button className={Linkness('admin-reports')}
                                onClick={navToReports}
                                tabIndex={0}
                            >
                                {
                                    subpage === 'admin-reports' ? (
                                        <i className="bi bi-file-earmark-text-fill text-xl group-hover:text-mapua-red transition-colors"></i>
                                    ) : (
                                        <i className="bi bi-file-earmark-text text-xl group-hover:text-mapua-red transition-colors"></i>
                                    )
                                }
                                <span className={`break-words font-medium text-lg ${transitionAll} ${labelClass}`}>Quarter Reports</span>
                            </button>
                        </nav>
                    </div>
                    {/* Bottom section: Community Dashboard + Profile Card + Log Out */}
                    <div className="mb-8 flex flex-col gap-y-2 px-2">
                        <button
                            className={Linkness('dashboard')}
                            onClick={navToCommunityDashboard}
                            tabIndex={0}
                        >
                            <i className="bi bi-people text-xl group-hover:text-mapua-red transition-colors"></i>
                            <span className={`break-words font-medium text-lg ${transitionAll} ${labelClass}`}>Community Dashboard</span>
                        </button>
                        {/* Profile Card: expanded shows card, collapsed shows only icon */}
                        {open ? (
                            <div
                                className="flex flex-col items-center bg-white/90 rounded-xl shadow px-3 py-3 mt-2 mb-2 transition-all opacity-100"
                                style={{
                                    minHeight: 72,
                                    transition: 'all 0.3s',
                                }}
                            >
                                {profilePic ? (
                                    <img
                                        src={profilePic}
                                        alt="Profile"
                                        className="rounded-full object-cover border-2 border-mapua-red mb-2"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            minWidth: 40,
                                            minHeight: 40,
                                            transition: 'all 0.3s'
                                        }}
                                    />
                                ) : (
                                    <i className="bi bi-person-circle text-3xl text-mapua-blue mb-2"></i>
                                )}
                                <span className="font-semibold text-mapua-blue text-sm w-full text-center truncate" title={email}>
                                    {email}
                                </span>
                                {role && (
                                    <span className="text-xs text-gray-500 w-full text-center truncate">{role}</span>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center my-2">
                                {profilePic ? (
                                    <img
                                        src={profilePic}
                                        alt="Profile"
                                        className="rounded-full object-cover border-2 border-mapua-red"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            minWidth: 40,
                                            minHeight: 40,
                                            transition: 'all 0.3s'
                                        }}
                                    />
                                ) : (
                                    <i className="bi bi-person-circle text-3xl text-mapua-blue"></i>
                                )}
                            </div>
                        )}
                        {/* Log Out Button */}
                        <button className={Linkness()}
                            onClick={navToLogin}
                            tabIndex={0}
                        >
                            <i className="bi bi-box-arrow-left text-xl group-hover:text-mapua-red transition-colors"></i>
                            <span className={`break-words font-medium text-lg ${transitionAll} ${labelClass}`}>Log Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}