import React, { useState, useEffect } from 'react';
import useToken from '../useToken';

function RichNote(props) {
    const { token, removeToken, setToken } = useToken();

    const [richNote, setRichNote] = useState();
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

    useEffect(()=>{
        fetch(
            `/projects/${props.projectID}/text-${props.textID}/get_rich_note`,
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
          .then(data=>{
            setRichNote(data.content);
          })
          .catch((error) => console.log(error));
    }, [])

    const handleInputRichNote = event => {
        event.preventDefault();
        setRichNote(event.target.value);
      };

    const handleSubmitRichNote = event => {
      event.preventDefault();

      fetch(
        `/projects/${props.projectID}/text-${props.textID}/add_rich_note`,
        {
          credentials: 'same-origin',
          method: 'POST',
          headers: {
              'content-type': 'application/json',
              'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({ 
              content: richNote,
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
        })
      .then(()=>{
        setUpdateLog(prev => ({...prev, 
          showMsg: true, 
          msg: "Saved",
        }))
      })
      .catch((error) => console.log(error));
    }

    return(
      <>
        { props.mode === "edit"
        ? <>
            <form>
                <textarea type="text" className="rich-note-input" value={richNote} onChange={handleInputRichNote} />
                <button type="submit" className="custom-button annotation-submit-button seg-nav" onClick={handleSubmitRichNote}>
                    Save
                </button>
            </form>
            <div className="quick-nav ann-submit-bar">
                {updateLog.showMsg &&
                        <span className="seg-nav" style={{'fontSize': '18px', "paddingLeft":"20px"}}>
                        {updateLog.msg}
                        </span>
                    }
            </div>
        </>
        : <div>{richNote}</div>
        }
      </>  
    );
};

export default RichNote;