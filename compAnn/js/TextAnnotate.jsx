import React, { useState, useEffect } from 'react';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import {TextAnnotator} from 'react-text-annotate'
import useToken from './useToken';

function TextAnnotate(props) {
    // props: labels, text, projectID, textID, segStart,
    // segEnd, updateAnn(func)
    if (props.labels === undefined ||
        props.text === undefined) {
        return <></>;
    }

    if (Object.keys(props.labels).length === 0) {
        return <></>;
    }

    
    const [buttonState, setButtonState] = useState(Object.keys(props.labels)[0]);
    const [annotations, setAnnotations] = useState([...props.annotations].sort((a, b) => a[0] - b[0]));
    const [updateLog, setUpdateLog] = useState({showMsg: false,
                                                msg: "",});
    const { token, removeToken, setToken } = useToken();
    
    const handleChange = (value) => {
        setAnnotations(value);
    };

    const handleTagChange = (value) => {
        setButtonState(value);
    };

    useEffect(() => {
      const timer = setTimeout(() => {
        setUpdateLog(prev => ({...prev, 
          showMsg: false, 
        }));
      }, 5000);
      return () => clearTimeout(timer);
    }, [updateLog]);

    const handleAnnSubmit = () => {
      fetch(
        `/projects/${props.projectID}/text-${props.textID}/annotation-submit`,
        {
          credentials: 'same-origin',
          method: 'POST',
          headers: {
              'content-type': 'application/json',
              'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({ 
              isFinalAnn: props.isFinalAnn, // final annotation always has annotator_id=1
              seg_start: props.segStart,
              seg_end: props.segEnd,
              annotations: annotations,
              updateJobSubmit: props.updateJobSubmit,
         }),
        },
      )
      .then((response) => {
          if (!response.ok) {
            setUpdateLog(prev => ({...prev, 
              showMsg: true, 
              msg: "Error!",
            }))
            const ann_tmp = [...annotations].sort((a, b) => a[0] - b[0])
            props.updateAnn(false, ann_tmp);
            throw Error(response.statusText);
          }
        })
      .then(()=>{
        setUpdateLog(prev => ({...prev, 
          showMsg: true, 
          msg: "Updated",
        }))
        const ann_tmp = [...annotations].sort((a, b) => a[0] - b[0])
        props.updateAnn(true, ann_tmp);
        if(props.clearAfterSubmit){setAnnotations([])};
        
      })
      .catch((error) => console.log(error));
    }

    // For reference, tracking the highlight spans
    // const handleMouseUp=(e)=>{
    //     // adopted from 
    //     // https://medium.com/unprogrammer/a-simple-text-highlighting-component-with-react-e9f7a3c1791a
    //     e.preventDefault();
    //     const selectionObj = (window.getSelection && window.getSelection());
    //     const selection = selectionObj.toString();
    //     const anchorNode = selectionObj.anchorNode;
    //     const focusNode = selectionObj.focusNode;
    //     const anchorOffset = selectionObj.anchorOffset;
    //     const focusOffset = selectionObj.focusOffset;
    //     const position = anchorNode.compareDocumentPosition(focusNode);
    //     let forward = false;

    //     if (position === anchorNode.DOCUMENT_POSITION_FOLLOWING) {
    //         forward = true;
    //     } else if (position === 0) {
    //         forward = (focusOffset - anchorOffset) > 0;
    //     }

    //     let selectionStart = forward ? anchorOffset : focusOffset;

    //     if (forward) {
    //         if (anchorNode.parentNode.getAttribute('data-order')
    //             && anchorNode.parentNode.getAttribute('data-order') === 'middle') {
    //             selectionStart += this.state.selectionStart;
    //         }
    //         if (anchorNode.parentNode.getAttribute('data-order')
    //             && anchorNode.parentNode.getAttribute('data-order') === 'last') {
    //             selectionStart += this.state.selectionEnd;
    //         }
    //     } else {
    //         if (focusNode.parentNode.getAttribute('data-order')
    //             && focusNode.parentNode.getAttribute('data-order') === 'middle') {
    //             selectionStart += this.state.selectionStart;
    //         }
    //         if (focusNode.parentNode.getAttribute('data-order')
    //             && focusNode.parentNode.getAttribute('data-order') === 'last') {
    //             selectionStart += this.state.selectionEnd;
    //         }
    //     }

    //     const selectionEnd = selectionStart + selection.length;
    // }

    let labelList = [];
    const labelKeys = Object.keys(props.labels)
    labelKeys.forEach(label => {
        labelList.push(
            <Dropdown.Item key={label} eventKey={label}>{label}</Dropdown.Item>
        );
    });
    
    return (
        <div> 
            <div className='quick-nav ann-submit-bar'>
                  <DropdownButton id="dropdown-basic-button" 
                                  title={buttonState}
                                  onSelect={handleTagChange}
                                  className="drop-down-button">
                      {labelList}
                  </DropdownButton>
                  <button type="button" 
                          className="custom-button annotation-submit-button seg-nav" 
                          onClick={handleAnnSubmit}>
                      Submit
                  </button>  
              </div>
                {updateLog.showMsg &&
                <div className="quick-nav" style={{"marginRight":'10px', "marginBottom":'5px'}}>
                        <span className="seg-nav" style={{'fontSize': '18px', "paddingLeft":"20px"}}>
                        {updateLog.msg}
                        </span></div>
                    }
            <div className="ann-card text" style={{whiteSpace: "pre-wrap", "overflowY": "auto"}}>
                <TextAnnotator
                  key={"annotate-span"}
                  style={{"lineHeight": "2"}}
                  content={props.text}
                  value={annotations}
                  onChange={handleChange}
                  getSpan={span => ({
                    ...span,
                    tag: buttonState,
                    color: props.labels[buttonState]['color'],
                    tag_id: props.labels[buttonState]['id']
                  })}
                  renderMark={props => (
                    <mark
                      className='annotation-text-mark ann-card'
                      key={props.key}
                      onClick={() =>
                        props.onClick({
                          start: props.start,
                          end: props.end,
                          text: props.text,
                          tag: props.tag,
                          color: props.color,
                          tag_id: props.tag_id,
                        })
                      }
                    >
                      {props.content}
                      <span className='annotation-mark-span'>
                        {" "}
                        {props.tag}
                      </span>
                    </mark>
                  )}
                />
            </div>
        </div>
    );
}

export default TextAnnotate;