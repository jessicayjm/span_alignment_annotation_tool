import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import useToken from './useToken';

function Entry() {
    const { token, removeToken, setToken } = useToken();
    const [updateLog, setUpdateLog] = useState({showMsg: false,
                                                msg: "",});
    const navigate = useNavigate();

    // in case user opens another tab that points to the entry page
    useEffect(() => {
        if (token) { navigate('/home'); }
        const timer = setTimeout(() => {
            setUpdateLog(prev => ({...prev, 
              showMsg: false, 
            }));
          }, 5000);
        return () => clearTimeout(timer);
    }, [updateLog]);
    
    const handleLogin = (event) => {
        // Prevent page reload
        event.preventDefault();

        var { email, password } = document.forms[0];
        email = email.value;
        password = password.value;

        fetch(
            `/login`,
            {
              credentials: 'same-origin',
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ 
                  email: email,
                  password: password,
             }),
            },
          )
        .then((response) => {
            if (!response.ok) {
                console.log(Error(response.statusText));
            }
            return response.json();
        })
        .then(data => {
            if(!data.ok) {
                navigate('/');
                setUpdateLog(prev => ({...prev, 
                    showMsg: true, 
                    msg: data.message,
                  }))
            }
            else{
                setToken(data.access_token);
                navigate('/home');
            }  
        })
        .catch((error) => console.log(error));
    };

    return (
        <div className="wrapper entry-wrapper">
            <nav className='compann'>
                <Link className="web-title" to="/">CompAnn</Link>
            </nav>
            <div id="entry-main">
                <div id="entry-title">
                    Welcome to Annotation Comparison Tool
                </div>
                <div className="container">
                    <form>
                        <label htmlFor="email"><b>Email</b></label>
                        <input type="text" name="email" required/>

                        <label htmlFor="password"><b>Password</b></label>
                        <input type="password" name="password" required/>

                        <p>If you are a first time user, please input your intended password.</p>
                        {updateLog.showMsg &&
                          <span className="seg-nav" style={{'fontSize': '18px', "paddingLeft":"20px"}}>
                          {updateLog.msg}
                          </span>
                        }

                        <button className="custom-button" id="explore" type="submit" onClick={handleLogin}>Explore</button>
                    </form>      
                </div>
            </div>     
        </div>
    );
}

export default Entry;