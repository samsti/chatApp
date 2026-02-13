import ShellLayout from "./components/ShellLayout";
import AuthSection from "./components/AuthPanel";
import ChatSection from "./components/ChatSection";

export default function App() {
    return (
        <ShellLayout
            top={<AuthSection apiBaseUrl="http://localhost:5000/Chat"/>}
            bottom={<ChatSection  apiBaseUrl={"http://localhost:5000"}/>}
        />
    );
}
