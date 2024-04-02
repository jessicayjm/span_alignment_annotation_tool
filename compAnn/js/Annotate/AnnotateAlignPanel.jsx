import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useToken from '../useToken';

import AnnotateAlignMain from './AnnotateAlignMain';


function AnnotateAlignPanel(props) {
    const params = useParams();
    const { token, removeToken, setToken } = useToken();

    return(
        <AnnotateAlignMain projectID={params.projectID}
                           textID={params.textID}
                           includeHeader={true}
                           wrapperClass='annotate-wrapper'
                           isAdmin={false}
                           actionType={'annotate alignment'}/>
    );
}

export default AnnotateAlignPanel;