import React, { useState} from 'react';
import { useParams } from 'react-router-dom';
import useToken from '../useToken';
import { BiPlus, BiMinus } from "react-icons/bi";
import Checkbox from '@mui/material/Checkbox';
import { purple } from '@mui/material/colors';

function AlignmentCompCard(props) {
    if (props.alignment === undefined || props.mode === undefined) {
        return <></>;
    }
    const params = useParams();
    const { token, removeToken, setToken } = useToken();
    
    const [toShow, setToShow] = useState(true);

    const handleClick = () => {
        setToShow((prev) => !prev);
    }

    const handleCheck = (e, alignment_id, checked) => {
        fetch(
            `/projects/${props.projectID}/text-${props.textID}/annotations/checkbox_modify_final_alignment`,
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
            },
                body: JSON.stringify({ 
                    alignment_id: alignment_id,
                    operation: checked ? "delete" : "add",
                }),
            },
        )
        .then((response) => {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        })
        .then(data => {
            props.setReloadSig(prev=>!prev);
        })
        .catch((error) => console.log(error));
        
    }

    return (
        <>
        <div className="review-alignment-card">
            <div className="review-alignment-label-color-bar" style={{'--color': props.alignment.target_color}}>
            </div>
            <div className="review-alignment-target-span">
                <span style={{ "backgroundColor": props.alignment.target_color}}>
                    {props.alignment.target_span}
                    <span style={{ "backgroundColor": props.alignment.target_color }}
                        className="label-in-text">{props.alignment.target_label}
                    </span>
                </span>
                {toShow
                ?<button className='review-alignment-card-shownhide-button button-no-styling' 
                         onClick={handleClick}>
                            <BiMinus/>
                </button>
                :<button className='review-alignment-card-shownhide-button button-no-styling'
                         onClick={handleClick}>
                            <BiPlus/>
                </button>}
                <span style={{'float': 'right'}}>
                    ({props.alignment.observers.length})
                </span>
            </div>
        </div>
        {toShow
        ?<div className='review-alignment-card-observers-panel'>
            {props.alignment.observers.map((observer, idx) => (
                <div key={idx} className='review-alignment-card-observers-panel-entry'>
                    <div className="review-alignment-card-observers-panel-name">{
                        observer.annotator_id === 1
                        ? <span style={{'fontWeight':'bold'}}>{observer.username}</span>
                        : props.mode==="view"
                            ? <span>{observer.username}</span>
                            : <>
                                <Checkbox
                                    checked={observer.checked}
                                    onChange={e=>handleCheck(e, observer.alignment_id, observer.checked)}
                                    size="small"
                                    inputProps={{ 'aria-label': 'controlled' }}
                                    sx={{
                                        '&.Mui-checked': {
                                        color: purple[200],
                                        }
                                    }}
                                />
                                <span>{observer.username}</span>
                            </>
                    }</div>
                    <div className="review-alignment-card-observers-panel-span">
                        <span style={{ "backgroundColor": observer.observer_color}}>
                            {observer.observer_span}
                            <span style={{ "backgroundColor": observer.observer_color }}
                                className="label-in-text">{observer.observer_label}
                            </span>
                        </span>
                    </div>
                </div>
            ))}
        </div>
        :<></>
        }
        </>
    );
}

export default AlignmentCompCard;