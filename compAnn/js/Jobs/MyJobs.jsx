import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import TextTable from '../TextTable';
import useToken from '../useToken';

function MyJobs(props) {
    const { token, removeToken, setToken } = useToken();

    const [jobs, setJobs] = useState([]);
    
    useEffect(() => {

        fetch(`/jobs/get_my_jobs`,
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
                console.log(data)
                let jobEntries = [];
                data.jobs.forEach(job => {
                    jobEntries.push({
                        'index': <span>{job.display_id}</span>,
                        'job_name': <span>{job.job_name}</span>,
                        'job_type': <span>{job.action_type}</span>,
                        'due_time': <span>{job.due_time}</span>,
                        'total_texts': <span>{job.total_texts}</span>,
                        'finished': <span>{job.finished}</span>,
                        'progress': <span>{job.progress}</span>,
                        'status': job.status==0
                            ? <span className="status-circle-grey center-text"/>
                            : job.status==1
                            ? <span className="status-circle-yellow center-text"/>
                            : job.status==2
                            ? <span className="status-circle-green center-text"/>
                            : <span className="status-circle-red center-text"/>
                            ,
                        'link': job.link != ''
                                ? <a href={job.link}>
                                    <button className="custom-button annotation-submit-button">
                                            Go
                                    </button>
                                </a>
                                : <></>
                    })
                });
                setJobs(jobEntries);
            })
            .catch((error) => console.log(error));
        
    }, []);

    const columns = React.useMemo(
        () => [
          {
            Header: 'Index',
            accessor: 'index'
          },
          {
            Header: 'Job Name',
            accessor: 'job_name'
          },
          {
            Header: 'Job Type',
            accessor: 'job_type'
          },
          {
            Header: 'Due Date',
            accessor: 'due_time'
          },
          {
            Header: 'Assigned',
            accessor: 'total_texts'
          },
          {
            Header: 'Completed',
            accessor: 'finished'
          },
          {
            Header: 'Progress',
            accessor: 'progress'
          },
          {
            Header: 'Status',
            accessor: 'status'
          },
          {
            Header: '',
            accessor: 'link'
          }
        ]);

    return (
        <div className="wrapper entry-wrapper">  
            <div className="list-main hide-scrollbar"  style={{width:'75%'}}>
                <div className='header-title'>
                    <h1>My Jobs</h1>
                </div>
                <TextTable columns={columns} data={jobs} />
            </div>
        </div>
    );
}

export default MyJobs;