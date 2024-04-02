import React from 'react';
import Card from 'react-bootstrap/Card';

function Jobs(props) {
    return (
        <div className="wrapper entry-wrapper">
            <div className="list-main hide-scrollbar">
                <div className='header-title'>
                    <h1>Jobs</h1>
                </div>
                <Card className='jobs-card'>
                    <Card.Img variant="top" src='/static/images/earth_card.jpg' className='myjob-card-image' />
                    <Card.Body>
                        <Card.Title>My Jobs</Card.Title>
                        {/* <Card.Text>
                        Some quick example text to build on the card title and make up the
                        bulk of the card's content.
                        </Card.Text> */}
                        <a href='/jobs/my_jobs'>
                            <button className="custom-button annotation-submit-button">
                                    View My Jobs
                            </button>
                        </a>  
                    </Card.Body>
                </Card>
                <Card className='jobs-card'>
                    <Card.Img variant="top" src='/static/images/galaxy_card.jpg' className='manage-job-card-image' />
                    <Card.Body>
                        <Card.Title>Management</Card.Title>
                        {/* <Card.Text>
                        Some quick example text to build on the card title and make up the
                        bulk of the card's content.
                        </Card.Text> */}
                        <a href='/jobs/manage_jobs'>
                            <button className="custom-button annotation-submit-button">
                                    Manage Jobs
                            </button>
                        </a>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}

export default Jobs;