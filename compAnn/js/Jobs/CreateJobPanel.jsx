import React, { useState, useEffect } from 'react';

import Popup from 'reactjs-popup';
import Select from 'react-select';
import { BsFillPlusCircleFill } from "react-icons/bs";
import DateTimePicker from 'react-datetime-picker';
import { FileUploader } from "react-drag-drop-files";
import useToken from '../useToken';

function CreateJobPanel(props) {

    const { token, removeToken, setToken } = useToken();
    const [updateLog, setUpdateLog] = useState({showMsg: false,
        msg: "",});

    const [open, setOpen] = useState(false);
    const closePanel = () => {
        setUpdateLog(prev => ({...prev, 
            showMsg: false, 
            msg: "",
        }))
        setAnnotatorOptions([]);
        setAnnotatorOptionObject([]);
        setAnnotatorCount(0);
        changePageNum(1);
        setOpen(false);
    };
    const [pageNum, setPageNum] = useState(1);
    const changePageNum = (num) => setPageNum(num);


    const [user_projects, setUserProjects] = useState([]);
    const action_types = [
        { value: 'annotate spans', label: 'annotate spans' },
        { value: 'annotate alignment', label: 'annotate alignment' },
        { value: 'review spans', label: 'review spans' },
        { value: 'review alignment', label: 'review alignment' },
    ]
    const [annotatorOptions, setAnnotatorOptions] = useState([]);
    const [annotatorOptionObject, setAnnotatorOptionObject] = useState({});
    const [annotatorCount, setAnnotatorCount] = useState(0);

    // store form values
    const [jobName, setJobName] = useState();
    const [projectId, setProjectId] = useState();
    const [actionType, setActionType] = useState();
    const [dueTime, setDueTime] = useState(new Date());

    useEffect(() => {
        const timer = setTimeout(() => {
          setUpdateLog(prev => ({...prev, 
            showMsg: false, 
          }));
        }, 5000);
        return () => clearTimeout(timer);
      }, [updateLog]);

    const nextPage = event => {
        event.preventDefault();
        // check if all fields are filled  
        let job_name = event.target.form.job_name.value;
        let project_id = event.target.form.project_id.value;
        let action_type = event.target.form.action_type.value;
        let due_time = dueTime;
        if (job_name == '' || job_name == undefined ||
            project_id == '' || project_id == undefined ||
            action_type == '' || action_type == undefined ||
            due_time == '' || due_time == undefined) {
                setUpdateLog(prev => ({...prev, 
                    showMsg: true, 
                    msg: "Please fill out all empty fields.",
                  }))
            }
        else {
            // check if job name is valid
            fetch(
                `/jobs/check_job_name`,
                {
                  credentials: 'same-origin',
                  method: 'POST',
                  headers: {
                      'content-type': 'application/json',
                      'Authorization': 'Bearer ' + token,
                  },
                  body: JSON.stringify({ 
                    job_name: job_name,
                    project_id: project_id,
                 }),
                },
              )
              .then((response) => {
                  if (!response.ok) {
                    throw Error(response.statusText);
                  }
                  return response.json();
                })
              .then((data)=>{
                if (data.valid) {
                    setJobName(job_name);
                    setProjectId(project_id);
                    setActionType(action_type);
                    
                    const annotators = [];
                    data.annotators.forEach(ann => {
                        annotators.push({
                            'value': ann.id,
                            'label': ann.username + ', ' + ann.email
                        })
                    });
                    setAnnotatorOptions(annotators);
                    setAnnotatorOptionObject(prev => ({
                        ...prev,
                        [annotatorCount]: {
                            'annotators': annotators,
                            'files': []
                        }
                    }));
                    setAnnotatorCount(prev => prev + 1);
                    changePageNum(2);
                }
                else {
                    setUpdateLog(prev => ({...prev, 
                        showMsg: true, 
                        msg: "Job name has been used.",
                    }))
                }
              })
              .catch((error) => console.log(error));
        }
    }

    const prevPage = (event) => {
        event.preventDefault();
        setAnnotatorOptionObject({});
        changePageNum(1);
    }

    function handleCreateJobOpen() {
        setOpen(true);
        fetch(
            `/user_projects`,
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
              if (!response.ok) {
                throw Error(response.statusText);
              }
              return response.json()
            })
          .then(data=>{
            let user_projects_tmp = [];
            data.projects.forEach(user_proj => {
                user_projects_tmp.push({
                    'value': user_proj.id,
                    'label': user_proj.name
                });
            setUserProjects(user_projects_tmp);
            });
          })
          .catch((error) => console.log(error));
    }

    function deleteAnnotator(id) {
        const tmpAnns = {...annotatorOptionObject};
        delete tmpAnns[id];
        setAnnotatorOptionObject(prev => tmpAnns);
    }

    function addAnnotator(event) {
        event.preventDefault();
        setAnnotatorOptionObject(prev => ({
            ...prev,
            [annotatorCount]: {
                'annotators': annotatorOptions,
                'files': [],
            }
        }));
        setAnnotatorCount(prev => prev + 1);

    }

    function handleUploadData(files, id) {
        const tmpAnns = {...annotatorOptionObject};
        for (let i = 0; i < files.length; i++) {
            tmpAnns[id].files.push(files[i]);
        }
        setAnnotatorOptionObject(prev => tmpAnns);
    }

    function submitJobCreation(e) {
        const formData = new FormData();
        formData.append('job_name', jobName);
        formData.append('project_id', projectId);
        formData.append('action_type', actionType);
        formData.append('due_time', dueTime);
        
        let annotator_ids = '';
        // get annotator info and files (if is annotate job)
        // files array is expected to be empty if it is specified as a review job
        Object.entries(annotatorOptionObject).map( ([id, info]) => {
            const annotator_id = e.target.form['annotator'+id.toString()].value;
            annotator_ids += annotator_id + ' ';
            info.files.forEach(file => {
                formData.append(annotator_id, file);
            })
        })
        formData.append('annotator_ids', annotator_ids);

        fetch(
            `/jobs/create_jobs`,
            {
              credentials: 'same-origin',
              method: 'POST',
              headers: {
                  'Authorization': 'Bearer ' + token,
              },
              body: formData,
            },
          )
          .then((response) => {
              if (!response.ok) {
                // setUpdateLog(prev => ({...prev, 
                //   showMsg: true, 
                //   msg: "Error!",
                // }))
                throw Error(response.statusText);
              }
              props.setRerenderSignal(prev=>!prev);
            })
          .catch((error) => console.log(error));
    }

    return (
        <>
            <button className="custom-button annotation-submit-button" onClick={() => handleCreateJobOpen()}>
                Create Job 
            </button>
            <Popup open={open} closeOnDocumentClick onClose={closePanel}>
                <div className='create-job-panel hide-scrollbar'>
                    <button className='close-thik' onClick={closePanel}/>
                    <div className='create-job-panel-main'>
                        <h3>Create a New Job</h3>
                        { pageNum == 1 
                        ? <form>
                            <div className='input-entry'>
                                <label htmlFor="job_name">Job Name</label>
                                <br/>
                                <input className='job-name-input' 
                                       type="text" 
                                       name="job_name" 
                                       required/>
                            </div>
                            
                            <div className='input-entry'>
                                <label htmlFor="project_id">Project Name</label>
                                <br/>
                                <Select name="project_id" options={user_projects} />
                            </div>
                            
                            <div className='input-entry'>
                                <label htmlFor="action_type">Job Type</label>
                                <br/>
                                <Select name="action_type" options={action_types} />
                            </div>

                            <div className='input-entry'>
                                <label htmlFor="due_time">Due Time</label>
                                    <br/>
                                <DateTimePicker 
                                    onChange={setDueTime} 
                                    value={dueTime} 
                                    format='y-MM-dd h:mm:ss a'
                                    name="due_time"/>
                            </div>
                            
                            <div>
                                <button className="custom-button create-job-button" type="submit" onClick={nextPage}>Next</button>
                                <div className="quick-nav ann-submit-bar">
                                    {updateLog.showMsg &&
                                            <span className="seg-nav" 
                                            style={{'fontSize': '18px', "paddingLeft":"20px", "color": "white"}}>
                                            {updateLog.msg}
                                            </span>
                                        }
                                </div>
                            </div>
                        </form>   
                        : pageNum == 2
                        ? <form>
                            {Object.entries(annotatorOptionObject).map( ([id, info]) => 
                                <div key={id.toString()} className='input-entry'>
                                    <label htmlFor={id.toString()}>{'Annotator'}</label>
                                    <button className='close-thik job-create-delete-annotator' onClick={()=>deleteAnnotator(id)}/>
                                    <br/>
                                    <Select name={'annotator'+id.toString()} options={info.annotators} />
                                    { actionType === 'annotate spans'
                                    ?<>
                                        <div className='job-create-upload-file'>
                                            <FileUploader 
                                                multiple={true}
                                                handleChange={(file) => handleUploadData(file, id)}
                                                name="file"
                                                maxSize={50}
                                                types={['csv']}
                                            />
                                        </div> 
                                        {info.files.map((f, idx) => 
                                            (<p style={{color: "white"}} key={id.toString()+'-'+idx.toString()}>{f.name}</p>
                                        ))}
                                    </> 
                                    : <></>
                                    }
                                </div>
                            )}
                            <BsFillPlusCircleFill className='plus-icon' onClick={addAnnotator}/>

                            <div>
                                <button className="custom-button create-job-button" type="submit" onClick={submitJobCreation}>Submit</button>
                            </div>
                            <div>
                                <button className="custom-button create-job-button" type="submit" onClick={prevPage}>Back</button>
                            </div>
                        </form>  
                        : <></>
                        }           
                    </div>
                </div>
            </Popup>
        </>
    )
}

export default CreateJobPanel;