import React, { useState } from 'react';

function ShowNHide(props) {
    if (props.title === undefined || props.content === undefined) {
        return <></>;
    }

    const [toShow, setToShow] = useState(false);

    const handleClick = () => {
        setToShow((prev) => !prev);
    }

    return(
        <div>
            {toShow
                ? <>
                    <div className="inline">
                        <button className="custom-button nav-button" onClick={() => handleClick()}>
                            <div className="button-arrow-down expand-button"></div>
                        </button>
                        <h4 className="expand-title">{props.title}</h4>
                    </div>
                    <div className="expand-block">
                        {props.content}
                    </div>    
                  </>
                : <div className="inline">
                    <button className="custom-button nav-button" onClick={() => handleClick()}>
                        <div className="button-arrow-right expand-button"></div>
                    </button>
                    <h4 className="expand-title">{props.title}</h4>
                  </div>
            }
        </div>
    );

};

export default ShowNHide;