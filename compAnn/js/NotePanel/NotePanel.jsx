import React, { useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import QuickNote from './QuickNote';
import RichNote from './RichNote';

function NotePanel(props) {
    if (props.mode === undefined || props.hasDiscussion === undefined) {
        return <></>;
    }

    return(
    <div className="note-panel">
      {props.hasDiscussion  
      ? <Tabs id="notes" defaultActiveKey="discussion" className="mb-3" justify>
          <Tab eventKey="discussion" title="Discussion">
              <div className='note-subpanel'>
                <QuickNote projectID={props.projectID}
                          textID={props.textID} 
                          segStart={props.segStart} 
                          segEnd={props.segEnd} 
                          isPrivate={false}
                          mode={props.mode}/>
              </div> 
            </Tab> 

          <Tab eventKey="quick_note" title="Quick Note">
            <div className='note-subpanel'>
              <QuickNote projectID={props.projectID} 
                          textID={props.textID} 
                          segStart={props.segStart} 
                          segEnd={props.segEnd} 
                          isPrivate={true}
                          mode={props.mode}/>
            </div>
          </Tab>
          <Tab eventKey="rich_note" title="Rich Note">
            <div className='note-subpanel'>
              <RichNote projectID={props.projectID} textID={props.textID} mode={props.mode}/>
            </div>
          </Tab>
        </Tabs>
        : <Tabs id="notes" defaultActiveKey="quick_note" className="mb-3" justify>
          <Tab eventKey="quick_note" title="Quick Note">
            <div className='note-subpanel'>
              <QuickNote projectID={props.projectID} 
                          textID={props.textID} 
                          segStart={props.segStart} 
                          segEnd={props.segEnd} 
                          isPrivate={true}
                          mode={props.mode}/>
            </div>
          </Tab>
          <Tab eventKey="rich_note" title="Rich Note">
            <div className='note-subpanel'>
              <RichNote projectID={props.projectID} textID={props.textID} mode={props.mode}/>
            </div>
          </Tab>
        </Tabs>}
    </div>
    );

};

export default NotePanel;