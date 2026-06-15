import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import Device from '../images/device.jpg';
import Logo from '../images/project_lawa_logo.png';
import Dashboard from '../images/dashboard_2.png';
import Linegraph from '../images/linegraph.png';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function Homepage() {
    const navigate = useNavigate();

    const toMain = () => navigate('/dashboard');

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        initialSlide: 2,
        arrows: false,
        pauseOnHover: true,
        autoplaySpeed: 3000,
        autoplay: true,
    };

    const data = [
        {
            img: Device,
            desc: "Deploy a reliable and low-cost multi-sensor device system to collect real time quality data on key parameters such as Temperature, Dissolved Oxygen, pH level, ORP, Turbidity, and Total Dissolved Solids in selected tributaries."
        },
        {
            img: Dashboard,
            desc: "Provide a real-time monitoring system to collect and transmit water quality data to a central server or cloud-based platform for analysis and visualization, and display these results through a web-based dashboard."
        },
        {
            img: Linegraph,
            desc: "Use the collected water data for identifying trends and analyzing historical patterns in order to help making data-driven decisions and take preventive measures to improve the lake's health."
        }
    ];

    return (
        <div className="flex flex-col w-full top-0 bg-gray-100 h-full">
            <header className="w-full content-center object-top sticky z-40 top-0">
                <Navbar />
            </header>

            <div className="flex lg:flex-row sm:flex-col h-dvh">
                <div className="flex flex-col w-[55%]">
                    <div className="flex flex-row items-center lg:relative h-full justify-center">
                        <div class="flex flex-col w-[95%]">
                            <img src={Logo} className="object-cover opacity-90" />
                            <p className="text-gray-800 font-open-sans text-2xl/10 mx-10 pt-10">
                                <span className="text-mapua-blue font-open-sans text-2xl text-left font-bold">Project Lawa </span> aims to provide a multi-sensor device that is capable of capturing real-time and accurate water data with the objective of eliminating the traditional method of water data gathering, which are both expensive and time-consuming.
                            </p>
                            <button className="z-10 ml-8 mt-10 bg-mapua-red text-white py-4 px-4 w-[200px] rounded-full hover:bg-red-800 shadow-md transition-all ease-in hover:-translate-y-2 hover:scale-110 duration-150" onClick={toMain}>
                                <label className="font-poppins cursor-pointer">View Dashboard</label>
                                <i className="bi bi-arrow-right ml-3 text-lg cursor-pointer"></i>
                            </button>
                        </div>
                        <div className="inset-0 bg-gradient-to-r from-transparent from-80% to-mapua-blue lg:absolute h-full z-0"></div>
                    </div>
                </div>
                <div className="bg-mapua-blue lg:w-[45%] flex flex-col content-center items-center">
                    {/* <div className="w-full">
                        <div className="flex flex-col h-full justify-center items-end pr-[100px]">
                            <label className="font-poppins font-bold text-6xl">What we do</label>
                            <p className="text-right font-open-sans mt-7 pl-[200px] text-xl/10 text-gray-300">
                                <span className="text-mapua-red font-open-sans text-right font-bold text-2xl">Project Lawa </span> focuses on providing a low-cost device capable of collecting reliable water data and visualize them to meaningful information through a web-based dashboard.  
                            </p>
                        </div>
                    </div> */}
                    <div className="w-[500px] my-auto flex flex-col gap-y-8">
                        <label className="font-poppins font-bold text-6xl text-white text-center">What we do</label>
                        <Slider {...settings}>
                        {data.map((d, index) => (
                            <div key={index} className="bg-white text-black font-open-sans rounded-lg">
                                <div className="h-[300px] w-[500px] flex justify-center">
                                    <img src={d.img} className="rounded-t-lg" alt="" />
                                </div>
                                <div className="p-5 rounded-lg">
                                    <p>{d.desc}</p>
                                </div>
                            </div>
                        ))}
                        </Slider>
                    </div>
                </div>
            </div>

            {/* <Footer /> */}
        </div>
    );
}

export default Homepage;