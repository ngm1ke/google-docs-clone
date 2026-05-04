import './App.css';
import { Header } from './components/Header';
import { Editor } from './features/Editor';

function App() {
  return (
    <>
      <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-800">
        <Header />
        <Editor />
      </div>
    </>
  );
}

export default App;
