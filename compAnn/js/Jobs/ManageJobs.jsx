import React, { useState, useEffect } from 'react';
import useToken from '../useToken';
import CreateJobPanel from './CreateJobPanel';
import ManageJobCard from './ManageJobCard';

function ManageJobs(props) {
    const { token, removeToken, setToken } = useToken();

    const [jobs, setJobs] = useState([]);
    const [rerenderSignal, setRerenderSignal] = useState(1);
    
    useEffect(() => {

        fetch(`/jobs/get_manage_jobs`,
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
                if (!response.ok) throw Error(response.statusText);
                return response.json();
            })
            .then((data) => {
                setJobs(data.jobs);
            })
            .catch((error) => console.log(error));
        
    }, [rerenderSignal]);

    return (
        <div className="wrapper entry-wrapper">  
            <div className="list-main hide-scrollbar">
                <div className='header-title'>
                    <h1>Manage Jobs</h1>
                </div>
                <CreateJobPanel setRerenderSignal={setRerenderSignal}/>
                {jobs.map(function(job, idx){
                    return <ManageJobCard key={idx} job={job}/>
                })}    
            </div>
        </div>
    );
}

export default ManageJobs;