import SidebarClient from '../../Components/sidebar/SidebarClient';
import HeaderTopbar from '../../Components/Topbar/header-topbar/HeaderTopbar';
import WelcomeSection from "../../Components/welcome section/WelcomeSection";
import Footer from '../../footer-compoent/Footer';

import "../../index.css"
import './home.css'


export default function Home() {
  return (
    <div className="container">
      <SidebarClient />
      <div className="content">
        <HeaderTopbar />
        <WelcomeSection />
        <Footer />
      </div>
    </div>
  );
}





