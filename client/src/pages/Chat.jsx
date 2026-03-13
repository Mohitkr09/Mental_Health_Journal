import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Mic, MicOff, Loader2, Volume2, Heart } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const moods = [
  { label: "😊", value: "happy" },
  { label: "😔", value: "sad" },
  { label: "😡", value: "angry" },
  { label: "😰", value: "anxious" },
  { label: "😴", value: "tired" },
];

const quickPrompts = [
  "I'm feeling stressed today",
  "I can't sleep well",
  "How can I relax?",
  "I feel anxious about work",
];

export default function Chat() {

const { theme } = useTheme()

const [mood,setMood]=useState("")
const [message,setMessage]=useState("")
const [chatHistory,setChatHistory]=useState([])
const [loading,setLoading]=useState(false)
const [recording,setRecording]=useState(false)
const [mediaRecorder,setMediaRecorder]=useState(null)
const [speakEnabled,setSpeakEnabled]=useState(false)

const chatContainerRef=useRef(null)

/* LOAD CHAT */

useEffect(()=>{
const saved=localStorage.getItem("mindcare_chat")
if(saved) setChatHistory(JSON.parse(saved))
},[])

useEffect(()=>{
localStorage.setItem("mindcare_chat",JSON.stringify(chatHistory))
},[chatHistory])

/* AUTO SCROLL */

useEffect(()=>{

const container=chatContainerRef.current
if(!container) return

container.scrollTop=container.scrollHeight

},[chatHistory,loading])

/* SEND MESSAGE */

const sendMessage=async(customMessage)=>{

const finalMessage=customMessage||message

if(!finalMessage.trim()) return

const userMessage={
sender:"user",
text:finalMessage,
time:Date.now()
}

const updated=[...chatHistory,userMessage]

setChatHistory(updated)
setLoading(true)

try{

const res=await fetch("http://localhost:5000/api/chat",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${localStorage.getItem("token")}`
},
body:JSON.stringify({message:finalMessage,mood})
})

const data=await res.json()

const aiReply=data.reply||"I'm here for you 💙"

const aiMessage={
sender:"ai",
text:aiReply,
time:Date.now()
}

setChatHistory([...updated,aiMessage])

if(speakEnabled){

const utter=new SpeechSynthesisUtterance(aiReply)
window.speechSynthesis.speak(utter)

}

}catch{

setChatHistory([
...updated,
{sender:"ai",text:"⚠️ AI unavailable"}
])

}

setMessage("")
setLoading(false)

}

/* VOICE RECORD */

const startRecording=async()=>{

try{

const stream=await navigator.mediaDevices.getUserMedia({audio:true})
const recorder=new MediaRecorder(stream)

const chunks=[]

recorder.ondataavailable=(e)=>{
if(e.data.size>0) chunks.push(e.data)
}

recorder.onstop=()=>{

setRecording(false)

const audioBlob=new Blob(chunks,{type:"audio/webm"})

sendMessage("Voice message received")

}

recorder.start()

setMediaRecorder(recorder)
setRecording(true)

}catch{
alert("Microphone permission needed")
}

}

const stopRecording=()=>{

if(mediaRecorder && mediaRecorder.state!=="inactive")
mediaRecorder.stop()

}

/* MESSAGE COMPONENT */

const ChatMessage=({sender,text,time})=>{

const isUser=sender==="user"

return(

<motion.div
initial={{opacity:0,y:10}}
animate={{opacity:1,y:0}}
className={`flex ${isUser?"justify-end":"justify-start"} mb-4`}
>

<div className="flex gap-2 items-end">

{!isUser && (
<div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-500 text-white">
<Bot size={16}/>
</div>
)}

<div
className={`max-w-[70%] p-3 rounded-2xl shadow-md ${
isUser
?"bg-purple-600 text-white"
:theme==="dark"
?"bg-gray-700 text-gray-100"
:"bg-white"
}`}
>

<p className="text-sm">{text}</p>

<div className="flex justify-between mt-1">

<span className="text-[10px] opacity-60">
{new Date(time).toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit"
})}
</span>

{!isUser && (
<button className="opacity-60 hover:opacity-100">
<Heart size={12}/>
</button>
)}

</div>

</div>

{isUser && (
<div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300">
<User size={16}/>
</div>
)}

</div>

</motion.div>

)

}

/* TYPING */

const TypingIndicator=()=>(
<div className="flex gap-1 p-3">
<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
</div>
)

/* UI */

return(

<div className={`flex flex-col h-screen p-4 ${
theme==="dark"
?"bg-gray-900 text-white"
:"bg-gradient-to-b from-blue-50 to-white"
}`}>

<div className="flex justify-center">

<div className="w-full max-w-3xl flex flex-col">

{/* MOOD SELECTOR */}

<div className="flex justify-center gap-4 mb-4">

{moods.map(m=>(
<motion.button
whileTap={{scale:0.9}}
key={m.value}
onClick={()=>setMood(m.value)}
className={`text-2xl p-2 rounded-full ${
mood===m.value?"ring-4 ring-purple-500":""
}`}
>
{m.label}
</motion.button>
))}

</div>

{/* QUICK PROMPTS */}

<div className="flex flex-wrap gap-2 mb-3 justify-center">

{quickPrompts.map((p,i)=>(
<motion.button
whileHover={{scale:1.05}}
key={i}
onClick={()=>sendMessage(p)}
className="text-xs px-3 py-1 rounded-full bg-purple-100 dark:bg-gray-700"
>
{p}
</motion.button>
))}

</div>

{/* CHAT WINDOW */}

<div
ref={chatContainerRef}
className="flex-1 overflow-y-auto p-4 rounded-xl border bg-white dark:bg-gray-800"
>

{chatHistory.length===0 &&(

<div className="text-center opacity-60 mt-20">

<Bot size={40} className="mx-auto mb-2"/>

Start chatting with your AI companion

</div>

)}

<AnimatePresence>

{chatHistory.map((msg,i)=>(
<ChatMessage key={i} {...msg}/>
))}

</AnimatePresence>

{loading && <TypingIndicator/>}

</div>

{/* INPUT BAR */}

<div className="flex gap-2 mt-4 items-center">

<button
onClick={recording?stopRecording:startRecording}
className={`p-3 rounded-full ${
recording?"bg-red-500":"bg-gray-300"
}`}
>
{recording?<MicOff size={18}/>:<Mic size={18}/>}
</button>

<input
value={message}
onChange={e=>setMessage(e.target.value)}
onKeyDown={(e)=>e.key==="Enter" && sendMessage()}
placeholder="Type your message..."
className="flex-1 p-3 border rounded-full"
>

</input>

<button
onClick={()=>sendMessage()}
className="p-3 rounded-full bg-purple-600 text-white"
>
<Send size={18}/>
</button>

<button
onClick={()=>setSpeakEnabled(!speakEnabled)}
className={`p-3 rounded-full ${
speakEnabled?"bg-green-500 text-white":"bg-gray-300"
}`}
>
<Volume2 size={18}/>
</button>

</div>

</div>

</div>

</div>

)

}