import React, { useState, useEffect } from 'react';

function AlignAnnotateCard(props) {
    if (props.text === undefined || props.spans === undefined || props.id === undefined) return <></>

    // for each card, only one span can be selected
    const [selected, setSelected] = useState(-1);
    const [spanEle, setspanEle] = useState([]);

    useEffect(() => {
        setSelected(-1);
    }, [props.clearSig])
    
    useEffect(() => {
        let spanEleTmp = [];
        if (selected === -1) { // no span has been selected
            let startIndex = 0;
            if (props.spans.length === 0) {
                spanEleTmp = props.text
            }
            else{
                props.spans.forEach((s, idx) => {
                    if(s.start > startIndex) {
                    spanEleTmp.push(props.text.substring(startIndex, s.start));
                    }
                    spanEleTmp.push(
                    <button onClick={() => setSpanSelected(s.id)} className='button-no-styling align-annotate-select-button' key={s.id}><span style={{ "backgroundColor": s.color}}>
                        {props.text.substring(s.start, s.end)}
                        <span style={{ "backgroundColor": s.color }} className="label-in-text">{s.tag+" "}</span>
                    </span></button>);
                    startIndex = s.end;
                });
                if(startIndex < props.text.length){
                    spanEleTmp.push(props.text.substring(startIndex, props.text.length));
                }
            }
            setspanEle(prev => spanEleTmp);
        }
        else {
            let startIndex = 0;
            if (props.spans.length === 0) {
                spanEleTmp = props.text
            }
            else{
                props.spans.forEach((s, idx) => {
                    if(s.start > startIndex) {
                    spanEleTmp.push(props.text.substring(startIndex, s.start));
                    }
                    if (s.id === selected) {
                        spanEleTmp.push(
                            <button onClick={() => setSpanSelected(s.id)} className='button-no-styling align-annotate-select-button' key={s.id}>
                                <span style={{ "backgroundColor": s.color}} className='align-annotate-select-button-selected'>
                                {props.text.substring(s.start, s.end)}
                                <span style={{ "backgroundColor": s.color }} className="label-in-text align-annotate-select-button-selected">{s.tag+" "}</span>
                            </span></button>);
                    }
                    else{
                        spanEleTmp.push(
                            <span style={{ "backgroundColor": s.color}} key={idx}>
                                {props.text.substring(s.start, s.end)}
                                <span style={{ "backgroundColor": s.color }} className="label-in-text">{s.tag+" "}</span>
                            </span>);
                    }
                    startIndex = s.end;
                });
                if(startIndex < props.text.length){
                    spanEleTmp.push(props.text.substring(startIndex, props.text.length));
                }
                setspanEle(prev => spanEleTmp);
            }
        }
    }, [selected])

    const setSpanSelected = (id) => {
        if(selected === -1) {
            setSelected(id);
            props.handleSelection(props.id, id);
        }
        else{
            setSelected(-1);
            props.handleSelection(props.id, -1);
        }
    }

    return (
      <div className="ann-card align-annotate-card" style={{whiteSpace: "pre-wrap"}}>
        <div className="text" style={{"fontWeight": "bold"}}>{props.name}</div>
        <div><p>{spanEle}</p></div>
      </div>
    );
}

export default AlignAnnotateCard;