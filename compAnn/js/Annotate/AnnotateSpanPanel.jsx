import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AnnCard from '../AnnCard';
import NotePanel from '../NotePanel/NotePanel';
import TextAnnotate from '../TextAnnotate';
import useToken from '../useToken';
import AnnotateHeader from './AnnotateHeader';

// Component for Annotate page that shows all the annotation jobs
function AnnotateSpanPanel(props) {
    const params = useParams();
    const { token, removeToken, setToken } = useToken();

    const [allowRender, setAllowRender] = useState(false);
    const [renderHeader, setRenderHeader] = useState(false);
    const [isLoadingTextInfo, setTextInfoStatus] = useState(true);
    const [isLoadingLabels, setLabelsStatus] = useState(true);
    const [isLoadingAnns, setAnnsStatus] = useState(true);
    const [isLoadingTextList, setTextListStatus] = useState(true);

    const [mode, setMode] = useState('annotate');
    const [textInfo,setTextInfo] = useState([]);
    const [textList,setTextList] = useState([]);
    const [curIndex, setcurIndex] = useState();
    const [labels, setLabel] = useState({});
    const [annotations, setAnnotations] = useState([]);
    const [annotationsView, setAnnotationsView] = useState([]);
    

    useEffect(() => {
        // check if the page is valid to render
        fetch(`/jobs/${params.projectID}/text-${params.textID}/check_valid_rendering`,
            {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
                action_type: 'annotate spans',
                is_admin: false,
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
                        action_type: 'annotate spans',
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
        
            // fetch annotations
            fetch(`/projects/${params.projectID}/text-${params.textID}/annotations`,
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
                let annotationView_tmp = [];
                data.annotations.forEach(ann => {
                    annotationView_tmp.push([ann.start, ann.end, ann.tag, ann.color]);
                });
                setAnnotations(data.annotations);
                setAnnotationsView(annotationView_tmp);
            })
            .then(() => {
            setAnnsStatus(false);
            })
            .catch((error) => console.log(error));
        }
    }, [allowRender]); 

    function updateFinalAnn (toUpdate, updatedAnns) {
        if(toUpdate) {
            // update the view mode array
            let annotationView_tmp = [];
            updatedAnns.forEach(ann => {
                annotationView_tmp.push([ann.start, ann.end, ann.tag, ann.color]);
            });
            setAnnotations(updatedAnns);
            setAnnotationsView(annotationView_tmp);
            setRenderHeader(prev => !prev);
        }
        
    }

    function handleChangeMode() {
        if(mode==='annotate') {setMode('view')}
        else {setMode('annotate')}
    }

    if (isLoadingTextInfo ||
        isLoadingLabels ||
        isLoadingAnns ||
        isLoadingTextList
        ) {
            return (<h1>Loading...</h1>);
        }
    
    if (allowRender) {
        return (
            <div className="annotate-wrapper">
                <div className='annotate-side-panel hide-scrollbar'>
                    <NotePanel 
                        projectID={params.projectID} 
                        textID={params.textID}
                        segStart={0}
                        segEnd={textInfo.full_text.length}
                        mode="edit"
                        hasDiscussion={false}/>
                </div>
                <div className='annotate-main-panel'>
                    <AnnotateHeader type='spans'
                                    projectID={params.projectID} 
                                    textID={params.textID} 
                                    text_displayID={textList[curIndex]['display_id']}
                                    prevID={curIndex===0?-1:textList[curIndex-1]['id']}
                                    nextID={curIndex===textList.length-1?-1:textList[curIndex+1]['id']}
                                    renderHeader={renderHeader}
                                    showSetComplareButton={false}
                                    action_type='annotate spans'/>
                    <button type="button" 
                        className="custom-button annotation-submit-button" 
                        onClick={handleChangeMode}>
                    {mode === 'view'
                    ? 'To Annotate Mode'
                    : 'To View Mode'}
                    </button> 
                    
                    {mode === 'annotate'
                    ? <>
                    <TextAnnotate 
                        style={{'overflow-y': 'auto'}}
                        isFinalAnn={false}
                        labels={labels} 
                        text={textInfo.full_text}
                        annotations={annotations}
                        projectID={params.projectID}
                        textID={params.textID}
                        segStart={0}
                        segEnd={textInfo.full_text.length}
                        clearAfterSubmit={false}
                        updateJobSubmit={true}
                        updateAnn={updateFinalAnn}
                        />  
                        </>
                    : <AnnCard name={''} 
                            text={textInfo.full_text} 
                            spans={annotationsView}
                            style={{'overflow-y': 'auto'}}
                        />}
                </div>
            </div>
        );
    }
    else {return <h1>Not allowed to enter this page</h1>}
}

export default AnnotateSpanPanel;