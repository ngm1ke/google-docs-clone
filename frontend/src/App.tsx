import './App.css';
import { Header } from './components/Header';
import { SocketProvider } from './contexts/socket.provider';
import { Editor } from './features/Editor';

function App() {
  return (
    <>
      <SocketProvider>
        <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-800">
          <Header />
          <Editor />
        </div>
      </SocketProvider>
    </>
  );
}

export default App;
