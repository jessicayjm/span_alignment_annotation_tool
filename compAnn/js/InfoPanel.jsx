import React from 'react';
import ShowNHide from './ShowNHide';
import NotePanel from './NotePanel/NotePanel';

function InfoPanel(props) {
    // TODO: add text info into the panel
    // props: text info, text, labels

    let labelList = [];
    const labelKeys = Object.keys(props.labels)
    labelKeys.forEach(label => {
        labelList.push(
            <li key={label}><span style={{ "backgroundColor": props.labels[label]['color'] }}>{label}</span></li>
        );
    });
    // return (
    //     <div className='ann-block ann-info-panel text'>
    //         <div className="info-text-fixed">
    //             <h4>Full Text</h4>
    //             <div className="full-text-box text-scroll" style={{whiteSpace: "pre-wrap"}}>
    //                 <p>
    //                     {props.text}
    //                 </p>
    //             </div>
    //         </div>
    //         <div className="info-label-fixed">
    //             <h4>Labels</h4>
    //             <div className="label-box text-scroll">
    //                 <ul>
    //                     {labelList}
    //                 </ul>
    //             </div>
    //         </div>
    //     </div>
    // );
    const full_text_context = 
            <div className="info-text-fixed">
                <div className="full-text-box text-scroll" style={{whiteSpace: "pre-wrap"}}>
                    <p>
                        {props.text}
                    </p>
                </div>
            </div>;
    const labels_content = 
            <div className="info-label-fixed">
                <div className="label-box text-scroll">
                    <ul>
                        {labelList}
                    </ul>
                </div>
            </div>;

    return (
        <div className='ann-info-panel text hide-scrollbar'>
                <ShowNHide title="Full Text" content={full_text_context}/>
                <ShowNHide title="Labels" content={labels_content}/>
                <ShowNHide title="Notes" content={<NotePanel 
                                                    projectID={props.projectID} 
                                                    textID={props.textID}
                                                    segStart={props.segStart}
                                                    segEnd={props.segEnd}
                                                    mode={props.mode}
                                                    hasDiscussion={props.hasDiscussion}/>}
                                                    />
        </div>
    );
}

export default InfoPanel;