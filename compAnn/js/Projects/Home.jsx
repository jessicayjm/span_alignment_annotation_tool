import React, { useState, useEffect } from 'react';
import ProjectInfo from "./ProjectInfo";
import FileUploaderUni from '../FileUploaderUni';
import useToken from '../useToken';

function Home(props) {
    const [projects,setProjects] = useState([]);
    const { token, removeToken, setToken } = useToken();

    useEffect(() => {
        fetch('/projects-lists/',
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
                          link={`/home/project-${projects[i].id}`} />
        );
    }

    return (
        <div className="wrapper entry-wrapper">
            {/* <div className="header">
                <nav>
                    <Link to="#" className="web-title">CompAnn</Link>
                </nav>
            </div> */}
            <div className="list-main hide-scrollbar">
                <div className='header-title'>
                    <h1>Projects</h1>
                </div>
                <FileUploaderUni fileTypes={["json"]} url={`/projects/upload_project`} type="Project"/>
                {projectList}
            </div>
        </div>
    );
}

export default Home;