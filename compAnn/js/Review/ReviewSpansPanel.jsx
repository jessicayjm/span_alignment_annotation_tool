import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import InfoPanel from '../InfoPanel';
import AnnCard from '../AnnCard';
import TextAnnotate from '../TextAnnotate';
import ReviewHeader from './ReviewHeader';
import useToken from '../useToken';
import { decodeToken } from "react-jwt";

function ReviewSpansPanel(props) {
  const params = useParams();
  const { token, removeToken, setToken } = useToken();
  const tokenInfo = decodeToken(token);
  
  const [isLoadingIsAdmin, setAdminStatus] = useState(true);
  const [isLoadingTextInfo, setTextInfoStatus] = useState(true);
  const [isLoadingTextList, setTextListStatus] = useState(true);
  const [isLoadingLabels, setLabelsStatus] = useState(true);
  const [isLoadingAnns, setAnnsStatus] = useState(true);

  const [textInfo,setTextInfo] = useState([]);
  const [textList,setTextList] = useState([]);

  const [hasAnnotation,setAnnBool] = useState(false);
  const [annotations,setAnn] = useState();

  const [textSegs,setTextSegs] = useState();
  const [segments,setSeg] = useState();
  const [currentSegIdx,setSegIdx] = useState(0);
  const [totalSegNum, setTotalSegNum] = useState(0);
  const [labels, setLabel] = useState({});

  const [userAnn, setUserAnn] = useState();

  const [curIndex, setcurIndex] = useState();
  const [totalNum, setTotalNum] = useState();
  const [submitAnnPanel, setSubmitPanel] = useState();

  useEffect(() => {
    // fetch text info
    fetch(`/projects/${params.projectID}/text-${params.textID}/info`,
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
    
    // fetch text list
    fetch(`/jobs/${params.projectID}/10`,
        {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
                action_type: 'review spans',
            }),
        },
    )
    .then((response) => {
        if (!response.ok) throw Error(response.statusText);
        return response.json();
    })
    .then((data) => {
        setTextList(data.texts);
        for(let i=0;i<data.texts.length;i+=1) {
          if(data.texts[i]['id']==params.textID){
            setcurIndex(i);
            break;
          }
        }
        setTotalNum(data.texts.length);
    })
    .then(() => {
      setTextListStatus(false);
    })
    .catch((error) => console.log(error));

    // fetch labels
    fetch(`/projects/${params.projectID}/labels-info`,
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
    // fetch annotations by segments
    fetch(`/projects/${params.projectID}/text-${params.textID}/segments`,
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
      setAnnBool(data.annotated);
      setAnn(data.ann_seg);
      let userAnntmp = [];
      data.ann_seg.forEach((ann) => {
        if (tokenInfo.sub in ann) {
          userAnntmp.push(ann[tokenInfo.sub].spans);
        }
      })
      setUserAnn(userAnntmp);
      setSeg(data.segments);
      setTextSegs(data.text_seg);
      setTotalSegNum(data.text_seg.length);
    })
    .then(() => {
      setAnnsStatus(false);
    })
    .catch((error) => console.log(error));
  }, [userAnn])

  useEffect(() => {
    if (!(isLoadingTextInfo ||
      isLoadingTextList ||
      isLoadingLabels ||
      isLoadingAnns)) {
          // fetch user permission
          fetch(`/jobs/${params.projectID}/text-${params.textID}/check_review_spans_job`,
          {
            credentials: 'same-origin',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        },
        )
        .then((response) => {
          if (!response.ok) throw Error(response.statusText);
          return response.json();
        })
        .then((data) => {
          if (data.userHasJob) {
            setSubmitPanel([
                <h4 key="update_annotation">Update Annotation</h4>,
                <TextAnnotate key={"annotate_box"}
                  isFinalAnn={false}
                  labels={labels} 
                  text={textSegs[currentSegIdx]}
                  annotations={[]}
                  projectID={params.projectID}
                  textID={params.textID}
                  segStart={segments[currentSegIdx]}
                  segEnd={segments[currentSegIdx+1]}
                  clearAfterSubmit={true}
                  updateJobSubmit={false}
                  updateAnn={updateUserAnn}
                  />]);
          }
          else {
            setSubmitPanel(<></>)
          };
        })
        .then(() => {
          setAdminStatus(false);
        })
        .catch((error) => console.log(error));
              }
  }, [isLoadingTextInfo, isLoadingTextList, isLoadingLabels, isLoadingAnns, currentSegIdx]); 


  function updateUserAnn (toUpdate, updatedAnns) {
    if(toUpdate) {
      let updatedAnnArr = JSON.parse(JSON.stringify(userAnn));
      updatedAnnArr[currentSegIdx] = [] 
      updatedAnns.sort(function(a,b) {
        return a.start - b.start;
      });
      updatedAnns.forEach(ann => {
        updatedAnnArr[currentSegIdx].push([ann['start'], ann['end'],
                                     ann['tag'], ann['color']]);
      })
      setUserAnn(updatedAnnArr);
    }
  }

  function handleLeft() {
    if (currentSegIdx > 0) {
      setSegIdx(prev => prev - 1)
    }
  }

  function handleRight() {
    if (currentSegIdx < totalSegNum - 1) {
      setSegIdx(prev => prev + 1)
    }
  }

  if (isLoadingIsAdmin ||
      isLoadingTextInfo ||
      isLoadingTextList ||
      isLoadingLabels ||
      isLoadingAnns) {
          return (<h1>Loading...</h1>);
      }

  let adminAnn = [];
  let annList = [];

  // set annotators blocks
  if (!hasAnnotation) {
    annList = [<div className='text' key={"-1"}>No annotations</div>];
    adminAnn = [<AnnCard key={"admin@admin"} name={"Final Annotation"} 
                  text={textSegs[currentSegIdx]} 
                  spans={[]} />,
          <hr key="linebreak" style={{"height": "3px"}}/>]
  }
  else{
    const cur_annotators = Object.keys(annotations[currentSegIdx]);
    // generate annotation for each annotator
    const ann_info = annotations[currentSegIdx];
    cur_annotators.forEach(att => {
      if (att === "admin@admin"){
        adminAnn = [<AnnCard key={"admin@admin"} name={"Final Annotation"} 
                  text={textSegs[currentSegIdx]} 
                  spans={ann_info[att].spans} />,
          <hr key="linebreak" style={{"height": "3px"}}/>]
      }
      else if (att === tokenInfo.sub) {
        annList.push(
            <AnnCard key={att} name={ann_info[att].name} 
                      text={textSegs[currentSegIdx]} 
                      spans={userAnn[currentSegIdx]}/>
            );
      }
      else {
        annList.push(
          <AnnCard key={att} 
                   name={ann_info[att].name}
                   text={textSegs[currentSegIdx]}
                   spans={ann_info[att].spans} />
        );
      }
    })
    if (adminAnn.length == 0) {
      adminAnn = [<AnnCard key={"admin@admin"} name={"Final Annotation"} 
                  text={textSegs[currentSegIdx]} 
                  spans={[]} />,
          <hr key="linebreak" style={{"height": "3px"}}/>]
    }
  }

  // customize buttons
  let prevbutton;
  if (curIndex === 0) {
    prevbutton = <></>;
  }
  else {
    prevbutton = <div className="nav-button">
                    <a href={`/review/spans/project-${params.projectID}/text-${textList[curIndex-1]['id']}`}>
                      Prev
                    </a>
                  </div>
  }

  let leftbutton;
  if (currentSegIdx === 0) {
    leftbutton = <></>;
  }
  else {
    leftbutton = <button className="custom-button nav-button" onClick={() => handleLeft()}>
                    <div className="button-arrow button-arrow-left"></div>
                  </button>
  }

  let rightbutton;
  if (currentSegIdx === totalSegNum-1) {
    rightbutton = <></>;
  }
  else {
    rightbutton = <button className="custom-button nav-button" onClick={() => handleRight()}>
                  <div className="button-arrow button-arrow-right"></div>
                </button>
  }

  let nextbutton;
  if (curIndex === totalNum-1) {
    nextbutton = <></>;
  }
  else {
    nextbutton = <div className="nav-button">
                    <a href={`/review/spans/project-${params.projectID}/text-${textList[curIndex+1]['id']}`}>
                      Next
                    </a>
                  </div>
  }


  return (
    <div>
      <div className="ann-wrapper">
        <InfoPanel projectID={params.projectID} 
                   textID={params.textID} 
                   text={textInfo.full_text} 
                   labels={labels}
                   segStart={segments[currentSegIdx]}
                   segEnd={segments[currentSegIdx+1]}
                   mode="edit"
                   hasDiscussion={true}/>
        <div className='ann-block ann-main-panel hide-scrollbar'>
          <div className="quick-nav quick-nav-text text">
            <div>
            <ReviewHeader projectID={params.projectID}
                          textID={params.textID}
                          text_displayID={textList[curIndex]['display_id']}
                          actionType='spans'/>
            </div >
            <div className="seg-nav">
              {prevbutton}
              {leftbutton}
              <div style={{"padding": "8px"}}>{currentSegIdx+1}/{totalSegNum}</div>
              {rightbutton}
              {nextbutton}
            </div>   
          </div>
          <div>
            {adminAnn}
            {annList}
            {submitAnnPanel}
          </div>   
        </div>
      </div>
    </div>
  );
}

export default ReviewSpansPanel;