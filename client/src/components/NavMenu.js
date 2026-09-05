import React from 'react';
import { Link } from 'react-router-dom';
// import UserLogin from "../components/UserLogin";



export default function NavMenu({ onResetSearch }) {
    const handleNavigation = () => {
        if (onResetSearch) {
            onResetSearch();
        }
    };

    return (
        <ul className="main-menu">
            <li><Link to='/' onClick={handleNavigation}>HOME</Link></li>
            {/* <li><Link to='/about'>ABOUT</Link></li> */}
            <li><Link to='/learn-more' onClick={handleNavigation}>LEARN MORE</Link></li>
            {/* <li><Link to='/sell-my-home'>SELL MY HOME</Link></li> */}
            <li><Link to='/contact' onClick={handleNavigation}>CONTACT</Link></li>
            {/* <li><UserLogin /></li> */}
        </ul>
    )
}
