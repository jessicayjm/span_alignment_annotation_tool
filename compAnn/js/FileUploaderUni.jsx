import React, { useState, useEffect } from 'react';

import Popup from 'reactjs-popup';
import { FileUploader } from "react-drag-drop-files";
import useToken from './useToken';

function FileUploaderUni(props) {
    if (props.fileTypes === undefined || 
        props.url === undefined ||
        props.type === undefined) return <></>
    
    const [uploadState, setUploadState] = useState({showMsg: false,
        status: 'noUpload',
        msg: "",});
    const { token, removeToken, setToken } = useToken();

    useEffect(() => {
        const timer = setTimeout(() => {
            setUploadState(prev => ({...prev, 
            showMsg: false, 
            status: 'noUpload',
            msg: "",
            }));
        }, 5000);
        return () => clearTimeout(timer);
    }, [uploadState]);

    const handleUploadData = (files) => {
        const formData = new FormData();
		for (let i = 0; i < files.length; i++) {
            formData.append(files[i].name, files[i]);
        }
        fetch(
            `${props.url}`,
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
                body: formData,
            },
            )
            .then((response) => {
                console.log(response);
                if (!response.ok) {
                    console.log(Error(response.statusText));
                }
                return response.json();
            })
            .then(data => {
                setUploadState(prev => ({...prev, 
                    showMsg: true,
                    status: data.ok, 
                    msg: data.message,
                  }))
            })
            .catch((error) => console.log(error));
    };

    return (
        <Popup trigger={<button className="custom-button annotation-submit-button"> Add {props.type} </button>} modal>
            <FileUploader style={{'font-size': '20px'}}
                multiple={true}
                handleChange={handleUploadData}
                name="file"
                maxSize={50}
                types={props.fileTypes}
            />
            {uploadState.showMsg && uploadState.status &&
                    <span style={{'fontSize': '16px', "paddingLeft":"20px"}}>
                    {uploadState.msg}
                    </span>
                }
            {uploadState.showMsg && !uploadState.status &&
                    <span style={{'fontSize': '16px', "paddingLeft":"20px", "color": "red"}}>
                    {uploadState.msg}
                    </span>
                }
        </Popup>
    )
}

export default FileUploaderUni;