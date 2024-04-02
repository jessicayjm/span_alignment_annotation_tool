import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectInfo from "../Projects/ProjectInfo";
import useToken from '../useToken';

// Component for Annotate page that shows all the annotation jobs
function AnnotateProj(props) {
    const params = useParams();
    const [projects,setProjects] = useState([]);
    const { token, removeToken, setToken } = useToken();

    useEffect(() => {
        fetch('/jobs/projects-lists/',
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify({
                    action_type: 'annotate ' + params.type,
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
                          link={`/annotate/${params.type}/project-${projects[i].id}`} />
        );
    }

    return (
        <div className="wrapper entry-wrapper">
            <div className="list-main hide-scrollbar">
                {params.type === 'spans'
                ? <>
                    <div className='header-title'>
                        <h1>Annotate Spans</h1>
                    </div>
                    {projectList}
                </>
                : params.type === 'alignment' ?
                <>
                    <div className='header-title'>
                        <h1>Annotate Alignment</h1>
                    </div>
                    {projectList}
                </>
                : <></>}
            </div>
        </div>
    );
}
export default AnnotateProj;