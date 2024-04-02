import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import useToken from '../useToken';

// Component for Annotate page that shows all the annotation jobs
function AnnotateHeader(props) {
    if (props.type === undefined ||
        props.projectID === undefined ||
        props.text_displayID === undefined ||
        props.textID === undefined ||
        props.action_type === undefined) return <></>
    
    const { token, removeToken, setToken } = useToken();  
    const [pending, setPending] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [jobInfo, setJobInfo] = useState({});

    useEffect(() => {
        fetch(`/jobs/get_my_individual_job_info/${props.projectID}/text-${props.textID}`,
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify({ 
                    action_type: props.action_type,
                 }),   
            },
        )
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            return response.json();
        })
        .then((data) => {
            setJobInfo(data.job_info);
            if (data.job_info.status === 1){
                setPending(true);
            }
            else if (data.job_info.status === 2) {
                setCompleted(true);
            }
        })
        .catch((error) => console.log(error));
    }, [pending, completed, props.renderHeader]);

    function handleSetComplete() {
        fetch(`/jobs/${props.projectID}/text-${props.textID}/update_job_status`,
            {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
                action_type: 'annotate ' + props.type,
                update_status: 2,
            }),
        },
        )
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            return response.json();
        })
        .then((data) => {
            setCompleted(prev=>data.new_status);
            setPending(false);
        })
        .catch((error) => console.log(error));
        
    }

    function handleSetPending() {
        fetch(`/jobs/${props.projectID}/text-${props.textID}/update_job_status`,
            {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
                action_type: 'annotate ' + props.type,
                update_status: !pending,
            }),
        },
        )
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            return response.json();
        })
        .then((data) => {
            setPending(prev=>data.new_status);
        })
        .catch((error) => console.log(error));
        
    }

    return (
        <div>
            <div>
                <Link className="quick-nav-link" to={`/annotate`}>Annotate</Link>
                {' > '}
                <Link className="quick-nav-link" to={`/annotate/${props.type}/project-${props.projectID}`}>Project-{props.projectID}</Link>
                {` > Text-${props.text_displayID}`}
                <span style={{marginLeft: '50px'}}>Job status: </span>
                {jobInfo.isActiveJob === 0
                ? <span className="status-circle-grey center-text"/>
                : jobInfo.isActiveJob === 1
                ? <span className="status-circle-green center-text"/>
                : <></>
                }
                <span style={{marginLeft: '50px'}}>Annotate status: </span>
                {jobInfo.status===-1 
                ? <span className="status-circle-grey center-text"/>
                : jobInfo.status===0 
                ? <span className="status-circle-red center-text"/>
                : jobInfo.status===1
                ? <span className="status-circle-yellow center-text"/>
                : jobInfo.status===2
                ? <span className="status-circle-green center-text"/>
                : <></>
                }
                <div className="seg-nav">
                {props.prevID === -1
                ? <></>
                : <div className="nav-button">
                        <a href={`/annotate/${props.type}/project-${props.projectID}/text-${props.prevID}`}>
                        Prev
                        </a>
                    </div>
                }
                {props.nextID === -1
                ? <></>
                : <div className="nav-button">
                        <a href={`/annotate/${props.type}/project-${props.projectID}/text-${props.nextID}`}>
                        Next
                        </a>
                    </div>
                }
                </div>
            </div>
            { jobInfo.isActiveJob === 1
            ?<div>
                <span style={{marginRight:'20px'}}>Job Name: {jobInfo.job_name} </span>
                <span style={{marginRight:'20px'}}>Process: {jobInfo.finished}/{jobInfo.total_texts}, {jobInfo.process} </span>
                <span style={{marginRight:'20px'}}>Pending: {jobInfo.pending} </span>
                <span>Due: {jobInfo.due_time} </span>
            </div>
            : <></>
            }
            <div style={{width: '100%'}}>
                { props.showSetComplareButton
                ? <button type="button" 
                    className="custom-button annotation-submit-button seg-nav" 
                    style={{marginRight: '10px'}}
                    onClick={handleSetComplete}>
                    Set Complete
                </button>
                : <></>
                }
                <button type="button" 
                    className="custom-button annotation-submit-button seg-nav" 
                    style={{marginRight: '10px'}}
                    onClick={handleSetPending}>
                {pending
                ? 'Unset Pending'
                : 'Set Pending'}
                </button>
            </div>
        </div >
    );
}

export default AnnotateHeader;