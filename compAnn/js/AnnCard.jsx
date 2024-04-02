import React from 'react';

function AnnCard(props) {
    // props: text, spans [[start, end, label, color],[],...]
    if (props.text === undefined || props.spans === undefined) return <></>
    let startIndex = 0;
    let spanEle = [];
    const spans = [...props.spans].sort((a, b) => a[0] - b[0]);
    if (props.spans.length === 0) {
      spanEle = props.text
    }
    else{
      spans.forEach((s, idx) => {
        if(s[0] > startIndex) {
          spanEle.push(props.text.substring(startIndex, s[0]));
        }
        spanEle.push(
          <span style={{ "backgroundColor": s[3]}} key={idx}>
              {props.text.substring(s[0], s[1])}
              <span style={{ "backgroundColor": s[3] }} className="label-in-text">{s[2]+" "}</span>
          </span>);
        startIndex = s[1];
      });
      if(startIndex < props.text.length){
        spanEle.push(props.text.substring(startIndex, props.text.length));
      }
    }
    return (
      <div className="ann-card" style={{whiteSpace: "pre-wrap"}}>
        <div className="text" style={{"fontWeight": "bold"}}>{props.name}</div>
        <div><p>{spanEle}</p></div>
      </div>
    );
}

export default AnnCard;