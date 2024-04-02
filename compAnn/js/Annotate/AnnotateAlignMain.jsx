import React, { useState, useEffect } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import AlignAnnotateCard from './AlignAnnotateCard';
import AnnCard from '../AnnCard';
import AnnotateHeader from './AnnotateHeader';
import NotePanel from '../NotePanel/NotePanel';
import useToken from '../useToken';
import AlignmentCard from './AlignmentCard';

function AnnotateAlignMain(props) {
    const { token, removeToken, setToken } = useToken();

    const [allowRender, setAllowRender] = useState(false);
    const [isLoadingAnns, setAnnsStatus] = useState(true);
    const [renderHeader, setRenderHeader] = useState(false);
    const [isLoadingTextList, setTextListStatus] = useState(true);
    const [isLoadingAlignments, setAlignmentStatus] = useState(true);

    const [mode, setMode] = useState('annotate');
    const [textList,setTextList] = useState([]);
    const [curIndex, setcurIndex] = useState();
    const [targetText, setTargetText] = useState();
    const [targetAnnotations, setTargetAnnotations] = useState([]);
    const [observerText, setObserverText] = useState();
    const [observerAnnotations, setObserverAnnotations] = useState([]);
    const [targetAnnotationsView, setTargetAnnotationsView] = useState([]);
    const [observerAnnotationsView, setObserverAnnotationsView] = useState([]);
    const [alignments, setAlignments] = useState({});

    const [selectedTarget, setSelectedTarget] = useState(-1);
    const [selectedObserver, setSelectedObserver] = useState(-1);
    const [clearSig, setclearSig] = useState(false);

    const [updateLog, setUpdateLog] = useState({showMsg: false,
        msg: "",});
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setUpdateLog(prev => ({...prev, 
            showMsg: false, 
            }));
        }, 5000);
        return () => clearTimeout(timer);
        }, [updateLog]);



    useEffect(() => {
        // check if the page is valid to render
        fetch(`/jobs/${props.projectID}/text-${props.textID}/check_valid_rendering`,
            {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
                action_type: props.actionType,
                is_admin: props.isAdmin,
            }),
        },
        )
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            else {setAllowRender(true)}
        })
        .catch((error) => console.log(error));
    }, [])


    useEffect(() => {
        if (allowRender) {
            if (props.includeHeader) {
                // fetch text list
                fetch(`/jobs/${props.projectID}/10`,
                    {
                        credentials: 'same-origin',
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json',
                            'Authorization': 'Bearer ' + token,
                        },
                        body: JSON.stringify({
                            action_type: 'annotate alignment',
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
                        if(data.texts[i]['id']==props.textID){
                            setcurIndex(i);
                            break;
                        }
                    }
                })
                .then(() => {
                    setTextListStatus(false);
                })
                .catch((error) => console.log(error));
            }

        
            // fetch annotations
            fetch(`/projects/${props.projectID}/text-${props.textID}/annotations/align-annotation`,
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
                setTargetText(data.target_text);
                setTargetAnnotations(data.target_annotations);
                setObserverText(data.observer_text);
                setObserverAnnotations(data.observer_annotations);

                let targetAnnotationView_tmp = [];
                data.target_annotations.forEach(ann => {
                    targetAnnotationView_tmp.push([ann.start, ann.end, ann.tag, ann.color]);
                });
                setTargetAnnotationsView(targetAnnotationView_tmp);

                let observerAnnotationView_tmp = [];
                data.observer_annotations.forEach(ann => {
                    observerAnnotationView_tmp.push([ann.start, ann.end, ann.tag, ann.color]);
                });
                setObserverAnnotationsView(observerAnnotationView_tmp);
            })
            .then(() => {
                setAnnsStatus(false);
            })
            .catch((error) => console.log(error));


            // fetch alignments
            fetch(
                `/projects/${props.projectID}/text-${props.textID}/annotations/alignments`,
                {
                  credentials: 'same-origin',
                  method: 'POST',
                  headers: {
                      'content-type': 'application/json',
                      'Authorization': 'Bearer ' + token,
                  },
                  body: JSON.stringify({
                    isAdmin: props.isAdmin,
                }),
                },
              )
              .then((response) => {
                if (!response.ok) throw Error(response.statusText);
                return response.json();
              })
              .then(data=>{
                setAlignments(data.alignments);
              })
              .then(() => {
                setAlignmentStatus(false);
              })
              .catch((error) => console.log(error));
        }
    }, [allowRender, props.reloadSig]); 

    function deleteAlignment (toUpdate, id) {
        if(toUpdate) {
          const tmpAlignments = {...alignments};
          delete tmpAlignments[id];
          setAlignments(prev => tmpAlignments);
        }
    }

    function handleChangeMode() {
        if(mode==='annotate') {setMode('view')}
        else {setMode('annotate')}
    }

    function handleSelection(id, ann_id) {
        if(id === 'target') {
            setSelectedTarget(ann_id);
        }
        else if(id === 'observer') {
            setSelectedObserver(ann_id);
        }
    }

    function handleAddAlignment() {
        // check if the selected target and observer are all non-empty
        if (selectedTarget !== -1 &&
            selectedObserver !== -1) {
                
            fetch(
                `/projects/${props.projectID}/text-${props.textID}/annotations/add_alignment`,
                {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify({ 
                    target_ann_id: selectedTarget,
                    observer_ann_id: selectedObserver,
                    isAdmin: props.isAdmin,
                }),
                },
            )
            .then((response) => {
                if (!response.ok) {
                    setUpdateLog(prev => ({...prev, 
                        showMsg: true, 
                        msg: "Error!",
                      }))
                      throw Error(response.statusText);
                }
                return response.json();
            })
            .then(data => {
                setAlignments(prev => ({
                    ...prev,
                    [data.id]: data.alignment
                  }));
                setUpdateLog(prev => ({...prev, 
                showMsg: true, 
                msg: "Added",
                }))
                // clear the highlighted spans
                setSelectedTarget(-1);
                setSelectedObserver(-1);
                setclearSig(prev => !prev);
            })
            .catch((error) => console.log(error));
        }
        else{
            setUpdateLog(prev => ({...prev, 
                showMsg: true, 
                msg: "Invalid pair!",
              }))
        }
    }

    if (props.includeHeader &&(isLoadingAnns || 
        isLoadingTextList ||
        isLoadingAlignments) ||
        !props.includeHeader && (isLoadingAnns || 
        isLoadingAlignments)) {
        return (<h1>Loading...</h1>);
    }

    return (
        <div className={props.wrapperClass}>
            <div className='annotate-side-panel hide-scrollbar'>
                <Tabs id="sidepanel" defaultActiveKey="alignments" className="mb-3" justify>
                    <Tab eventKey="alignments" title="Alignments">
                    {Object.entries(alignments).map( ([id, alignment]) => 
                        <AlignmentCard 
                            key={id} 
                            id={id}
                            projectID={props.projectID}
                            textID={props.textID}
                            alignment={alignment} 
                            deleteAlignment={deleteAlignment}/>)}
                    </Tab> 
                    <Tab eventKey="notes" title="Notes">
                        <NotePanel 
                            projectID={props.projectID} 
                            textID={props.textID}
                            segStart={0}
                            segEnd={targetText.length+observerText.length+2}
                            mode="edit"
                            hasDiscussion={false}/>
                    </Tab> 
                </Tabs>
            </div>
            <div className='annotate-main-panel'>
                {props.includeHeader
                ?
                <AnnotateHeader type='alignment'
                                projectID={props.projectID} 
                                textID={props.textID} 
                                text_displayID={textList[curIndex]['display_id']}
                                prevID={curIndex===0?-1:textList[curIndex-1]['id']}
                                nextID={curIndex===textList.length-1?-1:textList[curIndex+1]['id']}
                                renderHeader={renderHeader}
                                showSetComplareButton={true}
                                action_type='annotate alignment'/>
                :<></>
                }
                <button type="button" 
                    className="custom-button annotation-submit-button" 
                    onClick={handleChangeMode}>
                    {mode === 'view'
                    ? 'To Annotate Mode'
                    : 'To View Mode'}
                </button> 
                <button type="button" 
                    className="custom-button annotation-submit-button" 
                    style={{'float': 'right'}}
                    onClick={handleAddAlignment}>
                    Add
                </button> 
                {updateLog.showMsg &&
                            <span className="seg-nav" style={{'fontSize': '18px', "marginTop":"20px"}}>
                            {updateLog.msg}
                            </span>
                        }
                {mode === 'annotate'
                ?<>
                    <AlignAnnotateCard id={'target'}
                                        text={targetText}
                                        spans={targetAnnotations}
                                        clearSig={clearSig}
                                        handleSelection={handleSelection}
                                        />
                    <AlignAnnotateCard id={'observer'}
                                        text={observerText}
                                        spans={observerAnnotations}
                                        clearSig={clearSig}
                                        handleSelection={handleSelection}
                                        />
                </>
                : <>
                    <AnnCard name={''} 
                            text={targetText} 
                            spans={targetAnnotationsView}
                            style={{'overflow-y': 'auto'}}
                        />
                    <AnnCard name={''} 
                        text={observerText} 
                        spans={observerAnnotationsView}
                        style={{'overflow-y': 'auto'}}
                    />
                </>
                }
            </div>
        </div>
    );
}

export default AnnotateAlignMain;