import ErrorMessageQueue from "./components/ErrorMessageQueue";
import Dashboard from "./Dashboard";
import LoginScreen from "./LoginScreen";

function App() {
  return (
    <div className="justify-center items-center h-screen">
      <div className="flex w-100 justify-center place-items-start">
        
      <h1 className="text-4xl font-bold text-center">hello.app</h1>
      </div>
      <ErrorMessageQueue />
      <LoginScreen />
      {/*
      <Dashboard />
*/}
      
    </div>
  );
}

export default App;