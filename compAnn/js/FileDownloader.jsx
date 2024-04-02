import React, { useState, useEffect } from 'react';
import useToken from './useToken';

function FileDownloader(props) {
    if (props.url === undefined) return <></>
    const { token, removeToken, setToken } = useToken();

    const downloadData = () => {
        fetch(
            `${props.url}`,
            {
                credentials: 'same-origin',
                method: 'GET',
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
                return response.json();
            })
            .then(data => {
                data.access_token && setToken(data.access_token);
                const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                    JSON.stringify(data, (key, value) => {
                        if (key === "access_token") {
                          return undefined;
                        }
                        return value;
                      })
                  )}`;
                  const link = document.createElement("a");
                  link.href = jsonString;
                  link.download = "data.json";
              
                  link.click();
            })
            .catch((error) => console.log(error));
    };

    return (
        <button type="button"
                className="custom-button annotation-submit-button"
                onClick={downloadData}>
                    Download Data
        </button>
    )
}

export default FileDownloader;