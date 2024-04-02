import React, { useState, useEffect } from 'react';
import NoteCard from './NoteCard';
import Quote from './Quote';
import useToken from '../useToken';


function QuickNote(props) {
    // props: projectID, textID, segStart, segEnd, isPrivate
    if (props.projectID === undefined ||
        props.textID === undefined ||
        props.segStart === undefined ||
        props.segEnd === undefined || 
        props.isPrivate === undefined) return <></>
    const { token, removeToken, setToken } = useToken();

    const [quickNote, setQuickNote] = useState(props.notes); 
    const [allQuickNote, setAllQuickNote] = useState({});// {id:{name:, note_id:, quote_ids:, quotes:, note:, allow_delete:}}
    const [allQuickNoteNum, setAllQuickNoteNum] = useState(0);
    const [quotes, setQuotes] = useState({});
    const [quoteNum, setQuoteNum] = useState(0); // this will only increase for the use of specify id
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
      fetch(
        `/projects/${props.projectID}/text-${props.textID}/get_quick_note`,
        {
          credentials: 'same-origin',
          method: 'POST',
          headers: {
              'content-type': 'application/json',
              'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({ 
              seg_start: props.segStart,
              seg_end: props.segEnd,
              isPrivate: props.isPrivate,
         }),
        },
      )
      .then((response) => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.json();
        })
      .then((data)=>{
        setAllQuickNote(data.notes);
      })
      .catch((error) => console.log(error));
    }, [props.segStart, props.segEnd]);

    const handleInputQuickNote = event => {
        event.preventDefault();
        setQuickNote(event.target.value);
      };

    const handleSubmitQuickNote = event => {
      event.preventDefault();

      fetch(
        `/projects/${props.projectID}/text-${props.textID}/add_quick_note`,
        {
          credentials: 'same-origin',
          method: 'POST',
          headers: {
              'content-type': 'application/json',
              'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({ 
            refer_start: props.segStart,
            refer_end: props.segEnd,
            content: quickNote,
            isPrivate: props.isPrivate,
            quotes: Object.values(quotes),
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
      .then((data)=>{
        setUpdateLog(prev => ({...prev, 
          showMsg: true, 
          msg: "Submitted",
        }))
        setAllQuickNote(prev => ({
          ...prev,
          [allQuickNoteNum]: {
            name: data.username,
            note_id: data.note_id,
            quote_ids: data.quote_ids,
            quotes: data.quotes,
            note: data.content,
            allow_delete: data.allow_delete
          }
        }));
        setQuotes({});
        setQuickNote(prev=>'');
        setAllQuickNoteNum(prev => prev+1);
      })
      .catch((error) => console.log(error));
    }

    function deleteQuickNote (toUpdate, id) {
      if(toUpdate) {
        const tmpNotes = {...allQuickNote};
        delete tmpNotes[id];
        setAllQuickNote(prev => tmpNotes);
      }
    }

    const handleGetQuote = event => {
        event.preventDefault();
        const text = window.getSelection().toString();
        setQuotes(prev => ({
            ...prev,
            [quoteNum]: text
        }));
        setQuoteNum(prev => prev+1);
      }

    function handleDeleteQuote(id) {
        const tmpQuotes = {...quotes};
        delete tmpQuotes[id];
        setQuotes(prev => tmpQuotes);
    }
    
    return(
        <>
            <div className='chat-panel text-scroll hide-scrollbar'>
              {Object.entries(allQuickNote).map( ([id, content]) => 
                  <NoteCard 
                    key={id} 
                    id={id}
                    projectID = {props.projectID}
                    textID = {props.textID} 
                    isPrivate={props.isPrivate} 
                    note={content} 
                    deleteQuickNote={deleteQuickNote}/>)}
            </div>
              {Object.entries(quotes).map( ([id, quote]) => 
                  <Quote key={id} id={id} quote={quote} handleDeleteQuote={handleDeleteQuote}/>)}
            { props.mode === "edit"
              ?<form>
                  <textarea type="text" className="quick-note-input" value={quickNote} onChange={handleInputQuickNote} />
                  <button type="submit" className="custom-button annotation-submit-button " onClick={handleGetQuote}>
                      Quote
                  </button>
                  <button type="submit" className="custom-button annotation-submit-button seg-nav" onClick={handleSubmitQuickNote}>
                      Submit
                  </button>
                  <div className="quick-nav ann-submit-bar">
                      {updateLog.showMsg &&
                              <span className="seg-nav" style={{'fontSize': '18px', "paddingLeft":"20px"}}>
                              {updateLog.msg}
                              </span>
                          }
                  </div>
              </form>
              : <></>
            }
        </>  
    );
};

export default QuickNote;