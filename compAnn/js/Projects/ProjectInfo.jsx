import React from 'react';
import { Link } from "react-router-dom";

function ProjectInfo(props) {
    const {id, projName, description, link} = props;
    return (
        <div className="projInfo">
            <div className="projTitle">
                <span>
                    <Link to={link}>
                        {projName}
                    </Link>
                </span>
                
            </div>
            <div className="projDes">
                <span>
                    {/* <Link to={link}> */}
                        <p className="">Description: {description}</p>
                    {/* </Link> */}
                </span>
                
            </div>
            
        </div>
    );
}

export default ProjectInfo;