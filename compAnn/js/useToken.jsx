// code from:
// https://dev.to/nagatodev/how-to-add-login-authentication-to-a-flask-and-react-application-23i7
import { useState } from 'react';

function useToken() {

  function getToken() {
    const userToken = localStorage.getItem('token');
    // only returns a token if it exists
    return userToken && userToken
  }

  const [token, setToken] = useState(getToken());

  function saveToken(userToken) {
    localStorage.setItem('token', userToken);
    setToken(userToken);
  };

  function removeToken() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return {
    setToken: saveToken,
    token,
    removeToken
  }

}

export default useToken;