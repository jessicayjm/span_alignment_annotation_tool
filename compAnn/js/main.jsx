import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import useToken from './useToken';
import Entry from './Entry';
import Home from './Projects/Home';
import Texts from './Projects/Texts';
import NotFound from './NotFound';
import ProjectsCompare from './Projects/ProjectsCompare';
import Layout from './Layout';
import Jobs from './Jobs/Jobs';
import MyJobs from './Jobs/MyJobs';
import ManageJobs from './Jobs/ManageJobs';
import Annotate from './Annotate/Annotate';
import AnnotateProj from './Annotate/AnnotateProj';
import AnnotateTexts from './Annotate/AnnotateTexts';
import AnnotateSpanPanel from './Annotate/AnnotateSpanPanel';
import AnnotateAlignPanel from './Annotate/AnnotateAlignPanel';
import Review from './Review/Review';
import ReviewProj from './Review/ReviewProj';
import ReviewTexts from './Review/ReviewTexts';
import ReviewSpansPanel from './Review/ReviewSpansPanel';
import ReviewAlignPanel from './Review/ReviewAlignPanel';


export default function App() {
  const { token, removeToken, setToken } = useToken();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="home" element={<Home />} />
          <Route path="home/project-:projectID" element={<Texts />}/>
          <Route path="home/project-:projectID/text-:textID" element={<ProjectsCompare />}/>
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/my_jobs" element={<MyJobs/>}/>
          <Route path="jobs/manage_jobs" element={<ManageJobs/>}/>
          <Route path="annotate" element={<Annotate />} />
          <Route path="annotate/:type/projects" element={<AnnotateProj />} />
          <Route path="annotate/:type/project-:projectID" element={<AnnotateTexts />} />
          <Route path="annotate/spans/project-:projectID/text-:textID" element={<AnnotateSpanPanel />} />
          <Route path="annotate/alignment/project-:projectID/text-:textID" element={<AnnotateAlignPanel />} />
          <Route path="review" element={<Review />} />
          <Route path="review/:type/projects" element={<ReviewProj />} />
          <Route path="review/:type/project-:projectID" element={<ReviewTexts />}/>
          <Route path="review/spans/project-:projectID/text-:textID" element={<ReviewSpansPanel />}/>
          <Route path="review/alignment/project-:projectID/text-:textID" element={<ReviewAlignPanel />}/>
          <Route path="*" element={<NotFound />}/>
        </Route>
        <Route path="/" element={<Entry />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.render(
  <App />,
  document.getElementById("root"),
);
