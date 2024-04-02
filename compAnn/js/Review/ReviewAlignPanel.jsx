import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useToken from '../useToken';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import AnnotateAlignMain from '../Annotate/AnnotateAlignMain';
import ReviewAlignCompare from './ReviewAlignCompare';
import ReviewHeader from './ReviewHeader';


function ReviewAlignPanel(props) {
    const params = useParams();
    const { token, removeToken, setToken } = useToken();

    const [isLoadingTextList, setTextListStatus] = useState(true);

    const [allowRender, setAllowRender] = useState(false);
    const [textList,setTextList] = useState([]);
    const [curIndex, setcurIndex] = useState();
    const [reloadCompareSig, setReloadCompareSig] = useState(false);

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
                action_type: 'review alignment',
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
                        action_type: 'review alignment',
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
        }
    }, [allowRender]); 

    function signalReloadCompare() {
        setReloadCompareSig(prev => !prev);
    }

    if ( isLoadingTextList ) {
        return (<h1>Loading...</h1>);
    }

    return(
        <div className="review-wrapper">
            <div className='review-align-header'>
                <ReviewHeader projectID={params.projectID}
                            textID={params.textID}
                            text_displayID={textList[curIndex]['display_id']}
                            prevID={curIndex===0?-1:textList[curIndex-1]['id']}
                            nextID={curIndex===textList.length-1?-1:textList[curIndex+1]['id']}
                            actionType='alignment'
                            />
            </div>   
            <Tabs id="switch" 
                  defaultActiveKey="compare" 
                  className="mb-3" 
                  style={{'width': 'max-content'}}>
                <Tab eventKey="compare" title="Compare">
                    <ReviewAlignCompare projectID={params.projectID}
                        textID={params.textID}
                        reloadSig={reloadCompareSig}
                        noteMode="edit"
                        alignCompMode="view"/>
                </Tab>
                <Tab eventKey="update" title="Update" onClick={signalReloadCompare}>
                    <AnnotateAlignMain projectID={params.projectID}
                        textID={params.textID}
                        includeHeader={false}
                        wrapperClass='review-update-wrapper'
                        isAdmin={false}
                        actionType={'review alignment'}/>
                </Tab>  
            </Tabs>    
        </div>
    );
}

export default ReviewAlignPanel;