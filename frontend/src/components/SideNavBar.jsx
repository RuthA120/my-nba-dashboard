import React from "react";
import { useState } from 'react';
import './SideNavBar.css';
import bballIMG from '../assets/b-ball.png';
import { Link, useNavigate } from 'react-router-dom';
import AnalyticsIcon from '../assets/Analytics-Icon.png';
import GroupsIcon from '../assets/Groups-Icon.png';
import MLIcon from '../assets/ML-Icon.png';
import ProfileIcon from '../assets/Profile-Icon.png';
import SearchIcon from '../assets/Side-search-icon.png';
import InfoIcon from '../assets/Info-Icon.png';

const SideNavBar = (props) => {

    const navigate = useNavigate();
    return (
        <nav className="side-dashboard-nav">
            <div className="top-section">
                <img src={bballIMG} className="bball-img" alt="Basketball" />
                <h1
                    className="side-dashboard-title"
                    onClick={() => navigate('/nba-dashboard')}
                    >
                    NBA<br></br>Dashboard
                </h1>
            </div>
            <ul className="side-dashboard-menu">
                <li className="side-dashboard-item">
                    <img src={InfoIcon} />
                    About Us</li>
                <li className="side-dashboard-item">
                    <img src={SearchIcon} />
                    Search</li>
                <li className="side-dashboard-item">
                    <img src={MLIcon} />
                    ML Models</li>
                <li className="side-dashboard-item">
                    <img src={AnalyticsIcon} />
                    Analytics</li>
                <li className="side-dashboard-item">
                    <img src={GroupsIcon} />
                    Groups</li>
                <li className="side-dashboard-item">
                    <img src={ProfileIcon} />
                    Profile</li>
            </ul>
        </nav>

    );
};

export default SideNavBar;