import { Routes, Route, Link } from "react-router-dom";
import MintTicket from "./components/MintTicket";
import Navbar from "./components/Navbar";
import { BrowserRouter } from 'react-router-dom';
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<MintTicket />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;