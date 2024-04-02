import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import TextTable from '../TextTable';
import useToken from '../useToken';

function AnnotateTexts(props) {
    const params = useParams();
    const { token, removeToken, setToken } = useToken();

    const [texts, setTexts] = useState([]);
    
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
                    action_type: 'annotate ' + params.type,
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
                        'id': <Link to={`/annotate/${params.type}/project-${params.projectID}/text-${text.id}`} className="table-entry">
                                {text.display_id}
                              </Link>,
                        'text': <Link to={`/annotate/${params.type}/project-${params.projectID}/text-${text.id}`} className="table-entry">
                                    {text.partial_text}
                                </Link>,
                        'status': 
                                    text.status==0
                                    ? <span className="status-circle-red center-text"/>
                                    : text.status==1
                                    ? <span className="status-circle-yellow center-text"/>
                                    : text.status==2
                                    ?<span className="status-circle-green center-text"/>
                                    : <></>
                    })
                });
                setTexts(textsWithLink);
            })
            .catch((error) => console.log(error));
        }
    ,[])
        

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
            Header: 'Annotate Status',
            accessor: 'status'
          }
        ]);

    return (
        <div className="wrapper entry-wrapper">  
            <div className="list-main hide-scrollbar">
                {params.type === 'spans'
                ? <>
                    <div className='header-title'>
                        <h1>Annotate Spans</h1>
                    </div>
                    <TextTable columns={columns} data={texts} />
                </>
                : params.type === 'alignment' ?
                <>
                    <div className='header-title'>
                        <h1>Annotate Alignment</h1>
                    </div>
                    <TextTable columns={columns} data={texts} />
                </>
                : <></>}
            </div>
        </div>
    );
}

export default AnnotateTexts;