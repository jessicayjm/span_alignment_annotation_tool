import React, { useState } from 'react';
import useToken from '../useToken';

function NoteCard(props) {
    //props: name, quote, note
    if (props.note === undefined) return <></>
    const { token, removeToken, setToken } = useToken();

    const handleBubbleMenu = (() => {
        fetch(
            `/projects/${props.projectID}/text-${props.textID}/delete_quick_note`,
            {
              credentials: 'same-origin',
              method: 'POST',
              headers: {
                  'content-type': 'application/json',
                  'Authorization': 'Bearer ' + token,
              },
              body: JSON.stringify({ 
                  note_id: props.note.note_id,
                  quote_ids: props.note.quote_ids,
             }),
            },
          )
          .then((response) => {
              if (!response.ok) {
                props.deleteQuickNote(false, props.id);
                throw Error(response.statusText);
              }
            })
          .then(()=>{
            props.deleteQuickNote(true, props.id);
          })
          .catch((error) => console.log(error));
    });

    return(
        <div className='note-card'>
            { props.isPrivate ? <></>
            : <div className='chat-name'>{props.note.name}</div>
            }
            <div className='bubble-grid'>
                <div className='chat-bubble'>
                    {props.note.quotes.length !== 0 
                    ? <>
                        {props.note.quotes.map((quote, index) =>
                         <p className='quote-text' key={index}><span className='quote'>"</span>{quote}<span className='quote'>"</span></p>
                         )}
                        <hr key="linebreak" style={{"height": "1px"}}/>
                    </>
                    : <></>
                    }
                    {props.note.note}
                </div>
                {props.note.allow_delete
                ? <div className='chat-delete'>
                    <button type="button" 
                            className="btn-close delete-button" 
                            aria-label="Close"
                            onClick={handleBubbleMenu}/>
                </div>
                : <></>
                 }
            </div>
            
        </div>
    );
};

export default NoteCard;