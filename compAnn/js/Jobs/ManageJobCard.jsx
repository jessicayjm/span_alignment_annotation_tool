import React, { useState, usseEffect } from 'react';
import { useTable } from 'react-table'

function AnnotatorProgressTable({ columns, data }) {
    // Use the state and functions returned from useTable to build your UI
    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
    } = useTable({
      columns,
      data,
    })
  
    // Render the UI for your table
    return (
      <table {...getTableProps()} className='annotator-process-table'>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

function ManageJobCard(props) {
    // props.job: job_name, project_name, action_type, start_time, due_time, num_texts, progress_bar, status
    // props. content: entry for each annotator
    if (props.job === undefined) {
        return <></>;
    }

    const [toShow, setToShow] = useState(false);

    const handleClick = () => {
        setToShow((prev) => !prev);
    }

    const columns = React.useMemo(
        () => [
          {
            Header: '',
            accessor: 'index'
          },
          {
            Header: 'Annotator',
            accessor: 'username'
          },
          {
            Header: 'Progress',
            accessor: 'progress'
          }
        ]);
    
    let annotator_progress = [];
    props.job.annotator_progress.forEach(ann => {
        annotator_progress.push({
            'index':<span style={{opacity: 0.8}}>{ann.display_id}</span>,
            'username': <span style={{opacity: 0.8}}>{ann.username}</span>,
            'progress': <div style={{textAlign:'right', width:'100%'}}>
                            <div className="progress" style={{'--percent': ann.progress}}></div>
                            <div className="progress-text">
                                {ann.finished}/{ann.total_texts} ({ann.progress})
                            </div>
                        </div>
        });
    });

    // css referred: https://codepen.io/FlorinPop17/pen/dyPvNKK
    return(
        <div className="manage-job-card">
            <div className="job-name">
                <h3>{props.job.job_name}</h3>
                <p>{props.job.project_name}</p>
            </div>
            <div className="job-title">
                <div className="progress-container">
                    <div className="progress" style={{'--percent': props.job.progress}}></div>
                    <div className="progress-text">
                        {props.job.finished}/{props.job.total_texts} ({props.job.progress})
                    </div>
                    <div style={{float:"right"}}>
                        {props.job.main_status==0
                        ? <span className="status-circle-grey center-text"/>
                        : props.job.main_status==1
                        ? <span className="status-circle-yellow center-text"/>
                        : props.job.main_status==2
                        ? <span className="status-circle-green center-text"/>
                        : props.job.main_status==3
                        ? <span className="status-circle-red center-text"/>
                        : <></>}
                    </div>
                </div>
                <div className="job-info"><b>Task Type: </b>{props.job.action_type}</div>
                <div className="job-info"><b>Start Time: </b>{props.job.start_time}</div>
                <div className="job-info"><b>Due Time: </b>{props.job.due_time}</div>
                <div className="job-info"><b>Number of Texts: </b>{props.job.distinct_texts}</div>
                <div className="job-info"><b>Number of Annotators: </b>{props.job.num_annotators}</div>
                {toShow 
                ?<>
                    <AnnotatorProgressTable columns={columns} data={annotator_progress}/>
                    <button className="job-manage-more-btn" onClick={handleClick}>Less</button>
                </>
                :<button className="job-manage-more-btn" onClick={handleClick}>More</button>}    
            </div>
        </div>
    );

};

export default ManageJobCard;