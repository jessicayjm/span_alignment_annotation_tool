import React, { useState, useEffect, useContext  } from 'react';
import { useParams, Link } from "react-router-dom";
import TextTable from '../TextTable';
import FileUploaderUni from '../FileUploaderUni';
import FileDownloader from '../FileDownloader';
import useToken from '../useToken';

function Texts(props) {
    const params = useParams();
    const { token, removeToken, setToken } = useToken();

    const [texts, setTexts] = useState([]);
    const [addDataButton, setAddDataButton] = useState();
    const [downloadDataButton, setDownloadDataButton] = useState();
    const [updatePreAgreementButton, setUpdatePreAgreementButton] = useState();
    const [updatePostAgreementButton, setUpdatePostAgreementButton] = useState();
    
    useEffect(() => {

        fetch(`/projects/${params.projectID}/60`,
            {
                credentials: 'same-origin',
                method: 'GET',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
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
                        'id': <Link to={`/home/project-${params.projectID}/text-${text.id}`} className="table-entry">
                                {text.display_id}
                              </Link>,
                        'text': <Link to={`/home/project-${params.projectID}/text-${text.id}`} className="table-entry">
                                    {text.partial_text}
                                </Link>,
                        'annotated_by': <span style={{color:'black'}}>{text.annotated_by}</span>,
                        'review_status': 
                                    text.review_status==-1 
                                    ? <span className="status-circle-grey center-text"/>
                                    : text.review_status==0 
                                    ? <span className="status-circle-yellow center-text"/>
                                    :<span className="status-circle-green center-text"/>
                                    ,
                        'finalized': text.finalized
                                    ? <span className="status-circle-green center-text"/>
                                    : <span className="status-circle-red center-text"  />
                                    ,
                    })
                });
                setTexts(textsWithLink);
            })
            .catch((error) => console.log(error));
        
        // set button permission
        // add data button
        fetch(`/projects/${params.projectID}/verifypermission`,
            {
                credentials: 'same-origin',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            },
            )
            .then((response) => {
                if (!response.ok) throw Error(response.statusText);
                return response.json();
            })
            .then((data) => {
                if (data.isAdmin) {
                    setAddDataButton(
                        <FileUploaderUni 
                            fileTypes={["json"]} 
                            url={`/projects/${params.projectID}/upload_data`} 
                            type="Data"/>
                    );
                }
                else {
                    setAddDataButton();
                };
            })
            .catch((error) => console.log(error));

        // set download data button
        fetch(`/projects/${params.projectID}/verifypermission`,
            {
                credentials: 'same-origin',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            },
            )
            .then((response) => {
                if (!response.ok) throw Error(response.statusText);
                return response.json();
            })
            .then((data) => {
                if (data.isAdmin) {
                    setDownloadDataButton(
                        <FileDownloader url={`/projects/${params.projectID}/download_data`}/>
                    );
                }
                else {
                    setDownloadDataButton();
                };
            })
            .catch((error) => console.log(error));

        // set update pre agreement button
        fetch(`/projects/${params.projectID}/verifypermission`,
            {
                credentials: 'same-origin',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            },
            )
            .then((response) => {
                if (!response.ok) throw Error(response.statusText);
                return response.json();
            })
            .then((data) => {
                if (data.isAdmin) {
                    setUpdatePreAgreementButton(
                        <button type="button" 
                                className="custom-button annotation-submit-button seg-nav" 
                                onClick={updatePreAgreement}>
                            Update pre agreement
                        </button>  
                    );
                    setUpdatePostAgreementButton(
                        <button type="button" 
                                className="custom-button annotation-submit-button seg-nav" 
                                onClick={updatePostAgreement}>
                            Update post agreement
                        </button>  
                    );
                }
                else {
                    setUpdatePreAgreementButton();
                };
            })
            .catch((error) => console.log(error));
    }, []);

    const updatePreAgreement = () => {
        fetch(`/projects/${params.projectID}/update_agreement`,
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify({
                    'isPre': true,
                }),
            },
        )
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
        })
        .catch((error) => console.log(error));
    }

    const updatePostAgreement = () => {
        fetch(`/projects/${params.projectID}/update_agreement`,
            {
                credentials: 'same-origin',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                body: JSON.stringify({
                    'isPre': false,
                }),
            },
        )
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
        })
        .catch((error) => console.log(error));
    }

    // const textsTable = [];
    // for (let i = 0; i < texts.length; i += 1) {
    //     textsTable.push(
    //             <tr key={texts[i].id}>
    //                 <td className='text'>
    //                     <Link to={`/home/project-${params.projectID}/text-${texts[i].id}`}>
    //                         {texts[i].id}
    //                     </Link>
    //                 </td>
    //                 <td className='alignLeft textRow text'>
    //                     <span>
    //                         <Link to={`/home/project-${params.projectID}/text-${texts[i].id}`}>
    //                             {texts[i].partial_text}
    //                         </Link>
    //                     </span>
    //                 </td>    
    //             </tr>
    //     );
    // }

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
            Header: 'Annotated By',
            accessor: 'annotated_by'
          },
          {
            Header: 'Review Status',
            accessor: 'review_status'
          },
          {
            Header: 'Finalized',
            accessor: 'finalized'
          }
        ]);

    return (
        <div className="wrapper entry-wrapper">  
            <div className="list-main hide-scrollbar">
                <div className='header-title'>
                    <h1>Texts</h1>
                </div>
                {addDataButton}
                {downloadDataButton}
                {updatePostAgreementButton}
                {updatePreAgreementButton}
                {/* <table className="textTable">
                    <thead className="textHead">
                        <tr className='text'>
                            <th>id</th>
                            <th>text</th>
                        </tr>
                    </thead>
                    <tbody>
                        {textsTable}
                    </tbody> 
                </table> */}
                <TextTable columns={columns} data={texts} />
            </div>
        </div>
    );
}

export default Texts;