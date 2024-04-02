import React, { useState, useEffect } from 'react';
import InfoPanel from '../InfoPanel';
import AnnCard from '../AnnCard';
import TextAnnotate from '../TextAnnotate';
import useToken from '../useToken';

function ProjectsSpansPanel(props) {
  const { token, removeToken, setToken } = useToken();
  
  const [isLoadingIsAdmin, setAdminStatus] = useState(true);
  const [isLoadingTextInfo, setTextInfoStatus] = useState(true);
  const [isLoadingLabels, setLabelsStatus] = useState(true);
  const [isLoadingAnns, setAnnsStatus] = useState(true);

  const [textInfo,setTextInfo] = useState([]);
  const [hasAnnotation,setAnnBool] = useState(false);
  const [annotations,setAnn] = useState();
  const [textSegs,setTextSegs] = useState();
  const [segments,setSeg] = useState();
  const [currentSegIdx,setSegIdx] = useState(0);
  const [totalSegNum, setTotalSegNum] = useState(0);
  const [labels, setLabel] = useState({});
  const [finalAnn, setFinalAnn] = useState();
  const [submitAnnPanel, setSubmitPanel] = useState();
  const [noteMode, setNoteMode] = useState("view");

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

    // fetch annotations by segments
    fetch(`/projects/${props.projectID}/text-${props.textID}/segments`,
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
      let finalAnntmp = [];
      data.ann_seg.forEach((ann) => {
        if ("admin@admin" in ann) {
          finalAnntmp.push(ann["admin@admin"].spans);
        }
      })
      setFinalAnn(finalAnntmp);
      setSeg(data.segments);
      setTextSegs(data.text_seg);
      setTotalSegNum(data.text_seg.length);
    })
    .then(() => {
      setAnnsStatus(false);
    })
    .catch((error) => console.log(error));
  }, []); 

  useEffect(() => {
    if (!(isLoadingTextInfo ||
      isLoadingLabels ||
      isLoadingAnns)) {
          // fetch user permission
          fetch(`/projects/${props.projectID}/verifypermission`,
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
          if (data.isAdmin) {
            setNoteMode("edit");
            setSubmitPanel([
                <h4 key="submit_consensus">Submit Consensus</h4>,
                <TextAnnotate key={"annotate_box"}
                  isFinalAnn={true}
                  labels={labels} 
                  text={textSegs[currentSegIdx]}
                  annotations={[]}
                  projectID={props.projectID}
                  textID={props.textID}
                  segStart={segments[currentSegIdx]}
                  segEnd={segments[currentSegIdx+1]}
                  clearAfterSubmit={true}
                  updateJobSubmit={false}
                  updateAnn={updateFinalAnn}
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
  }, [isLoadingTextInfo, isLoadingLabels, isLoadingAnns, currentSegIdx]); 

  function updateFinalAnn (toUpdate, updatedAnns) {
    if(toUpdate) {
      let updatedAnnArr = JSON.parse(JSON.stringify(finalAnn));
      updatedAnnArr[currentSegIdx] = [] 
      updatedAnns.sort(function(a,b) {
        return a.start - b.start;
      });
      updatedAnns.forEach(ann => {
        updatedAnnArr[currentSegIdx].push([ann['start'], ann['end'],
                                     ann['tag'], ann['color']]);
      })
      setFinalAnn(updatedAnnArr);
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
      isLoadingLabels ||
      isLoadingAnns) {
          return (<h1>Loading...</h1>);
      }

  let adminAnn = [];
  let annList = [];
  // set admin annotation visualization block
  if (finalAnn.length === 0){
    adminAnn = [<AnnCard key={"admin@admin"} name={"Final Annotation"} 
                      text={textSegs[currentSegIdx]} 
                      spans={[]} />,
              <hr key="linebreak" style={{"height": "3px"}}/>]
  }
  else {
    adminAnn = [<AnnCard key={"admin@admin"} name={"Final Annotation"} 
                      text={textSegs[currentSegIdx]} 
                      spans={finalAnn[currentSegIdx]} />,
              <hr key="linebreak" style={{"height": "3px"}}/>]
  }

  // set annotators blocks
  if (!hasAnnotation) {
    annList = [<div className='text' key={"-1"}>No annotations</div>];
  }
  else{
    const cur_annotators = Object.keys(annotations[currentSegIdx]);
    // generate annotation for each annotator
    const ann_info = annotations[currentSegIdx];
    cur_annotators.forEach(att => {
      if (att !== "admin@admin") {
        annList.push(
          <AnnCard key={att} 
                   name={ann_info[att].name}
                   text={textSegs[currentSegIdx]}
                   spans={ann_info[att].spans} />
        );
      }
    })
  }

  // customize buttons
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

  return (
    <div>
      <div className="review-update-wrapper">
        <InfoPanel projectID={props.projectID} 
                   textID={props.textID} 
                   text={textInfo.full_text} 
                   labels={labels}
                   segStart={segments[currentSegIdx]}
                   segEnd={segments[currentSegIdx+1]}
                   mode={noteMode}
                   hasDiscussion={true}
        />
        <div className='ann-block ann-main-panel hide-scrollbar'>
          <div className="quick-nav quick-nav-text text">
            <div className="seg-nav">
              {leftbutton}
              <div style={{"padding": "8px"}}>{currentSegIdx+1}/{totalSegNum}</div>
              {rightbutton}
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

export default ProjectsSpansPanel;