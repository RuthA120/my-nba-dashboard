import React from "react";
import { useState } from 'react';
import './NavBar.css';
import bballIMG from '../assets/b-ball.png';
import { Link } from 'react-router-dom';

const NavBar = (props) => {
    return (
        <nav className="dashboard-nav">
            <div className="left-section">
                <img src={bballIMG} className="bball-img" alt="Basketball" />
                <h1 className="dashboard-title">NBA Dashboard</h1>
            </div>
            <ul className="dashboard-menu">
                <li className="dashboard-item"><Link to="/players-search">Search</Link></li>
                <li className="dashboard-item"><Link to="/roty-tracker">ROTY Tracker</Link></li>
                <li className="dashboard-item"><Link to="/similarity-engine">Similarity Engine</Link></li>
                <li className="dashboard-item"><Link to="/mvp-builder">MVP Builder</Link></li>
                <li className="dashboard-item"><Link to="/dashboard">My Dashboard</Link></li>
            </ul>
        </nav>

    );
};

export default NavBar;