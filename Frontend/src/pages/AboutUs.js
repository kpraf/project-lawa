import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import Card from '../components/card';
import CJ_Image from '../images/cj2.png';
import Borge_Image from '../images/borge.png';
import Jensen_Image from '../images/jensen.png';
import Emman_Image from '../images/emman.png';
import Mathew_Image from '../images/mathew.png';
import Adviser_Image from '../images/maam-jonalyn.png';

function AboutUs() {
    return (
        <div className="flex flex-col w-full bg-gray-100">
            <header className="w-full content-center object-top sticky z-40 top-0">
                <Navbar />
            </header>
            
            <div className="flex flex-col items-center mt-8 mb-6 px-2">
                <h1 className="text-lg sm:text-xl font-bold font-poppins text-blue-900 tracking-tight mb-2 drop-shadow-sm text-center">
                    About Us
                </h1>
                <div className="h-1 w-16 bg-blue-500 rounded-full mb-2"></div>
            </div>

            <div className="mb-16">
                <div className="grid grid-cols-3 gap-y-[120px] place-items-center mt-[80px]">
                    <Card image={Adviser_Image} name="Jonalyn G. Ebron" role="Thesis Adviser" />
                    <Card image={Jensen_Image} name="Thomas Jensen C. Almazora" role="Device Developer and Maintenance" />
                    <Card image={CJ_Image} name="Christian John D. Dumlao" role="Frontend Developer" />
                    <Card image={Mathew_Image} name="John Mathew M. Nepomuceno" role="Frontend Developer" />
                    <Card image={Borge_Image} name="Borge Joaquinne H. Paguirigan" role="Backend Developer" />
                    <Card image={Emman_Image} name="Emman R. Torrecampo" role="Device Developer and Maintenance" />
                </div>  
            </div>

            <Footer />
        </div>
    );
}

export default AboutUs;