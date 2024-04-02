import React from 'react';


function Quote(props) {
    if(props.quote === undefined) return <></>

    return(
        <p className='quote-text'>
            <span className='quote'>"</span>
            {props.quote}
            <span className='quote'>"</span>
            <button 
                type="button" 
                className="btn-close" 
                style={{display:'inline-block'}} 
                aria-label="Close"
                onClick={() => props.handleDeleteQuote(props.id)}
            />
        </p>
    );
};

export default Quote;