import React, { useState, useEffect } from 'react';

import InfoPanel from '../InfoPanel';
import useToken from '../useToken';
import AlignmentCompCard from './AlignmentCompCard';


function ReviewAlignCompare(props) {
    const { token, removeToken, setToken } = useToken();

    const [isLoadingTextInfo, setTextInfoStatus] = useState(true);
    const [isLoadingLabels, setLabelsStatus] = useState(true);
    const [isLoadingAlignments, setAlignmentStatus] = useState(true);

    const [textInfo,setTextInfo] = useState([]);
    const [labels, setLabel] = useState({});
    const [alignments, setAlignments] = useState([]);

    useEffect(() => {
        // fetch text info
        fetch(`/projects/${props.projectID}/text-${props.textID}/info`,
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
            setTextInfo(data.text);
        })
        .then(() => {
          setTextInfoStatus(false);
        })
        .catch((error) => console.log(error));
    
        // fetch labels
        fetch(`/projects/${props.projectID}/labels-info`,
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
          setLabel(data.labels);
        })
        .then(() => {
          setLabelsStatus(false);
        })
        .catch((error) => console.log(error));
      }, []); 

    useEffect(() => {
        // fetch alignments
        fetch(`/projects/${props.projectID}/text-${props.textID}/annotations/all_alignments`,
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
            setAlignments(data.alignments);
        })
        .then(() => {
          setAlignmentStatus(false);
        })
        .catch((error) => console.log(error));
    }, [props.reloadSig])


    if (isLoadingTextInfo ||
        isLoadingLabels ||
        isLoadingAlignments) {
        return (<h1>Loading...</h1>);
    }

    return (
        <div className="review-update-wrapper" >
            <InfoPanel projectID={props.projectID} 
                   textID={props.textID} 
                   text={textInfo.full_text} 
                   labels={labels}
                   segStart={0}
                   segEnd={textInfo.full_text.length}
                   mode={props.noteMode}
                   hasDiscussion={true}
            />
            <div className='review-compare-main-panel hide-scrollbar'>
                {alignments.length === 0
                ? <div style={{'padding':'10px'}}>No contents</div>
                : <>{alignments.map((alignment, idx) => (
                    <AlignmentCompCard key={idx}
                                       projectID={props.projectID}
                                       textID={props.textID}
                                       alignment={alignment} 
                                       mode={props.alignCompMode}
                                       setReloadSig={props.setReloadSig}
                                       /> 
                  ))}</>
                } 
            </div>
        </div>
    );
}

export default ReviewAlignCompare;