import React from 'react';
import { IoNewspaper } from "react-icons/io5";
import { AiTwotoneBuild } from "react-icons/ai";
import { Link } from "react-router-dom";

// Component for Annotate page that shows all the annotation jobs
function Annotate(props) {
    return (<div className="wrapper entry-wrapper">
            <div className="list-main hide-scrollbar">
                <div className='header-title'>
                    <h1>Annotate</h1>
                </div>
                <Link to={`/annotate/spans/projects`}>
                    <div className="annotate-entry-card">
                        <IoNewspaper className="annotate-entry-icon"/>
                        <div className="annotate-entry-title">
                            Annotate Spans
                        </div>
                    </div>
                </Link>
                
                <Link to={`/annotate/alignment/projects`}>
                    <div className="annotate-entry-card">
                        <AiTwotoneBuild className="annotate-entry-icon"/>
                        <div className="annotate-entry-title">
                            Annotate Alignment
                        </div>
                    </div>
                </Link>
            </div>
        </div>);
}

export default Annotate;