import React from 'react';
import { IoNewspaper } from "react-icons/io5";
import { AiTwotoneBuild } from "react-icons/ai";
import { Link } from "react-router-dom";

// Component for Annotate page that shows all the annotation jobs
function Review(props) {
    return (<div className="wrapper entry-wrapper">
            <div className="list-main hide-scrollbar">
                <div className='header-title'>
                    <h1>Review</h1>
                </div>
                <Link to={`/review/spans/projects`}>
                    <div className="annotate-entry-card">
                        <IoNewspaper className="annotate-entry-icon"/>
                        <div className="annotate-entry-title">
                            Review Spans
                        </div>
                    </div>
                </Link>
                
                <Link to={`/review/alignment/projects`}>
                    <div className="annotate-entry-card">
                        <AiTwotoneBuild className="annotate-entry-icon"/>
                        <div className="annotate-entry-title">
                            Review Alignment
                        </div>
                    </div>
                </Link>
            </div>
        </div>);
}

export default Review;