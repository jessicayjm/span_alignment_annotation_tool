import React, {useState, useEffect} from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useToken from '../useToken';

function CompareHeader(props) {
    if (props.projectID === undefined ||
        props.text_displayID === undefined ||
        props.textID === undefined) return <></>
    
    const { token, removeToken, setToken } = useToken();
    const [reviewStatus, setReviewStatus] = useState();
    const [isFinalized, setIsFinalized] = useState();

    useEffect(() => {
        fetch(`/projects/${props.projectID}/text-${props.textID}/get_review_status`,
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
            setReviewStatus(data.review_status);
        })
        .catch((error) => console.log(error));

        fetch(`/projects/${props.projectID}/text-${props.textID}/get_finalized_status`,
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
            setIsFinalized(data.isFinalized);
        })
        .catch((error) => console.log(error));
    }, [isFinalized]);

    const updateReviewStatus = () => {
        fetch(
            `/projects/${props.projectID}/text-${props.textID}/set_review_status`,
            {
              credentials: 'same-origin',
              method: 'POST',
              headers: {
                  'content-type': 'application/json',
                  'Authorization': 'Bearer ' + token,
              },
              body: JSON.stringify({ 
                  review_status: (reviewStatus + 2) % 3 - 1,
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

    const updateFinalizedStatus = () => {
        fetch(
            `/projects/${props.projectID}/text-${props.textID}/set_finalized_status`,
            {
              credentials: 'same-origin',
              method: 'POST',
              headers: {
                  'content-type': 'application/json',
                  'Authorization': 'Bearer ' + token,
              },
              body: JSON.stringify({ 
                    isFinalized: !isFinalized,
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
            setIsFinalized(data.isFinalized);
          })
          .catch((error) => console.log(error));
    }
    
    return (
        <div className='projects-compare-header'>
            <Link className="quick-nav-link" to={`/home`}>Home</Link>
            {' > '}
            <Link className="quick-nav-link" to={`/home/project-${props.projectID}`}>Project-{props.projectID}</Link>
            {` > Text-${props.text_displayID}`}
            <span style={{marginLeft: '50px'}}>Review status: </span>
            <button className="button-no-styling" onClick={updateReviewStatus}>
                {reviewStatus==-1 
                ? <span className="status-circle-grey center-text"/>
                : reviewStatus==0 
                ? <span className="status-circle-yellow center-text"/>
                : reviewStatus==1
                ?<span className="status-circle-green center-text"/>
                :<></>
                }
            </button>
            <span style={{marginLeft: '10px'}}>Finalized: </span>
            <button className="button-no-styling" onClick={updateFinalizedStatus}>
                {isFinalized==0 
                ? <span className="status-circle-red center-text"/>
                :isFinalized==1
                ? <span className="status-circle-green center-text"/>
                : <></>
                }
            </button>
            <div className='review-update-header-navigate'>
                {props.prevID === -1
                ? <></>
                : <div className="nav-button">
                        <a href={`/home/project-${props.projectID}/text-${props.prevID}`}>
                        Prev
                        </a>
                    </div>
                }
                {props.nextID === -1
                ? <></>
                : <div className="nav-button">
                        <a href={`/home/project-${props.projectID}/text-${props.nextID}`}>
                        Next
                        </a>
                    </div>
                }
            </div>
        </div >
    );
}

export default CompareHeader;