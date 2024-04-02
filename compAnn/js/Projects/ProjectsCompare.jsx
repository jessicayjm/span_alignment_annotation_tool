import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useToken from '../useToken';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import CompareHeader from './CompareHeader';
import ProjectsSpansPanel from './ProjectsSpansPanel';
import AnnotateAlignMain from '../Annotate/AnnotateAlignMain';
import ReviewAlignCompare from '../Review/ReviewAlignCompare';


function ProjectsCompare(props) {
    const params = useParams();
    const { token, removeToken, setToken } = useToken();

    const [isLoadingIsAdmin, setAdminStatus] = useState(true);
    const [isLoadingTextList, setTextListStatus] = useState(true);

    const [textList,setTextList] = useState([]);
    const [curIndex, setcurIndex] = useState();
    const [reloadSig, setReloadSig] = useState(false);
    const [noteMode, setNoteMode] = useState("view");
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => { 
        // fetch text list
        fetch(`/projects/${params.projectID}/10`,
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
    }, []); 


    useEffect(() => {
        if (!(isLoadingTextList)) {
            // fetch user permission
            fetch(`/projects/${params.projectID}/verifypermission`,
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
                setIsAdmin(true);
              }
            })
            .then(() => {
              setAdminStatus(false);
            })
            .catch((error) => console.log(error));
        }
      }, [isLoadingTextList]); 

    function signalReload() {
        setReloadSig(prev => !prev);
    }

    if ( isLoadingIsAdmin || isLoadingTextList ) {
        return (<h1>Loading...</h1>);
    }

    return(
        <div className="review-wrapper">
            <CompareHeader projectID={params.projectID}
                           textID={params.textID}
                           text_displayID={textList[curIndex]['display_id']}
                           prevID={curIndex===0?-1:textList[curIndex-1]['id']}
                           nextID={curIndex===textList.length-1?-1:textList[curIndex+1]['id']}/>
            <Tabs id="switch" 
                  defaultActiveKey="spans" 
                  className="mb-3" 
                  style={{'width': 'max-content'}}>
                <Tab eventKey="spans" title="Spans">
                    <ProjectsSpansPanel projectID={params.projectID}
                        textID={params.textID}/>
                </Tab>
                <Tab eventKey="alignment" title="Alignment" onClick={signalReload}>
                    <ReviewAlignCompare projectID={params.projectID}
                        textID={params.textID}
                        reloadSig={reloadSig}
                        setReloadSig={setReloadSig}
                        noteMode={noteMode}
                        alignCompMode={isAdmin?"edit":"view"}/>
                </Tab>
                {isAdmin
                ? <Tab eventKey="finalize" title="Finalize Alignment" onClick={signalReload}>
                    <AnnotateAlignMain projectID={params.projectID}
                        textID={params.textID}
                        includeHeader={false}
                        wrapperClass='review-update-wrapper'
                        isAdmin={true}
                        actionType={''}
                        reloadSig={reloadSig}/>
                </Tab>
                : <></>
                }
            </Tabs>    
        </div>
    );
}

export default ProjectsCompare;