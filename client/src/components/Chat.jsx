import Input from "./Input"
import Messages from "./Messages"
import Cam from "../img/cam.png";
import Add from "../img/add.png";
import More from "../img/more.png";




const Chat = () => {
  return (
    <div className="chat">
    <div className="chatInfo">
      <span>username</span>
      <div className="chatIcons">
        <img src={Cam} alt="" />
        <img src={Add} alt="" />
        <img src={More} alt="" />
      </div>
    </div>
    <Messages />
    <Input/>
  </div>
  )
}

export default Chat