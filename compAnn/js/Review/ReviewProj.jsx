import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectInfo from "../Projects/ProjectInfo";
import useToken from '../useToken';

function ReviewProj(props) {
    const [projects,setProjects] = useState([]);
    const params = useParams();
    const [user, setUser] = useState({});
    const { token, removeToken, setToken } = useToken();

    useEffect(() => {
        // get user info
        fetch('/userinfo',
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
            data.access_token && setToken(data.access_token)
            setUser(prev => ({...prev, 
                user: data.user
            }));
        })
        .catch((error) => console.log(error));


        fetch('/jobs/projects-lists/',
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify({
                    action_type: 'review ' + params.type,
                }),
            },
        )
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            return response.json();
        })
        .then((data) => {
            setProjects(data.projects);
        })
        .catch((error) => console.log(error));
    }, []);

    const projectList = [];
    for (let i = 0; i < projects.length; i += 1) {
        projectList.push(
            <ProjectInfo  key={projects[i].id}  
                          id={projects[i].id}
                          projName={projects[i].name} 
                          description={projects[i].description} 
                          link={`/review/${params.type}/project-${projects[i].id}`} />
        );
    }

    return (
            <div className="wrapper entry-wrapper">
                <div className="list-main hide-scrollbar">
                    {params.type === 'spans'
                    ? <>
                        <div className='header-title'>
                            <h1>Review Spans</h1>
                        </div>
                        {projectList}
                    </>
                    : params.type === 'alignment' ?
                    <>
                        <div className='header-title'>
                            <h1>Review Alignment</h1>
                        </div>
                        {projectList}
                    </>
                    : <></>}
                </div>
            </div>
    );
}

export default ReviewProj;