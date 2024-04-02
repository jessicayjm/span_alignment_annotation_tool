import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import useToken from './useToken';
import { useNavigate } from "react-router-dom";

function Header() {
    const { token, removeToken, setToken } = useToken();

    const navigate = useNavigate();

    // useEffect(() => {
    //     // get user info
    //     fetch('/userinfo',
    //         {
    //             credentials: 'same-origin',
    //             method: 'GET',
    //             headers: {
    //                 'content-type': 'application/json',
    //                 'Authorization': 'Bearer ' + token,
    //             },
    //         },
    //     )
    //     .then((response) => {
    //         if (!response.ok) {
    //             console.log(Error(response.statusText));
    //         }
    //         return response.json();
    //     })
    //     .then(data => {
    //         setUser(data.user);
    //     })
    //     .catch((error) => console.log(error));
    // }, []);

    const logout = () => {
        fetch('/logout',
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
            },
        )
        .then((response) => {
            if (!response.ok) {
                console.log(Error(response.statusText));
            }
            removeToken();
            navigate('/');
        })
        .catch((error) => console.log(error));
    }

    return (
        <div className="header">
            <nav className='compann'>
                <Link className="web-title" to="/">CompAnn</Link>
                <Link className="nav-entry" to="/home">Projects</Link>
                <Link className="nav-entry" to="/jobs">Jobs</Link>
                <Link className="nav-entry" to="/annotate">Annotate</Link>
                <Link className="nav-entry" to="/review">Review</Link>
                <button className="custom-button logout-button" onClick={logout}> 
                    Logout
                </button>
            </nav>
        </div>
    );
}

export default Header;