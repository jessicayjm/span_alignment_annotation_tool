import React, { useState } from 'react';
import useToken from '../useToken';

function AlignmentCard(props) {
    //props: name, quote, note
    if (props.alignment === undefined) return <></>
    const { token, removeToken, setToken } = useToken();

    const handleBubbleMenu = (() => {
        fetch(
            `/projects/${props.projectID}/text-${props.textID}/annotations/delete_alignment`,
            {
              credentials: 'same-origin',
              method: 'POST',
              headers: {
                  'content-type': 'application/json',
                  'Authorization': 'Bearer ' + token,
              },
              body: JSON.stringify({ 
                  id: props.id,
             }),
            },
          )
          .then((response) => {
              if (!response.ok) {
                props.deleteAlignment(false, props.id);
                throw Error(response.statusText);
              }
            })
          .then(()=>{
            props.deleteAlignment(true, props.id);
          })
          .catch((error) => console.log(error));
    });

    return(
        <div className='note-card'>
            <div className='bubble-grid'>
                <div className='chat-bubble'>
                    <p className="alignment-text-pair">
                        <span style={{ "backgroundColor": props.alignment.target_color }}>
                            {props.alignment.target_span}
                            <span style={{ "backgroundColor": props.alignment.target_color }} 
                                className="label-in-text">{props.alignment.target_label}
                                </span>
                        </span>
                    </p>
                    <hr className="alignment-linebreak"/>
                    <p className="alignment-text-pair">
                        <span style={{ "backgroundColor": props.alignment.observer_color }}>
                            {props.alignment.observer_span}
                            <span style={{ "backgroundColor": props.alignment.observer_color }} 
                                className="label-in-text">{props.alignment.observer_label}
                                </span>
                        </span>
                    </p>
                </div>
                <div className='chat-delete'>
                    <button type="button" 
                            className="btn-close delete-button" 
                            aria-label="Close"
                            onClick={handleBubbleMenu}/>
                </div>
            </div>
            
        </div>
    );
};

export default AlignmentCard;