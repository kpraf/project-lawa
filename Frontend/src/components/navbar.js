import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FaUsers, FaBars, FaTimes, FaChevronDown } from 'react-icons/fa'; // Removed FaUserCircle
import project_lawa_logo from '../images/project_lawa_logo_2.png'

function Navbar() {
    const [color, setColor] = useState(false);
    const [dropdown, setDropdown] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false); // Mobile menu state
    const [navHovered, setNavHovered] = useState(false);

    let {pathname} = useLocation()
    let subpage = pathname.split('/')?.[1]

    // Animation state for dashboard identifier
    const [showDashboardLabel, setShowDashboardLabel] = useState(false);

    useEffect(() => {
        if (subpage === "dashboard") {
            setShowDashboardLabel(true);
        } else {
            setShowDashboardLabel(false);
        }
    }, [subpage]);

    function Linkness(type = null){
        let classes = "text-lg font-poppins mx-4 hover:cursor-pointer hover:text-mapua-red hover:underline underline-offset-8 decoration-4 transition duration-200"
        if(type === subpage){
            classes = "text-lg font-poppins mx-4 hover:cursor-pointer underline underline-offset-8 decoration-4 text-mapua-red"
        }
        return classes
    }

    // Prevent multiple scroll listeners
    useEffect(() => {
        const changeNav = () => {
            if (window.scrollY > 50) {
                setColor(true);
            } else {
                setColor(false);
            }
        };
        window.addEventListener('scroll', changeNav);
        return () => window.removeEventListener('scroll', changeNav);
    }, []);

    const navigate = useNavigate();

    const toMain = () => {
        navigate('/dashboard');
        setMobileMenu(false);
    };

    const toHomepage = () => {
        navigate('/');
        setMobileMenu(false);
    };

    const toAboutUs = () => {
        navigate('/about-us');
        setMobileMenu(false);
    };

    const toMonitoringPage = () => {
        navigate('/monitoring-data');
        setDropdown(false);
        setMobileMenu(false);
    };

    const toReportsPage = () => {
        navigate('/reports');
        setDropdown(false);
        setMobileMenu(false);
    }

    const dropdownRef = useRef(null);

    // Close dropdown on outside click (desktop only)
    useEffect(() => {
        if (!dropdown) return;
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdown]);

    // Desktop dropdown open/close handlers with delay on leave
    const dropdownTimeout = useRef();

    const handleDropdownEnter = () => {
        clearTimeout(dropdownTimeout.current);
        setDropdown(true);
    };
    const handleDropdownLeave = () => {
        dropdownTimeout.current = setTimeout(() => setDropdown(false), 180); // 180ms delay
    };

    // Mobile dropdown toggle
    const toggleDropdown = () => setDropdown((prev) => !prev);

    // Mobile menu toggle (add this function)
    const toggleMobileMenu = () => setMobileMenu((prev) => !prev);

    // Optionally, clear timeout on unmount to avoid memory leaks:
    useEffect(() => {
        return () => clearTimeout(dropdownTimeout.current);
    }, []);

    return (
        <div
            className="bg-white"
        >
            <div className={
                (color ? 'shadow-xl ' : '') +
                'px-[20px] md:px-[50px] flex justify-between items-center py-4 top-0 transition duration-150 relative z-20'
            }>
                <div className="flex items-center">
                    {/* Logo + Project LAWA text with hover animation */}
                    <div
                        className="flex items-center group hover:cursor-pointer mr-[60px] hover:mr-[5px]"
                        onClick={toHomepage}
                        style={{ userSelect: "none" }}
                    >
                        <img
                            src={project_lawa_logo}
                            alt="Project LAWA Logo"
                            className="h-14 w-14 transition-transform duration-300 absolute"
                            style={{ opacity: 0.93 }}
                        />
                        <span
                            className="ml-1 font-bold text-xl text-black transition-all duration-400 ease-in-out
                                max-w-0 group-hover:max-w-[200px] group-hover:ml-[65px] overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100"
                            style={{
                                transition: "all 0.4s cubic-bezier(.4,2,.6,1)",
                            }}
                        >
                            PROJECT LAWA
                        </span>
                    </div>
                    {/* Animated Community Dashboard label, only on dashboard */}
                    <FaUsers size={18} color="#172851" style={{ marginRight: "7px", marginLeft: "10px", opacity: 0.85 }} />
                    <span style={{
                        fontWeight: 600,
                        fontSize: "1rem",
                        color: "#172851",
                        letterSpacing: "0.5px",
                        opacity: 0.95,
                        whiteSpace: "nowrap"
                    }}>
                        Community Dashboard
                    </span>
                </div>
                {/* Desktop nav */}
                <div className="nav-links hidden md:flex items-center">
                    <div className="flex flex-col">
                        <a className={Linkness('')} onClick={toHomepage}>Home</a>
                    </div>
                    <div
                        className="relative flex flex-row items-center select-none"
                        onMouseEnter={handleDropdownEnter}
                        onMouseLeave={handleDropdownLeave}
                        ref={dropdownRef}
                        tabIndex={0}
                        onFocus={handleDropdownEnter}
                        onBlur={handleDropdownLeave}
                    >
                        <a className={Linkness('dashboard')} onClick={toMain}>
                            Dashboard
                        </a>
                        <FaChevronDown
                            className={`ml-1 transition-transform duration-300 ${!dropdown ? 'rotate-180' : ''}`}
                            size={16}
                            style={{ marginTop: 2, color: '#172851', cursor: 'pointer' }}
                        />
                        {dropdown && (
                            <div className="absolute top-full left-0 bg-white shadow-lg rounded-lg w-44 mt-2 z-30 animate-fade-in">
                                <a className="block px-4 py-2 text-lg font-poppins hover:bg-gray-200 hover:cursor-pointer" onClick={toMonitoringPage}>Monitoring</a>
                                <a className="block px-4 py-2 text-lg font-poppins hover:bg-gray-200 hover:cursor-pointer hover:rounded-b-lg" onClick={toReportsPage}>Quarter Reports</a>
                            </div>
                        )}
                    </div>
                    <a className={Linkness('about-us')} onClick={toAboutUs}>About Us</a>
                    {/* Removed Login as text link */}
                </div>
                {/* Hamburger for mobile */}
                <div className="md:hidden flex items-center">
                    <button onClick={toggleMobileMenu} className="focus:outline-none">
                        {mobileMenu ? <FaTimes size={26} /> : <FaBars size={26} />}
                    </button>
                </div>
            </div>
            {/* Mobile menu */}
            {mobileMenu && (
                <div className="md:hidden bg-white shadow-lg absolute w-full left-0 top-[64px] z-10 animate-fade-in">
                    <a className="block px-6 py-3 text-lg font-poppins border-b hover:bg-gray-100" onClick={toHomepage}>Home</a>
                    <div className="relative">
                        <button
                            className="w-full text-left px-6 py-3 text-lg font-poppins border-b flex items-center hover:bg-gray-100"
                            onClick={toggleDropdown}
                        >
                            Dashboard
                            <FaChevronDown
                                className={`ml-2 transition-transform duration-300 ${!dropdown ? 'rotate-180' : ''}`}
                                size={16}
                                style={{ color: '#172851' }}
                            />
                        </button>
                        {dropdown && (
                            <div className="bg-white animate-fade-in">
                                <a className="block px-10 py-2 text-base font-poppins hover:bg-gray-200" onClick={toMonitoringPage}>Monitoring</a>
                                <a className="block px-10 py-2 text-base font-poppins hover:bg-gray-200" onClick={toReportsPage}>Quarter Reports</a>
                            </div>
                        )}
                    </div>
                    <a className="block px-6 py-3 text-lg font-poppins border-b hover:bg-gray-100" onClick={toAboutUs}>About Us</a>
                    {/* Removed Login as text link for mobile */}
                </div>
            )}
        </div>
    );
}

export default Navbar;