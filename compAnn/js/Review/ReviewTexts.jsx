import React, { useState, useEffect, useContext  } from 'react';
import { useParams, Link } from "react-router-dom";
import TextTable from '../TextTable';
import useToken from '../useToken';

function ReviewTexts(props) {
    const [texts, setTexts] = useState([]);
    const params = useParams();
    const { token, removeToken, setToken } = useToken();
    
    useEffect(() => {

        fetch(`/jobs/${params.projectID}/60`,
        {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
                action_type: 'review ' + params.type,
            }),
        },
        )
            .then((response) => {
                if (!response.ok) throw Error(response.statusText);
                return response.json();
            })
            .then((data) => {
                data.access_token && setToken(data.access_token);
                const textsWithLink = [];
                data.texts.forEach(text => {
                    textsWithLink.push({
                        'id': <Link to={`/review/${params.type}/project-${params.projectID}/text-${text._id}`} className="table-entry">
                                {text.display_id}
                              </Link>,
                        'text': <Link to={`/review/${params.type}/project-${params.projectID}/text-${text.id}`} className="table-entry">
                                    {text.partial_text}
                                </Link>,
                        'review_status': text.status==0
                                        ? <span className="status-circle-red center-text"/>
                                        : text.status==2
                                        ?<span className="status-circle-green center-text"/>
                                        : <></>
                    })
                });
                setTexts(textsWithLink);
            })
            .catch((error) => console.log(error));
    }, []);

    const columns = React.useMemo(
        () => [
            {
                Header: 'ID',
                accessor: 'id'
            },
            {
                Header: 'Text',
                accessor: 'text'
            },
            {
                Header: 'Review Status',
                accessor: 'review_status'
            },
        ]);

    return (
        <div className="wrapper entry-wrapper">  
            <div className="list-main hide-scrollbar">
                <div className='header-title'>
                    <h1>Review Texts</h1>
                </div>
                <TextTable columns={columns} data={texts} />
            </div>
        </div>
    );
}

export default ReviewTexts;