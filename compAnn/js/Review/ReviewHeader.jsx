import React, {useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import useToken from '../useToken';

function ReviewHeader(props) {
    if (props.projectID === undefined ||
        props.text_displayID === undefined ||
        props.textID === undefined) return <></>
    
    const { token, removeToken, setToken } = useToken();
    const [reviewStatus, setReviewStatus] = useState();
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
                    action_type: 'review ' + props.actionType,
                 }),   
            },
        )
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            return response.json();
        })
        .then((data) => {
            setJobInfo(data.job_info);
            setReviewStatus(data.job_info.status);
        })
        .catch((error) => console.log(error));

    }, [reviewStatus]);

    const updateReviewStatus = () => {
        fetch(
            `/jobs/${props.projectID}/text-${props.textID}/update_job_status`,
            {
              credentials: 'same-origin',
              method: 'POST',
              headers: {
                  'content-type': 'application/json',
                  'Authorization': 'Bearer ' + token,
              },
              body: JSON.stringify({ 
                  action_type: 'review ' + props.actionType,
                  update_status: reviewStatus===2?0:2,
             }),
            },
          )
          .then((response) => {
              if (!response.ok) {
                throw Error(response.statusText);
              }
              return response.json()
            })
          .then(data=>{
            setReviewStatus(data.review_status);
          })
          .catch((error) => console.log(error));
    }
    
    return (
        <div>
            <Link className="quick-nav-link" to={`/review`}>Review</Link>
            {' > '}
            <Link className="quick-nav-link" to={`/review/project-${props.projectID}`}>Project-{props.projectID}</Link>
            {` > Text-${props.text_displayID}`}
            <span style={{marginLeft: '50px'}}>Review status: </span>
            {jobInfo.status===0 
            ? <span className="status-circle-red center-text"/>
            : jobInfo.status===2
            ? <span className="status-circle-green center-text"/>
            : <></>
            }
            <button type="button" 
                className="custom-button annotation-submit-button" 
                style={{marginLeft: '50px', marginTop: '0'}}
                onClick={updateReviewStatus}>
                {reviewStatus === 2
                ? 'Set Unreviewed'
                : 'Set Reviewed'}
            </button>    
            <div className='review-update-header-navigate'>
                {props.actionType === 'alignment'
                ? <div >
                    {props.prevID === -1
                    ? <></>
                    : <div className="nav-button">
                            <a href={`/review/${props.actionType}/project-${props.projectID}/text-${props.prevID}`}>
                            Prev
                            </a>
                        </div>
                    }
                    {props.nextID === -1
                    ? <></>
                    : <div className="nav-button">
                            <a href={`/review/${props.actionType}/project-${props.projectID}/text-${props.nextID}`}>
                            Next
                            </a>
                        </div>
                    }
                </div> 
                :<></>
                }     
            </div>      
        </div>
    );
}

export default ReviewHeader;